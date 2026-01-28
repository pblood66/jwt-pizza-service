const request = require('supertest');
const app = require('../service');
const { createAdminUser, expectValidJwt } = require('./testUtil');

let user = { name: 'franchiseUser', password: 'a' };
let userToken;

let admin;
let adminToken;

let franchiseId;
let storeId;


beforeAll(async () => {
    // create normal user
    user.email = Math.random().toString(36).slice(2) + '@test.com';
    const reg = await request(app).post('/api/auth').send(user);
    userToken = reg.body.token;
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

test('Normal user cannot create franchise', async () => {
    const res = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Illegal Franchise' });

    expect(res.status).toBe(403);
});


test('Unrelated user cannot create store', async () => {
    // create second user
    const otherUser = {
        name: 'other',
        email: Math.random().toString(36).slice(2) + '@test.com',
        password: 'a',
    };

    const reg = await request(app).post('/api/auth').send(otherUser);
    const otherToken = reg.body.token;

    const res = await request(app)
        .post(`/api/franchise/${franchiseId}/store`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Hack Store' });

    expect(res.status).toBe(403);
});

test('Admin can delete store', async () => {
    const res = await request(app)
        .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/store deleted/i);
});

test('Admin can delete franchise', async () => {
    const res = await request(app)
        .delete(`/api/franchise/${franchiseId}`)
        .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/franchise deleted/i);
});
