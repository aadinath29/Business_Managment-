const express = require('express');
const authController = require('../controllers/authController');
const { authenticate, authorize, tenantGuard } = require('../middlewares/authMiddleware');
const { ROLES } = require('../constants/authConstants');

const router = express.Router();

// Public Authentication endpoints
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected Authentication endpoints
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getMe);

// RBAC Protected Test endpoint (Admin & Super Admin only)
router.get(
  '/test-protected',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Access granted to protected admin resource',
      data: {
        user: req.user
      }
    });
  }
);

// Multi-Tenancy Scoped Test endpoint
router.get(
  '/test-tenant/:tenantId',
  authenticate,
  tenantGuard,
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Access granted to tenant isolated resource',
      data: {
        tenantId: req.tenantId,
        user: req.user
      }
    });
  }
);

module.exports = router;
