const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate, authorize, tenantGuard } = require('../../../auth/middlewares/authMiddleware');
const { ROLES } = require('../../../auth/constants/authConstants');

// Securing all report routes strictly for SUPER_ADMIN
router.use(authenticate);
router.use(tenantGuard);
router.use(authorize(ROLES.SUPER_ADMIN));

router.get('/branches', reportsController.getBranchSnapshot);
router.get('/branches/download', reportsController.downloadBranchSnapshotExcel);

module.exports = router;
