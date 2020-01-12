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

// Make a reservation
// requires: vtname, dlicense, location, city, fromdate, todate, fromtime, totime
// @return data: tuple if found, error if not found
app.post('/send', query.send);

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});