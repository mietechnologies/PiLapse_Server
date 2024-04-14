const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit();
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.MONGO_URI;

mongoose.connect(DB).then(() => console.log('DB connected successfully!'));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
