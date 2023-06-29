const express = require('express');
const authController = require('../controllers/authController');
const piController = require('../controllers/piController');
const photoController = require('../controllers/photoController');

const router = express.Router();

router.get('/all', piController.getAll);

router.use(authController.protect);

router.post('/add', piController.add);
router.route('/:id').get(piController.getPi);

router
  .route('/:id/photos')
  .post(
    photoController.uploadPhotos,
    photoController.resizeImages,
    photoController.addPhoto
  )
  .get(photoController.getPhotos);

router.get('/:id/:file', photoController.getPhoto);
module.exports = router;
