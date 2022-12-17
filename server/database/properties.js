const pool = require('./connect').pool;

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

  const sqlClause = (params) => params.length > 1 ? 'AND' : 'WHERE';

  const dollarsToCents = (dollars) => dollars * 100;

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

  return pool.query(queryString, queryParams)
        .then((res) => res.rows)
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
  const queryParams = Object.values(property);
  const queryString = `INSERT INTO properties(
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
    return res.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });
};
exports.addProperty = addProperty;
