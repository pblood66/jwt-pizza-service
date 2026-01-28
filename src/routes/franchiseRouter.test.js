const request = require('supertest');
const app = require('../service');
const { expectValidJwt, createAdminUser } = require('./testUtil');

let admin;
let adminToken;
let user;
let userToken;

beforeAll(async () => {
  // Create admin directly
  admin = await createAdminUser();

  const adminLogin = await request(app)
    .put('/api/auth')
    .send({ email: admin.email, password: admin.password });

  adminToken = adminLogin.body.token;
  expectValidJwt(adminToken);

  // Create normal user
  user = {
    name: 'normal user',
    email: Math.random().toString(36).slice(2) + '@test.com',
    password: 'a',
  };

  const regRes = await request(app).post('/api/auth').send(user);
  userToken = regRes.body.token;
  expectValidJwt(userToken);
});

test('get all franchises', async () => {
  const res = await request(app).get('/api/franchise?page=0&limit=10');

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.franchises)).toBe(true);
  expect(res.body.more).toBeDefined();
});
