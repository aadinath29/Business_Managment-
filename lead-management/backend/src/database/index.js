const { Pool } = require('pg');
const logger = require('../config/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // Connection Pool configuration settings
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONN_TIMEOUT || '2000', 10),
});

// Centralized error handler for idle clients
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

module.exports = {
  /**
   * Standard query method to execute sql query and release connection immediately
   * @param {string} text - SQL Query String
   * @param {Array} params - Query Parameters
   * @returns {Promise<import('pg').QueryResult>}
   */
  query: (text, params) => {
    logger.debug(`Executing query: ${text} | Params: ${JSON.stringify(params)}`);
    return pool.query(text, params);
  },
  
  /**
   * Method to acquire a dedicated client from the pool. Use for transactions.
   * @returns {Promise<import('pg').PoolClient>}
   */
  getClient: () => pool.connect(),
  
  /**
   * Expose pool for shutdown sequences or testing
   */
  pool
};
