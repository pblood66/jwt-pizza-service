const request = require('supertest');
const app = require('../service');
const { createAdminUser, expectValidJwt } = require('./testUtil');

let user = { name: 'franchiseUser', password: 'a' };
let userToken;
let userId;

let admin;
let adminToken;

let franchiseId;
let storeId;

function getIdFromToken(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).id;
}

beforeAll(async () => {
    // create normal user
    user.email = Math.random().toString(36).slice(2) + '@test.com';
    const reg = await request(app).post('/api/auth').send(user);
    userToken = reg.body.token;
    userId = getIdFromToken(userToken);
    expectValidJwt(userToken);

    // create admin
    admin = await createAdminUser();
    const login = await request(app)
        .put('/api/auth')
        .send({ email: admin.email, password: admin.password });

    adminToken = login.body.token;
    expectValidJwt(adminToken);
});

test('List franchises', async () => {
    const res = await request(app).get('/api/franchise?page=0&limit=10');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('franchises');
    expect(res.body).toHaveProperty('more');
});