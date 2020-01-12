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

    const image = request.body.image;
    console.log(image);
    const conversation = request.body.conversation;
    console.log(conversation);
    const emotionData = await processImage(image);
    console.log(emotionData);
    const keywordArr = await processConversation(conversation);
    console.log(keywordArr);
    // TODO put into pg
}

async function processImage(image) {

    const requestURL = "https://pocket-therapist.cognitiveservices.azure.com/face/v1.0/detect";
    const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/3/37/Dagestani_man_and_woman.jpg';
    const subscriptionKey = 'c7c46173f02741f584c590b5e731582b';
    const params = {
        'returnFaceId': 'false',
        'returnFaceLandmarks': 'false',
        'returnFaceAttributes': 'emotion',
    };
    const options = {
        uri: requestURL,
        qs: params,
        body: '{"url": ' + '"' + imageUrl + '"}',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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

module.exports = {
    send
};