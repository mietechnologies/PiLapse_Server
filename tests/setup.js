const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.AUTH_RATE_LIMIT = '10000';

let mongo;

beforeAll(async () => {
  process.env.PHOTOS_DIRECTORY = fs.mkdtempSync(
    path.join(os.tmpdir(), 'pilapse-photos-')
  );
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({}))
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
  fs.rmSync(process.env.PHOTOS_DIRECTORY, { recursive: true, force: true });
});
