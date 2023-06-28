const express = require('express');
const authController = require('../controllers/authController');
const piController = require('../controllers/piController');

const router = express.Router();

router.post('/add', authController.protect, piController.add);
router.get('/:id', authController.protect, piController.getPi);

module.exports = router;
