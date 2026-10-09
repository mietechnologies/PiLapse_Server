const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');

const app = express();

const AppError = require('./utils/appError');
const infoRouter = require('./routes/infoRoutes');
const userRouter = require('./routes/userRoutes');
const piRouter = require('./routes/piRoutes');
const globalErrorHandler = require('./controllers/errorController');

// MIDDLEWARE

// Set when running behind a reverse proxy so rate limits see client IPs.
if (process.env.TRUST_PROXY) {
  app.set(
    'trust proxy',
    Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY
  );
}

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(helmet());

// Only the login and signup routes are rate limited. Photo uploads are
// authenticated and can legitimately arrive every few seconds from several
// Pis behind one router.
const authLimiter = rateLimit({
  max: Number(process.env.AUTH_RATE_LIMIT) || 25,
  windowMs: 20 * 60 * 1000,
  message:
    'There have been too many requests from this IP. Please try your request later.',
});

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

app.use('/api/v1/info', infoRouter);
app.use(['/api/v1/user/login', '/api/v1/user/signup'], authLimiter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/pi', piRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
