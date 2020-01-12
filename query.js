const {Pool} = require('pg');
require('dotenv').config();
const moment = require('moment');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWRD,
    port: process.env.DB_PORT,
});

function createReserve(request, response) {
    // assume all params are valid strings
    const vtname = request.body.vtname;
    const dlicense = request.body.dlicense;
    const location = request.body.location;
    const city = request.body.city;
    const fromdate = request.body.fromdate;
    const todate = request.body.todate;
    const fromtime = request.body.fromtime;
    const totime = request.body.totime;
    // query: check if such vehicle is available
    let rentResult;
    return pool.query(`SELECT * from vehicletype WHERE vtname = $1`, [vtname]).then(result => {
        if (result.rows.length === 0) {
            return Promise.reject({message: "Given vehicle type does not exist."});
        }
        return pool.query(`SELECT * from vehicle WHERE location = $1 AND city = $2`, [location, city]);
    })
        .then(result => {
            if (result.rows.length === 0) {
                return Promise.reject({message: "Given branch does not exist."});
            }
            return pool.query(`SELECT * from customer WHERE dlicense = $1`, [dlicense]);
        })
        .then(result => {
            if (result.rows.length === 0) {
                return Promise.reject({message: "No customer found in database with given driver's license."});
            }
            return pool.query(vehicleRentQuery, [vtname, location, city, fromdate, todate, fromtime, totime]);
        })
        .then(result => {
            // throws error if no reservation slot is available
            if (result.rows.length === 0) {
                return Promise.reject({message: "No such vehicle available for rent."});
            }
            rentResult = result;
            return pool.query(vehicleReservationQuery, [vtname, location, city, fromdate, todate, fromtime, totime]);
        })
        .then(reserveResult => {
            if (rentResult.rows.length <= reserveResult.rows.length) {
                return Promise.reject({message: "All such vehicles are either reserved or rented."});
            }
            return pool.query(`SELECT confno FROM reservation WHERE dlicense = $1 AND confno IN
            (SELECT confno FROM rental WHERE rid NOT IN (SELECT rid FROM return))`, [dlicense]);
        }).then(confnoResult => {
            if (confnoResult.rows.length > 0) {
                return Promise.reject({message: "Only one reservation can be made per customer. You have either made a reservation with" +
                        " the confirmation number: " + confnoResult.rows[0].confno + ". Or you're are currently renting using the given reservation number."});
            }
            // perform actual reservation, returning confno
            return pool.query(`INSERT INTO reservation(vtname, dlicense, location, city, fromdate, todate, fromtime, totime)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;`,
                [vtname, dlicense, location, city, fromdate, todate, fromtime, totime]);
        })
        .then(result => {
            // data = confno
            return response.json({
                data: result.rows[0]
            });
        })
        .catch(error => {
            return response.send({
                error: error,
                message: "Problem Creating Reservation"
            });
        });
}

function send(request, response) {
    const image = response.body.image;
    const senetence = response.body.sentence;
    
}

module.exports = {
    getVehicle,
    send
};