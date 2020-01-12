const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWRD,
    port: process.env.DB_PORT,
});

async function init() {
    await resetTables();
    await createTables();
}

async function resetTables() {
    try {
        await pool.query(`DROP SCHEMA public CASCADE`);
        await pool.query(`CREATE SCHEMA public`);
    } catch (error) {
        console.log(error);
    }
}

async function createTables() {
    try {
        await pool.query(`CREATE TABLE client (
            keyword VARCHAR(100),
            client VARCHAR(50),
            therapist VARCHAR(50),
            anger FLOAT(10),
            contempt FLOAT(10),
            disgust FLOAT(10),
            fear FLOAT(10),
            happiness FLOAT(10),
            neutral FLOAT(10),
            sadness FLOAT(10),
            surprise FLOAT(10),
            PRIMARY KEY (keyword, client)
        )`);
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    init
};