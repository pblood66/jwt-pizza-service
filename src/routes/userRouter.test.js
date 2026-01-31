const request = require('supertest');
const app = require('../service');
const { createAdminUser } = require('./testUtil');

let normalUser = { name: 'user', password: 'a' };
let normalToken;
let admin;
let adminToken;

function expectValidJwt(token) {
  expect(token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}

function getIdFromToken(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).id;
}

beforeAll(async () => {
  // create normal user via API
  normalUser.email = Math.random().toString(36).slice(2) + '@test.com';
  const reg = await request(app).post('/api/auth').send(normalUser);
  normalToken = reg.body.token;
  expectValidJwt(normalToken);

  // create admin directly in DB
  admin = await createAdminUser();
  const login = await request(app)
    .put('/api/auth')
    .send({ email: admin.email, password: admin.password });

  adminToken = login.body.token;
  expectValidJwt(adminToken);
});

test('get current user', async () => {
  const res = await request(app)
    .get('/api/user/me')
    .set('Authorization', `Bearer ${normalToken}`);

  expect(res.status).toBe(200);
  expect(res.body.email).toBe(normalUser.email);
  expect(res.body.id).toBeDefined();
});

test('User can update self', async () => {
  const userId = getIdFromToken(normalToken);

  const res = await request(app)
    .put(`/api/user/${userId}`)
    .set('Authorization', `Bearer ${normalToken}`)
    .send({
      name: 'updated name',
      email: normalUser.email,
      password: 'newpass',
    });

  expect(res.status).toBe(200);
  expect(res.body.user.name).toBe('updated name');
  expectValidJwt(res.body.token);
});

test('User cannot update another user', async () => {
  const otherId = 999999;

  const res = await request(app)
    .put(`/api/user/${otherId}`)
    .set('Authorization', `Bearer ${normalToken}`)
    .send({ name: 'hack' });

  expect(res.status).toBe(403);
  expect(res.body.message).toMatch(/unauthorized/i);
});
