const express = require('express');
const leadController = require('../controllers/leadController');
const { authenticate, tenantGuard } = require('../../auth/middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(tenantGuard);

router.get('/:id', leadController.getNoteById);
router.patch('/:id', leadController.updateNote);
router.delete('/:id', leadController.deleteNote);

module.exports = router;
