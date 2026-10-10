// Render deployment entry point
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const app = express();

app.use(cors({
  origin: '*', // Allow Vercel and any other origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const MONGO_URI = process.env.MONGO_URI;

// Primary model first, fallback second. OPENROUTER_MODEL overrides the primary.
const AI_MODELS = [
  process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
  'openai/gpt-4o-mini'
].filter((m, i, arr) => arr.indexOf(m) === i);

let lastDbError = null;
let lastDbAttempt = 0;
const DB_RETRY_COOLDOWN_MS = 30000;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return true;
  if (!MONGO_URI) {
    lastDbError = 'MONGO_URI is missing in Environment Variables.';
    console.error('SERVER_ERROR:', lastDbError);
    return false;
  }
  // Don't make every request wait 5s while the database is down.
  if (lastDbError && Date.now() - lastDbAttempt < DB_RETRY_COOLDOWN_MS) return false;

  lastDbAttempt = Date.now();
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    lastDbError = null;
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (err) {
    lastDbError = err.message;
    console.error('❌ MongoDB Connection Error:', err.message);
    return false;
  }
};

// User Model. Plants are stored as-is so health score, confidence, timeline etc. survive a sync.
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  plants: { type: [mongoose.Schema.Types.Mixed], default: [] },
  xp: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const cleanName = (name) => (typeof name === 'string' ? name.trim().slice(0, 60) : '');

// API Endpoints
app.get('/api/status', async (req, res) => {
  const dbConnected = await connectDB();
  res.json({
    status: 'Online',
    service: 'Plantiva Backend Version 10.0',
    db: mongoose.connection.readyState,
    dbConnected,
    dbError: dbConnected ? null : lastDbError,
    aiConfigured: !!process.env.OPENROUTER_API_KEY,
    aiModels: AI_MODELS
  });
});

app.post('/api/login', async (req, res) => {
  const name = cleanName(req.body?.name);
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const isConnected = await connectDB();
  if (!isConnected) {
    // Let the user in anyway; their data stays on the device until the database is back.
    return res.json({ name, plants: [], xp: 0, offline: true });
  }

  try {
    let user = await User.findOne({ name });
    if (!user) {
      user = new User({ name });
      await user.save();
      console.log(`🆕 New user created: ${name}`);
    } else {
      console.log(`👋 User logged in: ${name}`);
    }
    res.json(user);
  } catch (err) {
    console.error('Login error:', err.message);
    res.json({ name, plants: [], xp: 0, offline: true });
  }
});

app.post('/api/user/update', async (req, res) => {
  const name = cleanName(req.body?.name);
  const { plants, xp } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const isConnected = await connectDB();
  if (!isConnected) return res.status(503).json({ error: 'Database unavailable', offline: true });

  try {
    const update = {};
    if (Array.isArray(plants)) update.plants = plants;
    if (typeof xp === 'number') update.xp = xp;
    const user = await User.findOneAndUpdate(
      { name },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/:name', async (req, res) => {
  const isConnected = await connectDB();
  if (!isConnected) return res.status(503).json({ error: 'Database unavailable', offline: true });

  try {
    const user = await User.findOne({ name: cleanName(req.params.name) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const SYSTEM_PROMPT = "You are Plantiva, the world's most advanced AI botanical expert. Your mission is to help users identify plant diseases, provide care tips, and ensure their garden thrives. You MUST never refer to yourself as ChatGPT, OpenAI, or a generic AI model. If asked about your identity or if you are ChatGPT, you must respond exactly with: 'No, I am not ChatGPT. I am Plantiva, here to help you grow your plants healthy! 🌿'";

const SCAN_FOCUS = {
  disease: 'Focus on diseases (fungal, bacterial, viral) and their stage.',
  identity: 'Focus on identifying the exact species and variety.',
  pest: 'Focus on insects, mites and other pests and the damage they cause.',
  nutrition: 'Focus on nutrient deficiencies, soil and watering problems.',
  growth: 'Focus on growth stage, vigour and how to improve growth.'
};

const buildScanPrompt = (message, contextMessage, scanMode) => `${contextMessage}As a senior botanical expert, analyze this plant image and the user's query: "${message || 'Analyze this plant'}".
${SCAN_FOCUS[scanMode] || ''}

ALWAYS start by identifying the plant species. Base every claim on what is actually visible in the photo. If the photo is blurry, too dark, or not a plant, say so and give a low confidence instead of guessing.

Required Output Format:
1. Plant Identity & Status: (Common name + Health status)
2. Confidence %: (your honest estimate)
3. Detailed Observations:
4. Care/Treatment Plan:
5. Environmental Advice: (Use the location data if available)

After the report, on the very last lines, add this machine-readable block exactly (valid JSON, no comments):
\`\`\`json
{"plantName": "<common name or Unknown>", "species": "<scientific name or Unknown>", "healthScore": <0-100 integer, 100 = perfectly healthy>, "confidence": <0-100 integer, how sure you are of the diagnosis>, "disease": "<main problem, or None>", "status": "<Healthy | Needs Attention | Critical>"}
\`\`\``;

// Pulls the trailing ```json {...}``` block out of a scan reply so the UI can show real numbers.
const extractAnalysis = (text) => {
  const fenced = [...text.matchAll(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/gi)].filter((m) => m[1].includes('healthScore'));
  const match = fenced[fenced.length - 1] || text.match(/(\{[^{}]*"healthScore"[^{}]*\})\s*$/);
  if (!match) return { message: text.trim(), analysis: null };

  const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n))));
  try {
    const raw = JSON.parse(match[1]);
    const analysis = {
      plantName: String(raw.plantName || 'Unknown Plant').slice(0, 80),
      species: String(raw.species || 'Unknown').slice(0, 80),
      healthScore: Number.isFinite(Number(raw.healthScore)) ? clamp(raw.healthScore) : null,
      confidence: Number.isFinite(Number(raw.confidence)) ? clamp(raw.confidence) : null,
      disease: String(raw.disease || 'None').slice(0, 120),
      status: String(raw.status || '').slice(0, 40)
    };
    const message = (text.slice(0, match.index) + text.slice(match.index + match[0].length)).trim();
    return { message, analysis };
  } catch {
    return { message: text.trim(), analysis: null };
  }
};

const callOpenRouter = async (apiKey, model, messages, maxTokens) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://plantiva-three.vercel.app',
      'X-Title': 'Plantiva Expert Pro'
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0.4, messages }),
  });

  const data = await response.json().catch(() => ({}));
  const content = data?.choices?.[0]?.message?.content;
  if (response.ok && typeof content === 'string' && content.trim()) return content;

  const err = new Error(data?.error?.message || `OpenRouter returned status ${response.status}`);
  err.status = response.status;
  throw err;
};

const friendlyAiError = (err) => {
  if (err.status === 401) return 'The OpenRouter API key on the server is invalid or was revoked.';
  if (err.status === 402) return 'The OpenRouter account is out of credits.';
  if (err.status === 429) return 'Too many requests right now. Please wait a minute and try again.';
  return `The AI service failed: ${err.message}`;
};

app.post('/api/chat', async (req, res) => {
  const { message = '', conversationHistory = [], imageDataUrl, locationContext, scanMode } = req.body || {};
  const API_KEY = process.env.OPENROUTER_API_KEY;

  if (!API_KEY) {
    return res.status(503).json({ error: 'OPENROUTER_API_KEY is not set on the server.' });
  }

  const contextMessage = locationContext ? `[USER CONTEXT: ${locationContext}]\n` : '';
  const userContent = imageDataUrl
    ? [
        { type: 'text', text: buildScanPrompt(message, contextMessage, scanMode) },
        { type: 'image_url', image_url: { url: imageDataUrl } }
      ]
    : `${contextMessage}${message}`;

  const history = (Array.isArray(conversationHistory) ? conversationHistory : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content }));

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userContent }
  ];

  let lastError = null;
  for (const model of AI_MODELS) {
    try {
      const content = await callOpenRouter(API_KEY, model, messages, imageDataUrl ? 1200 : 800);
      if (!imageDataUrl) return res.json({ message: content.trim() });
      return res.json(extractAnalysis(content));
    } catch (err) {
      lastError = err;
      console.error(`AI error with ${model}:`, err.status, err.message);
      // A bad key or empty balance fails the same way on every model.
      if (err.status === 401 || err.status === 402) break;
    }
  }

  res.status(502).json({ error: friendlyAiError(lastError || new Error('Unknown error')) });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌿 Plantiva Master Server running locally on http://localhost:${PORT}`);
});

export default function handler(req, res) {
  return app(req, res);
}
