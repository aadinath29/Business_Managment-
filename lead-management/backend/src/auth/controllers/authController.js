const authService = require('../services/authService');
const { loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/authValidator');
const { ValidationError, TokenMissingError } = require('../errors/authErrors');

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.format());
  }
  return result.data;
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const login = async (req, res, next) => {
  try {
    const validatedData = validate(loginSchema, req.body);
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(
      validatedData.email,
      validatedData.password,
      ipAddress,
      userAgent
    );

    setRefreshTokenCookie(res, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken, // returned in response body as fallback
        user: result.user
      }
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const tokenInput = req.body.refreshToken || req.cookies.refreshToken;
    const validatedData = validate(refreshSchema, { refreshToken: tokenInput });
    
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.refresh(validatedData.refreshToken, ipAddress, userAgent);

    setRefreshTokenCookie(res, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const sessionId = req.user.session_id;
    await authService.logout(sessionId);

    res.clearCookie('refreshToken');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    await authService.logoutAll(userId);

    res.clearCookie('refreshToken');

    return res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const user = await authService.getCurrentUser(userId);

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const validatedData = validate(forgotPasswordSchema, req.body);
    
    // We need the frontend origin URL to create the reset link
    // Default to a hardcoded localhost if origin is missing, but preferably use req.headers.origin
    const originUrl = req.headers.origin || 'http://localhost:5173';
    
    await authService.forgotPassword(validatedData.email, originUrl);

    return res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const validatedData = validate(resetPasswordSchema, req.body);
    
    await authService.resetPassword(validatedData.token, validatedData.password);

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.'
    });
  } catch (error) {
    // Note: It's better to catch specific errors (like TokenExpiredError) and return 400 Bad Request
    if (error.message === 'Token is invalid or has expired') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  forgotPassword,
  resetPassword
};
