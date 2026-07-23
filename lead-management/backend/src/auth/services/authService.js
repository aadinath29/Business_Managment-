const crypto = require('crypto');
const authRepository = require('../repositories/authRepository');
const passwordHelper = require('../utils/passwordHelper');
const jwtHelper = require('../utils/jwtHelper');
const {
  InvalidCredentialsError,
  InactiveUserError,
  DeletedUserError,
  InvalidSessionError,
  TokenExpiredError,
  TenantMismatchError
} = require('../errors/authErrors');
const { sendResetEmail } = require('../../utils/email');

/**
 * Handle User Login flow.
 */
const login = async (email, password, ipAddress, userAgent) => {
  // 1. Find user in the database
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new InvalidCredentialsError();
  }

  // 2. Verify password hash
  const isPasswordValid = await passwordHelper.verifyPassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new InvalidCredentialsError();
  }

  // 3. Verify user status
  if (user.status !== 'Active') {
    throw new InactiveUserError();
  }

  // 4. Generate new session UUID
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days

  // 5. Generate Refresh & Access Tokens
  const refreshPayload = {
    session_id: sessionId,
    user_id: user.id,
    tenant_id: user.tenant_id
  };
  const refreshToken = jwtHelper.generateRefreshToken(refreshPayload);
  const hashedRefreshToken = await passwordHelper.hashPassword(refreshToken);

  const accessPayload = {
    user_id: user.id,
    tenant_id: user.tenant_id,
    role: user.role_name,
    session_id: sessionId
  };
  const accessToken = jwtHelper.generateAccessToken(accessPayload);

  // 6. Save Session in Database
  await authRepository.createSession(
    sessionId,
    user.id,
    hashedRefreshToken,
    ipAddress,
    userAgent,
    expiresAt
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role_name,
      tenantId: user.tenant_id,
      status: user.status
    }
  };
};

/**
 * Handle Refresh Token Rotation flow.
 */
const refresh = async (refreshToken, ipAddress, userAgent) => {
  // 1. Verify token signature and expiration
  const decoded = jwtHelper.verifyRefreshToken(refreshToken);
  const { session_id, user_id, tenant_id } = decoded;

  // 2. Look up the session in the database
  const session = await authRepository.findSession(session_id);
  if (!session) {
    throw new InvalidSessionError('Session has been revoked or invalidated');
  }

  // 3. Verify matching refresh token hash
  const isMatch = await passwordHelper.verifyPassword(refreshToken, session.token);
  if (!isMatch) {
    // Replay attack / compromise warning
    await authRepository.deleteSession(session_id);
    throw new InvalidSessionError('Token reuse or compromise detected');
  }

  // 4. Verify session expiry
  if (new Date() > new Date(session.expires_at)) {
    await authRepository.deleteSession(session_id);
    throw new TokenExpiredError('Session has expired');
  }

  // 5. Verify user status
  const user = await authRepository.findUserById(user_id);
  if (!user) {
    throw new DeletedUserError();
  }
  if (user.status !== 'Active') {
    throw new InactiveUserError();
  }
  if (user.tenant_id !== tenant_id) {
    throw new TenantMismatchError();
  }

  // 6. Perform Refresh Token Rotation (RTR)
  // Delete old session row
  await authRepository.deleteSession(session_id);

  // Generate new session ID and expiry
  const newSessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days

  // Generate new tokens
  const newRefreshPayload = {
    session_id: newSessionId,
    user_id: user.id,
    tenant_id: user.tenant_id
  };
  const newRefreshToken = jwtHelper.generateRefreshToken(newRefreshPayload);
  const hashedNewRefreshToken = await passwordHelper.hashPassword(newRefreshToken);

  const newAccessPayload = {
    user_id: user.id,
    tenant_id: user.tenant_id,
    role: user.role_name,
    session_id: newSessionId
  };
  const newAccessToken = jwtHelper.generateAccessToken(newAccessPayload);

  // Create new session row
  await authRepository.createSession(
    newSessionId,
    user.id,
    hashedNewRefreshToken,
    ipAddress,
    userAgent,
    expiresAt
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

/**
 * Revoke specific session (Logout).
 */
const logout = async (sessionId) => {
  return authRepository.deleteSession(sessionId);
};

/**
 * Revoke all sessions for a user (Logout all devices).
 */
const logoutAll = async (userId) => {
  return authRepository.deleteAllUserSessions(userId);
};

/**
 * Retrieve current user profile.
 */
const getCurrentUser = async (userId) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new DeletedUserError();
  }
  if (user.status !== 'Active') {
    throw new InactiveUserError();
  }
  return {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    role: user.role_name,
    tenantId: user.tenant_id,
    status: user.status
  };
};

/**
 * Handle Forgot Password flow.
 */
const forgotPassword = async (email, originUrl) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    // Return success anyway to prevent email enumeration attacks
    return true;
  }
  if (user.status !== 'Active') {
    return true;
  }

  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Set expiry to 1 hour from now
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 

  await authRepository.savePasswordResetToken(user.id, resetToken, expiresAt);

  const resetUrl = `${originUrl}/reset-password?token=${resetToken}`;
  await sendResetEmail(user.email, resetUrl);

  return true;
};

/**
 * Handle Reset Password flow.
 */
const resetPassword = async (token, newPassword) => {
  const user = await authRepository.findUserByResetToken(token);
  if (!user) {
    throw new Error('Token is invalid or has expired'); // In a real app, define a specific Error class
  }

  const passwordHash = await passwordHelper.hashPassword(newPassword);
  await authRepository.updatePassword(user.id, passwordHash);
  
  // Optionally log the user out of all existing sessions for security
  await authRepository.deleteAllUserSessions(user.id);

  return true;
};

module.exports = {
  login,
  refresh,
  logout,
  logoutAll,
  getCurrentUser,
  forgotPassword,
  resetPassword
};
