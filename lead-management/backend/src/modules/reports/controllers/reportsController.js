const reportsService = require('../services/reportsService');
const logger = require('../../../config/logger');

const getBranchSnapshot = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const data = await reportsService.getBranchSnapshot(tenantId);
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error fetching branch snapshot reports:', error);
    next(error);
  }
};

const downloadBranchSnapshotExcel = async (req, res, next) => {
  try {
    const tenantId = req.user.tenant_id;
    const { name, email } = req.user;
    
    // Log audit trail
    logger.info(`User ${email} (${name}) requested Branch Snapshot Excel download for Tenant ${tenantId}`);
    
    const buffer = await reportsService.generateBranchSnapshotExcel(tenantId, name || email || 'SUPER_ADMIN');
    
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `branch_snapshot_${dateStr}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    res.send(buffer);
  } catch (error) {
    logger.error('Error generating branch snapshot excel:', error);
    next(error);
  }
};

module.exports = {
  getBranchSnapshot,
  downloadBranchSnapshotExcel,
};
