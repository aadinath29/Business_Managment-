const db = require('./index');
const logger = require('../config/logger');

/**
 * Executes a set of operations in a transaction block.
 * Automatically acquires, configures (BEGIN/COMMIT/ROLLBACK), and releases the client.
 * 
 * @param {function(import('pg').PoolClient): Promise<any>} callback - Operations to execute
 * @returns {Promise<any>}
 */
const withTransaction = async (callback) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    logger.debug('Database Transaction started');
    const result = await callback(client);
    await client.query('COMMIT');
    logger.debug('Database Transaction committed');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Database Transaction rolled back due to error', error);
    throw error;
  } finally {
    // ALWAYS release client back to the pool
    client.release();
    logger.debug('Database Transaction client released back to pool');
  }
};

module.exports = { withTransaction };
