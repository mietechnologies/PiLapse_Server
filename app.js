const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const pug = require('pug');

const app = express();

const AppError = require('./utils/appError');
const userRouter = require('./routes/userRoutes');
const piRouter = require('./routes/piRoutes');
const globalErrorHandler = require('./controllers/errorController');

// MIDDLEWARE

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());

app.use(helmet());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    max: 25,
    windowMs: 20 * 60 * 1000,
    message:
      'There have been too many requests from this IP. Please try your request later.',
  });
  app.use('*', limiter);
}

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(mongoSanitize());

app.use(xss());

app.use(compression());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES

app.use('/user', userRouter);
app.use('/pi', piRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
