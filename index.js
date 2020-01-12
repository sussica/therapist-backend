const express = require('express');
const app = express();
const port = 8080;
const query = require("./query");
const start = require("./init");

// init body-parser for post
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true, limit: '50mb'}));

const allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    next();
};

app.use(allowCrossDomain);

try {
    const started = start.init();
} catch (error) {
    console.log(error);
}

app.get('/', (request, response) => {
    response.status(200).send('ok');
});

// Endpoints

// @ all returns are returned in json.stringy()

/********
 * url: /send
 * body: {string conversation, string image, string therapist, string client, string timestamp}
 * functionality: calls the apis on conversation and images and store its relative data into pg
 */
app.post('/send', async (request, response) => {
    return await query.send(request, response);
});

app.get('/receive', async (request, response) => {
    return await query.receive(request, response);
})

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
