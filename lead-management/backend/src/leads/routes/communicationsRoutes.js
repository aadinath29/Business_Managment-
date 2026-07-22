const express = require('express');
const leadController = require('../controllers/leadController');


const router = express.Router();




router.get('/:id', leadController.getCommunicationById);
router.patch('/:id', leadController.updateCommunication);
router.delete('/:id', leadController.deleteCommunication);

module.exports = router;
