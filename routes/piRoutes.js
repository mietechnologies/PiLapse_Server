const express = require('express');
const authController = require('../controllers/authController');
const piController = require('../controllers/piController');
const photoController = require('../controllers/photoController');

const router = express.Router();

router.use(authController.protectUserOrDevice);

router.get('/', authController.usersOnly, piController.getMine);
router.post('/add', authController.usersOnly, piController.add);

router.use('/:id', piController.loadPi);

router.get('/:id', piController.getPi);

router
  .route('/:id/token')
  .post(authController.usersOnly, piController.rotateToken)
  .delete(authController.usersOnly, piController.revokeToken);

router
  .route('/:id/photos')
  .post(photoController.uploadPhotos, photoController.savePhoto)
  .get(photoController.getPhotos);

router.get('/:id/photos/:photoId', photoController.getPhoto);

module.exports = router;
