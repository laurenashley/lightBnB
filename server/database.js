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

const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = (email) => {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [`${email}`])
    .then((result) => {
      if (result.rows) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = (id) => {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = (user) => {
  return pool
    .query(`INSERT INTO users(name, email, password)
      VALUES($1, $2, $3)
      RETURNING *;`,
      [`${user.name}`, `${user.email}`, `${user.password}`])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = (guest_id, limit = 10) => {
  return pool
    .query(`SELECT reservations.*, properties.*
      FROM reservations
      JOIN properties ON properties.id = reservations.property_id
      WHERE guest_id = $1
      LIMIT $2;`,
      [guest_id, limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const queryParams = [];

  let queryString = `SELECT properties.*, avg(property_reviews.rating) as average_rating
                    FROM properties
                    JOIN property_reviews ON properties.id = property_id
                    `;

  const sqlClause = params => params.length > 1 ? 'AND' : 'WHERE';

  const dollarsToCents = dollars => dollars * 100;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `${sqlClause(queryParams)} owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    const minPrice = dollarsToCents(options.minimum_price_per_night);
    queryParams.push(minPrice);
    queryString += `${sqlClause(queryParams)} cost_per_night >= $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    const maxPrice = dollarsToCents(options.maximum_price_per_night);
    queryParams.push(maxPrice);
    // if min price filter also present, use BETWEEN for range
    if (options.minimum_price_per_night) {
      queryString += `${sqlClause(queryParams)} cost_per_night BETWEEN $${queryParams.length - 1} AND $${queryParams.length} `;
    } else {
      queryString += `${sqlClause(queryParams)} cost_per_night <= $${queryParams.length} `;
    }
  }

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `${sqlClause(queryParams)} property_reviews.rating >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `GROUP BY properties.id
                  ORDER BY cost_per_night
                  LIMIT $${queryParams.length};
                  `;

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams).then((res) => res.rows)
  .catch((err) => {
    console.log(err.message);
  });
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = (property) => {
  console.log('properties ', property);
  const queryParams = Object.values(property);
  console.log('params ', queryParams);
  let queryString = `INSERT INTO properties(
                      title,
                      description,
                      number_of_bedrooms,
                      number_of_bathrooms,
                      parking_spaces,
                      cost_per_night,
                      thumbnail_photo_url,
                      cover_photo_url,
                      street,
                      country,
                      city,
                      province,
                      post_code,
                      owner_id)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING *;`;

  return pool.query(queryString, queryParams).then((res) => {
    console.log('added row: ', res.rows[0]);
    return res.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });
};
exports.addProperty = addProperty;
