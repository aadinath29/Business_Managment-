const jwt = require('jsonwebtoken');
const { TokenExpiredError, TokenInvalidError } = require('../errors/authErrors');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1d';
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Generate a JWT Access Token.
 * @param {object} payload 
 * @returns {string}
 */
const generateAccessToken = (payload) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
};

/**
 * Generate a JWT Refresh Token.
 * @param {object} payload 
 * @returns {string}
 */
const generateRefreshToken = (payload) => {
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not defined');
  }
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
};

/**
 * Verify Access Token signature and expiry.
 * @param {string} token 
 * @returns {object} Decoded payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new TokenExpiredError();
    }
    throw new TokenInvalidError();
  }
};

/**
 * Verify Refresh Token signature and expiry.
 * @param {string} token 
 * @returns {object} Decoded payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new TokenExpiredError('Refresh token has expired');
    }
    throw new TokenInvalidError('Refresh token signature is invalid');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
