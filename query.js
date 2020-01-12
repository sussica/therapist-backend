const {
  Pool
} = require('pg');
const request = require('request');
require('dotenv').config();
const moment = require('moment');



const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWRD,
  port: process.env.DB_PORT,
});


async function send(request, response) {
  // const image = response.body.image;
  // const conversation = response.body.conversation;
   const image = 0;
  const emotionData = await processImage(image);
  const keyword = await processConversation(conversation);
  return emotionData;
  // TODO store into pg
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
    body: '{"url": ' + '"' + imageUrl + '"}' ,
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': subscriptionKey
    }
  };

  request.post(options, (error, response, body) => {
    if (error) {
      console.log('Error: ', error);
      return;
    }
    let jsonResponse = JSON.stringify(JSON.parse(body), null, '  ');
    console.log('JSON Response\n');
    console.log(jsonResponse);
  });
}

async function processConversation(sentence) {
  const params = {
    // Request params
  }
}

module.exports = {
  // getVehicle,
  send
};
