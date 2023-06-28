const express = require('express');
const authController = require('../controllers/authController');
const piController = require('../controllers/piController');

const router = express.Router();

router.get('/all', piController.getAll);

router.use(authController.protect);

router.post('/add', piController.add);
router.get('/:id', piController.getPi);

module.exports = router;
