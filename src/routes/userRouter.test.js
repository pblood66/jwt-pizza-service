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
