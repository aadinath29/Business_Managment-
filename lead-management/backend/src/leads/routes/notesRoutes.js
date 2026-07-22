const express = require('express');
const leadController = require('../controllers/leadController');


const router = express.Router();




router.get('/:id', leadController.getNoteById);
router.patch('/:id', leadController.updateNote);
router.delete('/:id', leadController.deleteNote);

module.exports = router;
