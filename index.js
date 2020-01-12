const express = require('express');
const app = express();
const port = 8080;
const query = require("./query");
// const start = require("./init");

// init body-parser for post
app.use(express.json());
app.use(express.urlencoded({
    extended: true,
}));

const allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    next();
};

app.use(allowCrossDomain);

/* try {
    const started = start.init();
} catch (error) {
    console.log(error);
} */

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
    await query.send();
});

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
