const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { GoogleGenAI, Type } = require('@google/genai');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '5mb' }));

// Rate limiter for API endpoints: 60 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Configuration via env
const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 4000;
const JWT_ISSUER_SECRET = process.env.JWT_ISSUER_SECRET || 'replace-this-with-strong-secret';
const SHARED_ISSUANCE_TOKEN = process.env.SHARED_ISSUANCE_TOKEN || 'replace-me-with-issuance-secret';

if (!API_KEY) {
  console.error('Server: API_KEY environment variable is required.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// JWT-based middleware: verifies Bearer <jwt>
function requireJwt(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = String(auth).split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(403).json({ error: 'Invalid Authorization header' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_ISSUER_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Simple issuance endpoint: requires SHARED_ISSUANCE_TOKEN to request a short-lived JWT
app.post('/issue-token', (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = String(auth).split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || parts[1] !== SHARED_ISSUANCE_TOKEN) return res.status(403).json({ error: 'Invalid issuance token' });
  const payload = { iss: 'necrometer-proxy' };
  // Short-lived token (15 minutes)
  const token = jwt.sign(payload, JWT_ISSUER_SECRET, { expiresIn: '15m' });
  return res.json({ token });
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/transcribe', async (req, res) => {
  const { audioBase64, mimeType } = req.body || {};
  if (!audioBase64) {
    return res.status(400).json({ error: 'AUDIO_REQUIRED' });
  }
  if (!process.env.TRANSCRIBE_API_KEY) {
    return res.status(501).json({ error: 'TRANSCRIPTION_NOT_CONFIGURED' });
  }
  return res.status(501).json({ error: 'TRANSCRIPTION_NOT_CONFIGURED' });
});

// Analyze scene endpoint: accepts base64 image and returns SceneAnalysisResult
app.post('/api/analyze-scene', requireJwt, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

    const prompt = `Analyze this image from a first-person perspective. Identify up to 5 prominent objects or structures (like a door, chair, table, window). For each object, provide a simplified, stick-figure-like outline as an array of polylines. A polyline is an array of {x, y} points. Coordinates must be percentages (0-100) relative to the image dimensions. The outlines should be very simple and abstract. Respond in JSON format. If no objects are identifiable, return an empty 'objects' array.`;

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  polylines: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER }
                        },
                        required: ['x', 'y']
                      }
                    }
                  }
                },
                required: ['name', 'polylines']
              }
            }
          },
          required: ['objects']
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    return res.json(parsed);
  } catch (err) {
    console.error('analyze-scene error', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Generate glyph for an entity profile
app.post('/api/generate-glyph', requireJwt, async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });

    const glyphPrompt = `Create a single, minimalist, arcane, mystical sigil or glyph that represents a paranormal entity. The entity is a "${type}" known as "${name}". The glyph should be a stark white design on a pure black background. It should look ancient and mysterious. It should not be a picture of the entity, but a symbolic representation.`;

    const imageResponse = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: glyphPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      }
    });

    const glyphB64 = imageResponse.generatedImages[0].image.imageBytes;
    return res.json({ glyphB64 });
  } catch (err) {
    console.error('generate-glyph error', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Generate an entity profile (used by client proxy)
app.post('/api/generate-entity-profile', requireJwt, async (req, res) => {
  try {
    const { strength } = req.body || {};
    const strengthDesc = (function () {
      switch (strength) {
        case 'weak': return 'faint and fleeting';
        case 'moderate': return 'clear and present';
        case 'strong': return 'powerful and disruptive';
        case 'critical': return 'overwhelming and physically manifesting';
        default: return 'of unknown power';
      }
    })();

    const profilePrompt = `Generate a short, spooky, and mysterious profile for a paranormal entity. The energy signature is ${strengthDesc}. The profile must include a plausible name, a type (e.g., Poltergeist, Shade, Revenant, Wraith, Banshee, Phantom, Lingering Spirit), a one-paragraph backstory, and an 'instability' rating (a number from 50 to 100). The entity is not yet 'contained'. Respond in JSON format with keys: name, type, backstory, instability, contained.`;

    const profileResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: profilePrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            backstory: { type: Type.STRING },
            instability: { type: Type.NUMBER },
            contained: { type: Type.BOOLEAN }
          },
          required: ['name', 'type', 'backstory', 'instability', 'contained']
        }
      }
    });

    const profileData = JSON.parse(profileResponse.text.trim());

    // Generate a glyph image for the profile
    const glyphPrompt = `Create a single, minimalist, arcane, mystical sigil or glyph that represents a paranormal entity. The entity is a "${profileData.type}" known as "${profileData.name}". The glyph should be a stark white design on a pure black background. It should look ancient and mysterious. It should not be a picture of the entity, but a symbolic representation.`;

    const imageResponse = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: glyphPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      }
    });

    const glyphB64 = imageResponse.generatedImages && imageResponse.generatedImages[0] && imageResponse.generatedImages[0].image && imageResponse.generatedImages[0].image.imageBytes;

    return res.json({ ...profileData, glyphB64 });
  } catch (err) {
    console.error('generate-entity-profile error', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Temporal echo endpoint
app.post('/api/temporal-echo', requireJwt, async (req, res) => {
  try {
    const prompt = `Generate a \"temporal echo\" from a haunted location. This is a brief, one-paragraph description of a dramatic, tragic, or emotionally charged historical event that could leave a spiritual residue. Be vague about the exact location, but specific about the emotions and actions. Provide a title for the event and the historical era (e.g., 'Victorian', 'Prohibition', 'Colonial').`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            era: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ['title', 'era', 'description']
        }
      }
    });

    return res.json(JSON.parse(response.text.trim()));
  } catch (err) {
    console.error('temporal-echo error', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Simple cross-reference route
app.post('/api/cross-reference', requireJwt, async (req, res) => {
  try {
    const { name, type } = req.body;
    const prompt = `Cross-reference this paranormal entity against a global spectral database: Name: "${name}", Type: "${type}". Is there a known record? If so, provide a short, one-paragraph summary of its history or lore. If not, state that it's an undocumented anomaly. Respond in JSON format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            match: { type: Type.BOOLEAN },
            details: { type: Type.STRING }
          },
          required: ['match', 'details']
        }
      }
    });

    return res.json(JSON.parse(response.text.trim()));
  } catch (err) {
    console.error('cross-reference error', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Export the app for Vercel (serverless)
module.exports = app;

// Only listen if run directly (local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Necrometer proxy listening on ${PORT}`);
  });
}
