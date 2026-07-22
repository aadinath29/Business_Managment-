const express = require('express');
const leadController = require('../controllers/leadController');


const router = express.Router();




router.get('/:id', leadController.getFollowupById);
router.patch('/:id', leadController.updateFollowup);
router.delete('/:id', leadController.deleteFollowup);

module.exports = router;
