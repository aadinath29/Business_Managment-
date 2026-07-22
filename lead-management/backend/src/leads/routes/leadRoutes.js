const express = require('express');
const leadController = require('../controllers/leadController');
const projectController = require('../controllers/projectController');
const deliveryCSController = require('../controllers/deliveryCSController');

const router = express.Router();

// Route mappings for nested lead assignments & projects
router.post('/:id/assign', projectController.assignLead);
router.patch('/:id/reassign', projectController.reassignLead);
router.get('/:id/assignment', projectController.getLeadAssignment);
router.get('/:id/assignment-history', projectController.getLeadAssignmentHistory);
router.post('/:id/project', projectController.createProject);

// Route mappings for nested sub-resources (Delivery & CS)
router.post('/:id/delivery', deliveryCSController.createDelivery);
router.get('/:id/delivery', deliveryCSController.getDeliveryByLeadId);
router.post('/:id/customer-success', deliveryCSController.createCustomerSuccess);
router.get('/:id/customer-success', deliveryCSController.getCSByLeadId);

// Route mappings for nested sub-resources (Requirements & Proposals)
router.post('/:id/requirements', leadController.createRequirement);
router.get('/:id/requirements', leadController.getRequirements);

router.post('/:id/proposals', leadController.createProposal);
router.get('/:id/proposals', leadController.getProposals);

// Route mappings for sub-resources (Notes, Communications, Follow-ups)
router.post('/:id/notes', leadController.createNote);
router.get('/:id/notes', leadController.getNotes);

router.post('/:id/communications', leadController.createCommunication);
router.get('/:id/communications', leadController.getCommunications);

router.post('/:id/followups', leadController.createFollowup);
router.get('/:id/followups', leadController.getFollowups);

// Route mappings for Journey and Timeline
router.get('/:id/journey', leadController.getLeadJourney);
router.patch('/:id/journey', leadController.updateLeadJourney);
router.get('/:id/timeline', leadController.getLeadTimeline);

// Standard CRUD Route mappings
router.post('/', leadController.createLead);
router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLeadById);
router.patch('/:id', leadController.updateLead);
router.delete('/:id', leadController.deleteLead);

module.exports = router;
