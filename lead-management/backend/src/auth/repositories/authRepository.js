const db = require('../../database');

/**
 * Finds user by email address, including their role details.
 * @param {string} email 
 * @returns {Promise<object|null>}
 */
const findUserByEmail = async (email) => {
  const queryText = `
    SELECT u.id, u.tenant_id, u.role_id, u.email, u.password_hash, 
           u.first_name, u.last_name, u.status, u.deleted_at, r.name as role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE LOWER(u.email) = LOWER($1) AND u.deleted_at IS NULL
  `;
  const { rows } = await db.query(queryText, [email]);
  return rows.length ? rows[0] : null;
};

/**
 * Finds user by user ID, including their role details.
 * @param {string} id 
 * @returns {Promise<object|null>}
 */
const findUserById = async (id) => {
  const queryText = `
    SELECT u.id, u.tenant_id, u.role_id, u.email, 
           u.first_name, u.last_name, u.status, u.deleted_at, r.name as role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = $1 AND u.deleted_at IS NULL
  `;
  const { rows } = await db.query(queryText, [id]);
  return rows.length ? rows[0] : null;
};

/**
 * Find a specific login session by ID.
 * @param {string} sessionId 
 * @returns {Promise<object|null>}
 */
const findSession = async (sessionId) => {
  const queryText = 'SELECT * FROM login_sessions WHERE id = $1';
  const { rows } = await db.query(queryText, [sessionId]);
  return rows.length ? rows[0] : null;
};

/**
 * Creates a new login session in the database.
 * @param {string} sessionId
 * @param {string} userId 
 * @param {string} hashedToken 
 * @param {string|null} ipAddress 
 * @param {string|null} userAgent 
 * @param {Date} expiresAt 
 * @returns {Promise<object>} Created session
 */
const createSession = async (sessionId, userId, hashedToken, ipAddress, userAgent, expiresAt) => {
  const queryText = `
    INSERT INTO login_sessions (id, user_id, token, ip_address, user_agent, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const { rows } = await db.query(queryText, [sessionId, userId, hashedToken, ipAddress, userAgent, expiresAt]);
  return rows[0];
};

/**
 * Updates a session with a new token and expiry for refresh token rotation.
 * @param {string} sessionId 
 * @param {string} newHashedToken 
 * @param {Date} expiresAt 
 * @returns {Promise<object>} Updated session
 */
const updateSessionToken = async (sessionId, newHashedToken, expiresAt) => {
  const queryText = `
    UPDATE login_sessions
    SET token = $1, expires_at = $2
    WHERE id = $3
    RETURNING *
  `;
  const { rows } = await db.query(queryText, [newHashedToken, expiresAt, sessionId]);
  return rows[0];
};

/**
 * Deletes a session by ID.
 * @param {string} sessionId 
 * @returns {Promise<boolean>} True if deleted, else false
 */
const deleteSession = async (sessionId) => {
  const queryText = 'DELETE FROM login_sessions WHERE id = $1';
  const { rowCount } = await db.query(queryText, [sessionId]);
  return rowCount > 0;
};

/**
 * Deletes all sessions for a specific user.
 * @param {string} userId 
 * @returns {Promise<number>} Number of deleted sessions
 */
const deleteAllUserSessions = async (userId) => {
  const queryText = 'DELETE FROM login_sessions WHERE user_id = $1';
  const { rowCount } = await db.query(queryText, [userId]);
  return rowCount;
};

module.exports = {
  findUserByEmail,
  findUserById,
  findSession,
  createSession,
  updateSessionToken,
  deleteSession,
  deleteAllUserSessions
};
