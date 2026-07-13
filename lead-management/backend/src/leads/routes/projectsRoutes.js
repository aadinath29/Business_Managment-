const express = require('express');
const projectController = require('../controllers/projectController');
const { authenticate, tenantGuard } = require('../../auth/middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(tenantGuard);

// Project Statistics
router.get('/statistics', projectController.getProjectStatistics);

// Standard Project CRUD
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.patch('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Execution progress update
router.patch('/:id/progress', projectController.updateProjectProgress);

module.exports = router;
