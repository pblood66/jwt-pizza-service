const request = require('supertest');
const app = require('../service');
const { createAdminUser } = require('./testUtil');

let user = { name: 'diner', password: 'a' };
let userToken;
let admin;
let adminToken;
let menuItemId;

beforeAll(async () => {
  // normal user
  user.email = Math.random().toString(36).slice(2) + '@test.com';
  const reg = await request(app).post('/api/auth').send(user);
  userToken = reg.body.token;

  // admin
  admin = await createAdminUser();
  const login = await request(app)
    .put('/api/auth')
    .send({ email: admin.email, password: admin.password });
  adminToken = login.body.token;
});

test('get menu', async () => {
  const res = await request(app).get('/api/order/menu');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test('non-admin cannot add menu item', async () => {
  const res = await request(app)
    .put('/api/order/menu')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ title: 'Hack Pizza', price: 1 });

  expect(res.status).toBe(403);
});

test('admin adds menu item', async () => {
  const res = await request(app)
    .put('/api/order/menu')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Student Special',
      description: 'carbs only',
      image: 'pizza.png',
      price: 0.01,
    });

  expect(res.status).toBe(200);
  expect(res.body.some(i => i.title === 'Student Special')).toBe(true);
  menuItemId = res.body.find(i => i.title === 'Student Special').id;
});

test('get orders for user', async () => {
  const res = await request(app)
    .get('/api/order')
    .set('Authorization', `Bearer ${userToken}`);

  expect(res.status).toBe(200);
  expect(res.body.orders).toBeDefined();
});

test('create order success', async () => {
  const res = await request(app)
    .post('/api/order')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      franchiseId: 1,
      storeId: 1,
      items: [{ menuId: menuItemId, description: 'Student Special', price: 0.01 }],
    });

  expect(res.status).toBe(200);
  expect(res.body.order).toBeDefined();
});

