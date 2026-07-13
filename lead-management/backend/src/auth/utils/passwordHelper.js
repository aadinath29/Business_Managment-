const bcrypt = require('bcrypt');

/**
 * Hash a plaintext password using bcrypt.
 * @param {string} password 
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verify a plaintext password against a hash.
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  verifyPassword
};
