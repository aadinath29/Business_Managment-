const express = require('express');
const projectController = require('../controllers/projectController');


const router = express.Router();




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
