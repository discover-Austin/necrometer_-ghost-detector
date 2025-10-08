process.env.API_KEY = process.env.API_KEY || 'test-api-key';
process.env.SHARED_ISSUANCE_TOKEN = process.env.SHARED_ISSUANCE_TOKEN || 'test-issuance-token';
process.env.JWT_ISSUER_SECRET = process.env.JWT_ISSUER_SECRET || 'test-jwt-secret';
const request = require('supertest');
const app = require('../index');

describe('Proxy server basic tests', () => {
  afterAll(() => {
    // close server if possible
    if (app && app.close) app.close();
  });

  test('health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('issue-token requires issuance token', async () => {
    const res = await request(app).post('/issue-token');
    expect(res.statusCode).toBe(401);
  });
});
