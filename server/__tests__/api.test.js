process.env.API_KEY = process.env.API_KEY || 'test-api-key';
process.env.SHARED_ISSUANCE_TOKEN = process.env.SHARED_ISSUANCE_TOKEN || 'test-issuance-token';
process.env.JWT_ISSUER_SECRET = process.env.JWT_ISSUER_SECRET || 'test-jwt-secret';

// Mock the Google GenAI SDK so tests don't call the real API.
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: function () {
      return {
        models: {
          generateContent: jest.fn(async (opts) => {
            // Inspect `opts` to decide what to return for different endpoints
            const contents = opts && opts.contents;
            // For analyze-scene: return objects array
            if (typeof contents === 'object' && contents.parts) {
              return { text: JSON.stringify({ objects: [{ name: 'mock-obj', polylines: [] }] }) };
            }
            // For profile generation: return profile-like object
            const text = typeof contents === 'string' ? contents : (contents && contents.text) || '';
            if (text && text.toLowerCase().includes('generate a short, spooky')) {
              return { text: JSON.stringify({ name: 'MockName', type: 'Poltergeist', backstory: 'A_mock_backstory', instability: 77, contained: false }) };
            }
            // Default fallback
            return { text: JSON.stringify({ transcription: 'whisper', confidence: 0.5 }) };
          }),
          generateImages: jest.fn(async (opts) => {
            // Return a fake base64 payload for the glyph
            return { generatedImages: [{ image: { imageBytes: 'MOCK_BASE64' } }] };
          })
        }
      };
    },
    Type: {
      OBJECT: 'object',
      ARRAY: 'array',
      STRING: 'string',
      NUMBER: 'number',
      BOOLEAN: 'boolean'
    }
  };
});

const request = require('supertest');
const app = require('../index');

describe('Proxy API endpoints (mocked GenAI SDK)', () => {
  afterAll(() => {
    if (app && app.close) app.close();
  });

  test('analyze-scene requires auth', async () => {
    const res = await request(app).post('/api/analyze-scene').send({ imageBase64: 'x' });
    expect(res.statusCode).toBe(401);
  });

  test('analyze-scene returns parsed objects when authorized', async () => {
    const issue = await request(app).post('/issue-token').set('Authorization', `Bearer ${process.env.SHARED_ISSUANCE_TOKEN}`);
    expect(issue.statusCode).toBe(200);
    const token = issue.body.token;

    const res = await request(app)
      .post('/api/analyze-scene')
      .set('Authorization', `Bearer ${token}`)
      .send({ imageBase64: 'IMGBASE64' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('objects');
    expect(Array.isArray(res.body.objects)).toBe(true);
    expect(res.body.objects[0].name).toBe('mock-obj');
  });

  test('generate-glyph requires auth', async () => {
    const res = await request(app).post('/api/generate-glyph').send({ name: 'E', type: 'specter' });
    expect(res.statusCode).toBe(401);
  });

  test('generate-glyph returns glyphB64 when authorized', async () => {
    const issue = await request(app).post('/issue-token').set('Authorization', `Bearer ${process.env.SHARED_ISSUANCE_TOKEN}`);
    expect(issue.statusCode).toBe(200);
    const token = issue.body.token;

    const res = await request(app)
      .post('/api/generate-glyph')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E', type: 'specter' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('glyphB64', 'MOCK_BASE64');
  });

  test('generate-entity-profile requires auth', async () => {
    const res = await request(app).post('/api/generate-entity-profile').send({ strength: 'strong' });
    expect(res.statusCode).toBe(401);
  });

  test('generate-entity-profile returns profile+glyph when authorized', async () => {
    const issue = await request(app).post('/issue-token').set('Authorization', `Bearer ${process.env.SHARED_ISSUANCE_TOKEN}`);
    expect(issue.statusCode).toBe(200);
    const token = issue.body.token;

    const res = await request(app)
      .post('/api/generate-entity-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ strength: 'strong' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('type');
    expect(res.body).toHaveProperty('backstory');
    expect(res.body).toHaveProperty('instability');
    expect(res.body).toHaveProperty('contained');
    expect(res.body).toHaveProperty('glyphB64', 'MOCK_BASE64');
  });
});
