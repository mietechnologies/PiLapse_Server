const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const missing = ['MONGO_URI', 'JWT_SECRET', 'PHOTOS_DIRECTORY'].filter(
  (key) => !process.env[key]
);
if (missing.length) {
  console.error(
    `Missing required environment variables: ${missing.join(', ')}`
  );
  process.exit(1);
}
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

const app = require('./app');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('DB connected successfully!'))
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
