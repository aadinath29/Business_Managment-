const express = require('express');
const leadController = require('../controllers/leadController');


const router = express.Router();




router.get('/:id', leadController.getRequirementById);
router.patch('/:id', leadController.updateRequirement);
router.delete('/:id', leadController.deleteRequirement);

module.exports = router;
