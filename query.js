const {
    Pool
} = require('pg');
require('dotenv').config();
const moment = require('moment');
const request = require('request-promise');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWRD,
    port: process.env.DB_PORT,
});

async function send(request, response) {

    // Buffer allows Face API to recognize base64
    const image = Buffer.from(request.body.image, "base64");
    // console.log(image);
    const conversation = request.body.conversation;
    // console.log(conversation);
    const emotionData = await processImage(image);
    // console.log(emotionData);
    const keywordArr = await processConversation(conversation);
    // console.log(keywordArr);
    const client = request.body.client;
    const therapist = request.body.therapist;
    const timestamp = request.body.timestamp;

    // Append strings for tuple compactness
    // Example: "tj", "UBC", "bomb" -> "tj UBC bomb".
    // No longer supported [TW]
    /* const keywordtr = await appendString(keywordArr);
    console.log(keywordtr); */

    // Returns an array of integers representing:
    // anger, contempt, disgust, fear, happiness, neutral, sadness, surprise
    // in order
    const emotionObj = await extractEmotionArr(emotionData);

    for (keyword of keywordArr) {
        const check = await pool.query(`SELECT * FROM client WHERE keyword = $1 AND client = $2`, [keyword, client]);
        if (check.rowCount > 0) {
            const tuple = check.rows[0];
            tuple.anger = (tuple.anger + emotionObj.anger) / 2;
            tuple.contempt = (tuple.contempt + emotionObj.contempt) / 2;
            tuple.disgust = (tuple.disgust + emotionObj.disgust) / 2;
            tuple.fear = (tuple.fear + emotionObj.fear) / 2;
            tuple.happiness = (tuple.happiness + emotionObj.happiness) / 2;
            tuple.neutral = (tuple.neutral + emotionObj.neutral) / 2;
            tuple.sadness = (tuple.sadness + emotionObj.sadness) / 2;
            tuple.surprise = (tuple.surprise + emotionObj.surprise) / 2;
            await pool.query(`UPDATE client
                SET anger = $1, contempt = $2, disgust = $3, fear = $4, happiness = $5, neutral = $6, sadness = $7, surprise = $8
                WHERE keyword = $9 AND client = $10`,
                [tuple.anger, tuple.contempt, tuple.disgust, tuple.fear, tuple.happiness, tuple.neutral, tuple.sadness, tuple.surprise, keyword, client]);
        } else {
            await pool.query(`INSERT INTO client(keyword, client, therapist, anger, contempt, disgust, fear, happiness, neutral, sadness, surprise)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [keyword, client, therapist, emotionObj.anger, emotionObj.contempt, emotionObj.disgust, emotionObj.fear, emotionObj.happiness, emotionObj.neutral,
                emotionObj.sadness, emotionObj.surprise]);
        }
    }

    return response.status(200).json({
        data: "success"
    });

}

async function processImage(image) {

    const requestURL = "https://pocket-therapist.cognitiveservices.azure.com/face/v1.0/detect";
    const subscriptionKey = 'c7c46173f02741f584c590b5e731582b';
    const params = {
        'returnFaceId': 'false',
        'returnFaceLandmarks': 'false',
        'returnFaceAttributes': 'emotion',
    };
    const options = {
        uri: requestURL,
        qs: params,
        body: image,
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': subscriptionKey
        }
    };
    let emotionData = {};
    await request(options, (error, response) => {
        if (error) {
            console.log('Error: ', error);
            return;
        }
        const parsedRes = JSON.parse(response.body);
        emotionData = parsedRes;
    });
    return emotionData;

}

async function processConversation(conversation) {

    const params = {
        // Request params
        "showStats": "true",
    };
    const body = {
        "documents": [
            {
                "language": "en",
                "id": "1",
                "text": conversation
            }
        ]
    };
    const clientServerOptions = {
        uri: 'https://pocket-therapist-ta.cognitiveservices.azure.com/text/analytics/v2.1/keyPhrases?showStats',
        qs: params,
        body: JSON.stringify(body),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': '77ef35b98c534c3bbc4e6004787b2f40'
        }
    };
    let keywordArr = [];
    await request(clientServerOptions, function (error, response) {
        if (error) {
            console.log('Error: ', error);
            return;
        }
        const parsedRes = JSON.parse(response.body);
        keywordArr = parsedRes.documents[0].keyPhrases;
    });
    return keywordArr;

}

/* async function appendString(keywordArr) {

    let keywordtr = "";
    let flag = 1;
    for (let i in keywordArr) {
        if (flag) {
            keywordtr = keywordArr[i];
            flag = 0;
        } else {
            keywordtr = keywordtr.concat(" " + keywordArr[i]);
        }
    }
    return keywordtr;

} */

async function extractEmotionArr(emotionData) {

    return emotionData[0].faceAttributes.emotion;

}

async function receive(request, response) {

    const client = request.query.client;

    const clientRes = await pool.query(`SELECT * FROM client WHERE client = $1`, [client]);
    const clientArr = clientRes.rows;

    // console.log(clientArr);

    const clientAvgObj = await calculateAvg(clientArr);

    console.log(clientArr);
    console.log(clientAvgObj);

    for (let x of clientArr) {
        x.anger = x.anger - clientAvgObj.anger;
        x.contempt = x.contempt - clientAvgObj.contempt;
        x.disgust = x.disgust - clientAvgObj.disgust;
        x.fear = x.fear - clientAvgObj.fear;
        x.happiness = x.happiness - clientAvgObj.happiness;
        x.neutral = x.neutral - clientAvgObj.neutral;
        x.sadness = x.sadness - clientAvgObj.sadness;
        x.surprise = x.surprise - clientAvgObj.surprise;
    }

    return response.json({
        data: clientArr
    })
}

async function calculateAvg(clientRows) {

    let totalAnger = 0;
    let totalContempt = 0;
    let totalDisgust = 0;
    let totalFear = 0;
    let totalHappiness = 0;
    let totalNeutral = 0;
    let totalSadness = 0;
    let totalSurprise = 0;
    let count = 0;

    for (let x of clientRows) {
        totalAnger += x.anger;
        totalContempt += x.contempt;
        totalDisgust += x.disgust;
        totalFear += x.fear;
        totalHappiness += x.happiness;
        totalNeutral += x.neutral;
        totalSadness += x.sadness;
        totalSurprise += x.surprise;
        count++;
    }

    const avgAnger = totalAnger / count;
    const avgContempt = totalContempt / count;
    const avgDisgust = totalDisgust / count;
    const avgFear = totalFear / count;
    const avgHappiness = totalHappiness / count;
    const avgNeutral = totalNeutral / count;
    const avgSadness = totalSadness / count;
    const avgSurprise = totalSurprise / count;

    return {anger: avgAnger, contempt: avgContempt, disgust: avgDisgust, fear: avgFear, happiness: avgHappiness,
    neutral: avgNeutral, sadness: avgSadness, surprise: avgSurprise};
}

module.exports = {
    send,
    receive
};