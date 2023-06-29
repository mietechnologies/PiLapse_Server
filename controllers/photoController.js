const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const Photo = require('../models/photoModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('../utils/handlerFactory');
const APIFeatures = require('../utils/apiFeatures');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload images only.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadPhotos = upload.fields([{ name: 'image', maxCount: 1 }]);

exports.resizeImages = catchAsync(async (req, res, next) => {
  if (!req.files.image) return next();
  const dir = `public/photos/${req.params.id}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  req.body.image = `${Date.now()}.jpeg`;
  await sharp(req.files.image[0].buffer)
    .toFormat('jpeg')
    .jpeg({ quality: 100 })
    .toFile(`${dir}/${req.body.image}`);

  next();
});

exports.addPhoto = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Photo.find({ piId: req.params.id }));
  const photos = await features.query;
  req.body.photoNumber = photos.length + 1;
  req.body.piId = req.params.id;

  const photo = await Photo.create(req.body);

  res.status(200).json({
    status: 'success',
    data: {
      photo,
    },
  });
});

exports.getPhotos = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.piId) filter = { piId: req.params.piId };

  const features = new APIFeatures(Photo.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const photos = await features.query;

  res.status(200).json({
    status: 'success',
    results: photos.length,
    data: {
      photos,
    },
  });
});

exports.getPhoto = catchAsync(async (req, res, next) => {
  console.log(__dirname);
  const dir = `public/photos/${req.params.id}/${req.params.file}`;
  if (!fs.existsSync(dir)) {
    return next(
      new AppError(`Photo for file ${req.params.file} doesn't exists.`, 404)
    );
  }

  res.status(200).sendFile(path.join(__dirname, '../', dir));
});

exports.getPhotos = factory.getAll(Photo);