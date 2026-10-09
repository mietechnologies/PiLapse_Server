const request = require('supertest');
const sharp = require('sharp');
const app = require('../app');
const Pi = require('../models/piModel');

const api = request(app);

const signup = (body, token) => {
  const req = api.post('/api/v1/user/signup');
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send({
    name: 'Brett',
    password: 'password123',
    passwordConfirm: 'password123',
    ...body,
  });
};

const login = async (email) => {
  const res = await api
    .post('/api/v1/user/login')
    .send({ email, password: 'password123' });
  return res.body.token;
};

const addPi = (token, name = 'Garden') =>
  api
    .post('/api/v1/pi/add')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, model: 'Raspberry Pi Zero 2 W' });

let jpeg;
beforeAll(async () => {
  jpeg = await sharp({
    create: { width: 8, height: 8, channels: 3, background: '#336699' },
  })
    .jpeg()
    .toBuffer();
});

const uploadPhoto = (piId, auth, fields = {}) => {
  const req = api
    .post(`/api/v1/pi/${piId}/photos`)
    .set('Authorization', auth)
    .attach('image', jpeg, { filename: 'a.jpg', contentType: 'image/jpeg' });
  Object.entries(fields).forEach(([k, v]) => req.field(k, v));
  return req;
};

describe('info', () => {
  it('reports setupRequired until the first account exists', async () => {
    let res = await api.get('/api/v1/info');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      name: 'pilapse-server',
      setupRequired: true,
    });

    await signup({ email: 'owner@example.com' });
    res = await api.get('/api/v1/info');
    expect(res.body.data.setupRequired).toBe(false);
  });
});

describe('signup', () => {
  it('makes the first account the owner and then closes signup', async () => {
    const first = await signup({ email: 'owner@example.com' });
    expect(first.status).toBe(201);
    expect(first.body.data.user.role).toBe('owner');
    expect(first.body.token).toBeDefined();

    const second = await signup({ email: 'stranger@example.com' });
    expect(second.status).toBe(403);
  });

  it('lets the owner create more accounts', async () => {
    const owner = await signup({ email: 'owner@example.com' });
    const res = await signup({ email: 'friend@example.com' }, owner.body.token);
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('user');
    expect(res.body.token).toBeUndefined();

    const friendToken = await login('friend@example.com');
    const blocked = await signup({ email: 'third@example.com' }, friendToken);
    expect(blocked.status).toBe(403);
  });
});

describe('pis and device tokens', () => {
  let ownerToken;
  let friendToken;

  beforeEach(async () => {
    ownerToken = (await signup({ email: 'owner@example.com' })).body.token;
    await signup({ email: 'friend@example.com' }, ownerToken);
    friendToken = await login('friend@example.com');
  });

  it('returns a device token once and never exposes its hash', async () => {
    const res = await addPi(ownerToken);
    expect(res.status).toBe(201);
    expect(res.body.deviceToken).toMatch(/^[0-9a-f]{64}$/);
    expect(res.body.data.pi.deviceTokenHash).toBeUndefined();

    const get = await api
      .get(`/api/v1/pi/${res.body.data.pi._id}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(get.status).toBe(200);
    expect(get.body.deviceToken).toBeUndefined();
    expect(get.body.data.pi.deviceTokenHash).toBeUndefined();
  });

  it('lets two users use the same Pi name', async () => {
    expect((await addPi(ownerToken, 'Kitchen')).status).toBe(201);
    expect((await addPi(friendToken, 'Kitchen')).status).toBe(201);
    expect((await addPi(ownerToken, 'Kitchen')).status).toBe(400);
  });

  it('only lists and returns your own Pis', async () => {
    const mine = (await addPi(ownerToken)).body.data.pi;
    await addPi(friendToken, 'Theirs');

    const list = await api
      .get('/api/v1/pi')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(list.body.data.pis.map((p) => p.name)).toEqual(['Garden']);

    const other = await api
      .get(`/api/v1/pi/${mine._id}`)
      .set('Authorization', `Bearer ${friendToken}`);
    expect(other.status).toBe(404);
  });

  it('requires authentication', async () => {
    expect((await api.get('/api/v1/pi')).status).toBe(401);
    const bad = await api
      .get('/api/v1/pi')
      .set('Authorization', 'Device not-a-real-token');
    expect(bad.status).toBe(401);
  });

  it('accepts photo uploads from the device and files them by intent', async () => {
    const added = await addPi(ownerToken);
    const piId = added.body.data.pi._id;
    const device = `Device ${added.body.deviceToken}`;

    const up = await uploadPhoto(piId, device, {
      intent: 'printer-5s',
      date: '2026-10-08T12:00:00Z',
      temperature: '21.5',
    });
    expect(up.status).toBe(201);
    expect(up.body.data.photo).toMatchObject({
      intent: 'printer-5s',
      photoNumber: 1,
      temperature: 21.5,
    });
    await uploadPhoto(piId, device, { intent: 'printer-30s' });
    await uploadPhoto(piId, device, { intent: 'printer-5s' });

    const pi = await Pi.findById(piId);
    expect([...pi.intents].sort()).toEqual(['printer-30s', 'printer-5s']);
    expect(pi.lastSeenAt).toBeInstanceOf(Date);

    const list = await api
      .get(`/api/v1/pi/${piId}/photos?intent=printer-5s`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(list.status).toBe(200);
    expect(list.body.results).toBe(2);
    expect(list.body.data.photos.map((p) => p.photoNumber)).toEqual([1, 2]);

    const file = await api
      .get(`/api/v1/pi/${piId}/photos/${up.body.data.photo._id}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toMatch(/image\/jpeg/);
  });

  it('rejects a bad intent', async () => {
    const added = await addPi(ownerToken);
    const res = await uploadPhoto(
      added.body.data.pi._id,
      `Device ${added.body.deviceToken}`,
      { intent: '../escape' }
    );
    expect(res.status).toBe(400);
  });

  it('keeps a device out of other Pis and user-only actions', async () => {
    const a = await addPi(ownerToken, 'A');
    const b = await addPi(ownerToken, 'B');
    const device = `Device ${a.body.deviceToken}`;

    expect((await uploadPhoto(b.body.data.pi._id, device)).status).toBe(404);
    expect(
      (await api.get('/api/v1/pi').set('Authorization', device)).status
    ).toBe(403);
    const rotate = await api
      .post(`/api/v1/pi/${a.body.data.pi._id}/token`)
      .set('Authorization', device);
    expect(rotate.status).toBe(403);
  });

  it("keeps one user out of another user's photos", async () => {
    const added = await addPi(ownerToken);
    const piId = added.body.data.pi._id;
    const up = await uploadPhoto(piId, `Device ${added.body.deviceToken}`);

    const list = await api
      .get(`/api/v1/pi/${piId}/photos`)
      .set('Authorization', `Bearer ${friendToken}`);
    expect(list.status).toBe(404);
    const file = await api
      .get(`/api/v1/pi/${piId}/photos/${up.body.data.photo._id}`)
      .set('Authorization', `Bearer ${friendToken}`);
    expect(file.status).toBe(404);
    const upload = await uploadPhoto(piId, `Bearer ${friendToken}`);
    expect(upload.status).toBe(404);
  });

  it('rotates and revokes device tokens', async () => {
    const added = await addPi(ownerToken);
    const piId = added.body.data.pi._id;
    const oldDevice = `Device ${added.body.deviceToken}`;

    const rotated = await api
      .post(`/api/v1/pi/${piId}/token`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(rotated.status).toBe(200);
    expect((await uploadPhoto(piId, oldDevice)).status).toBe(401);
    const newDevice = `Device ${rotated.body.deviceToken}`;
    expect((await uploadPhoto(piId, newDevice)).status).toBe(201);

    const revoked = await api
      .delete(`/api/v1/pi/${piId}/token`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(revoked.status).toBe(204);
    expect((await uploadPhoto(piId, newDevice)).status).toBe(401);
  });
});
