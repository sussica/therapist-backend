const express = require('express');
const app = express();
const port = 8080;
const query = require("./query");
const start = require("./init");

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

// View the number of available vehicles
// requires: vtname, location, city, fromdate, todate, fromtime, totime
// @return data: tuples
app.get('/vehicle/get', query.getVehicle);

// Get reservation information based off confno
// requires: confno
// @return data: singular tuple if found, error if not found
app.get('/reserve/get', query.getReserve);

// Make a reservation
// requires: vtname, dlicense, location, city, fromdate, todate, fromtime, totime
// @return data: tuple if found, error if not found
app.post('/reserve/create', query.createReserve);

// View the information about the customer
// requires: dlicense
// @return data: tuple if found, error if not found
app.get('/customer/get', query.getCustomer);

// Create a new customer profile
// requires: dlicense, cellphone, name, address
// @return data: tuple if found, error if not found
app.post('/customer/create', query.createCustomer);

// Get a rent based off rid
// requires: rid
// @return data: tuple if found, error if not found
app.get('/rent/get', query.getRent);

// Rent a vehicle
// requires: vlicense, dlicense, fromdate, todate, fromtime, totime, cardname, expdate, confno
// requirement: a valid confno from reservation
// @return data: tuple if found, error if not found
app.post('/rent/create', query.createRent);

// Get a return based off rid
// requires: rid
// @return data: tuple if found, error if not found
app.get('/return/get', query.getReturn);

// Return a vehicle
// require: id, date, time, odometer, fulltank, value
// requirement: a valid rid from rental
// @return data: tuple if found, error if not found
app.post('/return/create', query.createReturn);

// Daily Rental Report
// requires: date
// @return data: {vehicle, perCategory, perBranch, perCompany}, where vehicle, perCategory, perBranch: tuples
app.get('/report/rental', query.getDailyRental);

// Daily Rental Report By Branch
// requires: date, location, city
// @return result.rows
app.get('/report/rental/branch', query.getDailyBranchRental);

// Daily Return Report
// requires: date
// @return data: {vehicle, perCategory, revenuePerCategory, perBranch, revenuePerBranch, revenueTotal},
// where vehicle, perCategory, revenuePerCategory, perBranch, revenuePerBranch: tuples
app.get('/report/return', query.getDailyReturn);

// Daily Return Report By Branch
// requires: date, location, city
// @return data: {vehicle, perCategory, revenuePerCategory, perBranch, revenuePerBranch, revenueTotal},
// where vehicle, perCategory, revenuePerCategory, perBranch, revenuePerBranch: tuples
app.get('/report/return/branch', query.getDailyBranchReturn);

app.get('/table/:tableName', query.getTable);

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});