/**
 * Live integration tests that call the real Google GenAI APIs.
 * These tests are intended to run in CI only when real credentials are provided.
 * They will skip if required env vars are not set.
 */

const request = require('supertest');
const app = require('../index');

const API_KEY = process.env.API_KEY || process.env.GENAI_API_KEY;

if (!API_KEY) {
  console.warn('Skipping live integration tests: API_KEY not set');
  process.exit(0);
}

// Small smoke test to ensure server can call the GenAI SDK with a real key
describe('Live integration (requires API_KEY)', () => {
  afterAll(() => {
    if (app && app.close) app.close();
  });

  test('issue-token and analyze-scene (live)', async () => {
    const issue = await request(app).post('/issue-token').set('Authorization', `Bearer ${process.env.SHARED_ISSUANCE_TOKEN}`);
    expect(issue.statusCode).toBe(200);
    const token = issue.body.token;

    const res = await request(app)
      .post('/api/temporal-echo')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('era');
    expect(res.body).toHaveProperty('description');
  }, 20000);
});
