/**
 * Connect to database
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.BD_USER,
  password: process.env.BD_PASSWORD,
  host: process.env.BD_HOST,
  database: process.env.DATABASE
});

module.exports = { pool };
