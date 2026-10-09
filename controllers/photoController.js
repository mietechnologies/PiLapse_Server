const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const Photo = require('../models/photoModel');
const Pi = require('../models/piModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

const photosRoot = () => path.resolve(process.env.PHOTOS_DIRECTORY);

// Intents are the client's profile names.
const INTENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload images only.', 415), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

exports.uploadPhotos = upload.fields([{ name: 'image', maxCount: 1 }]);

exports.savePhoto = catchAsync(async (req, res, next) => {
  const file = req.files && req.files.image && req.files.image[0];
  if (!file) return next(new AppError('No image provided.', 400));

  const intent = req.body.intent || 'default';
  if (!INTENT_PATTERN.test(intent)) {
    return next(
      new AppError(
        'Intent must be 1-64 letters, numbers, dashes or underscores.',
        400
      )
    );
  }

  const date = req.body.date ? new Date(req.body.date) : new Date();
  if (Number.isNaN(date.getTime())) {
    return next(new AppError('Invalid photo date.', 400));
  }

  const dir = path.join(photosRoot(), req.pi.id, intent);
  await fs.promises.mkdir(dir, { recursive: true });

  const filename = `${date.getTime()}-${crypto
    .randomBytes(4)
    .toString('hex')}.jpeg`;
  const fullPath = path.join(dir, filename);

  // Clients already send JPEG; only convert anything else.
  if (file.mimetype === 'image/jpeg') {
    await fs.promises.writeFile(fullPath, file.buffer);
  } else {
    await sharp(file.buffer).jpeg({ quality: 90 }).toFile(fullPath);
  }

  const count = await Photo.countDocuments({ piId: req.pi._id, intent });
  const photo = await Photo.create({
    image: path.posix.join(intent, filename),
    intent,
    temperature: req.body.temperature,
    photoNumber: count + 1,
    date,
    piId: req.pi._id,
    userId: req.pi.userId,
  });

  await Pi.updateOne(
    { _id: req.pi._id },
    { $addToSet: { intents: intent }, $set: { lastSeenAt: new Date() } }
  );

  res.status(201).json({
    status: 'success',
    data: {
      photo,
    },
  });
});

exports.getPhotos = catchAsync(async (req, res, next) => {
  const queryString = { sort: 'date', ...req.query };
  const features = new APIFeatures(Photo.find(), queryString)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  // Applied last so query parameters can't widen it to other Pis.
  features.query = features.query.where({ piId: req.pi._id });
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
  const photo = await Photo.findOne({
    _id: req.params.photoId,
    piId: req.pi._id,
  });
  if (!photo) {
    return next(new AppError('No photo found with that ID', 404));
  }

  const piDir = path.join(photosRoot(), req.pi.id);
  const fullPath = path.resolve(piDir, photo.image);
  if (!fullPath.startsWith(piDir + path.sep) || !fs.existsSync(fullPath)) {
    return next(new AppError('Photo file is missing.', 404));
  }

  res.status(200).sendFile(fullPath);
});
