const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');





// Label routes (global to tenant)
router.get('/labels', taskController.getLabels);
router.post('/labels', taskController.createLabel);

// Lead tasks routes (retrieving and creating)
router.get('/lead/:leadId', taskController.getTasksByLead);
router.post('/lead/:leadId', taskController.createTask);

// Task routes
router.get('/:taskId', taskController.getTaskById);
router.patch('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

// Checklists
router.post('/:taskId/checklist', taskController.createChecklistItem);
router.patch('/:taskId/checklist/:itemId', taskController.updateChecklistItem);
router.delete('/:taskId/checklist/:itemId', taskController.deleteChecklistItem);

// Comments
router.post('/:taskId/comments', taskController.addComment);
router.patch('/:taskId/comments/:commentId', taskController.updateComment);
router.delete('/:taskId/comments/:commentId', taskController.deleteComment);

// Attachments
router.post('/:taskId/attachments', taskController.addAttachment);
router.delete('/:taskId/attachments/:attachmentId', taskController.deleteAttachment);

// Task Labels (assignment)
router.post('/:taskId/labels', taskController.assignLabel);
router.delete('/:taskId/labels/:labelId', taskController.removeLabel);

// Dependencies
router.post('/:taskId/dependencies', taskController.addDependency);
router.delete('/:taskId/dependencies/:dependsOnTaskId', taskController.removeDependency);

module.exports = router;
