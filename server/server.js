const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Load environment variables from current or parent directory
const envPath = path.resolve(process.cwd(), '.env');
const parentEnvPath = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: parentEnvPath });
require('dotenv').config({ path: envPath }); // Prefer current directory if exists

const app = express();

// 1. MANUAL BULLETPROOF CORS (Replaces the cors library for maximum reliability)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://plantiva-main.vercel.app', 'http://localhost:5173', 'http://localhost:5174'];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Debug Environment (Safe-ish)
console.log('--- Environment Check ---');
console.log('Project Root:', path.resolve(__dirname, '..'));
console.log('OpenRouter Key Configured:', !!process.env.OPENROUTER_API_KEY);
console.log('Hugging Face Key Configured:', !!process.env.HUGGING_FACE_API_KEY);
console.log('--- ---');

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/plant_doctor';
console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Debug Connection Route
app.get('/api/status', (req, res) => {
  const status = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  res.json({
    env: process.env.NODE_ENV,
    mongoStatus: states[status],
    database: mongoose.connection.name,
    hasOpenRouterKey: !!(process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY),
    hasHuggingFaceKey: !!(process.env.HUGGING_FACE_API_KEY || process.env.VITE_HUGGING_FACE_API_KEY)
  });
});

// User Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  plants: [{
    name: String,
    diagnosis: String,
    image: String,
    date: { type: Date, default: Date.now }
  }],
  xp: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// API Endpoints

// Login/Create User (Simple name-based auth)
app.post('/api/login', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

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
    res.status(500).json({ error: err.message });
  }
});

// Update User Data (Plants, XP, etc.)
app.post('/api/user/update', async (req, res) => {
  const { name, plants, xp } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const user = await User.findOneAndUpdate(
      { name },
      { $set: { plants, xp } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User Profile
app.get('/api/user/:name', async (req, res) => {
  try {
    const user = await User.findOne({ name: req.params.name });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      conversationHistory = [],
      imageDataUrl,
      locationContext = 'Location not provided by user yet.',
    } = req.body;

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '';
    const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY || process.env.VITE_HUGGING_FACE_API_KEY || '';
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || process.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
    const HUGGING_FACE_MODEL = process.env.HUGGING_FACE_MODEL || process.env.VITE_HUGGING_FACE_MODEL || 'nateraw/vit-plant-classifier';
    const SITE_URL = process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://plantiva-beta.vercel.app';
    const SITE_NAME = process.env.SITE_NAME || process.env.VITE_SITE_NAME || 'Plantiva AI Assistant';

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'Server error: OpenRouter API key is not configured.' });
    }

    const systemPrompt = `You are Plantiva, a world-class AI botanical expert. You are NOT ChatGPT.
 
Your personality:
- You are Plantiva. NEVER refer to yourself as ChatGPT, OpenAI, or a generic AI model.
- If asked "Are you ChatGPT?", you must respond: "No, I am not ChatGPT. I am Plantiva, here to help you grow your plants healthy! 🌿"
- Friendly, encouraging mentor with relevant emojis


Your expertise:
- Identify plant health issues and symptoms.
- Provide expert cure methods and preventions.


- Advise on watering and plant nutrition.

When answering:
- If an image is provided, analyze it carefully for any signs of disease, pests, or nutrient deficiencies
- Ask clarifying questions about symptoms if needed
- Provide specific, actionable treatment recommendations
- Include preventive measures and use clear language

Keep responses engaging but concise. Use markdown formatting.

Current Context:
${locationContext}`;

    let additionalInfo = '';

    if (imageDataUrl && HUGGING_FACE_API_KEY) {
      try {
        const hfResponse = await fetch(`https://api-inference.huggingface.co/models/${HUGGING_FACE_MODEL}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: imageDataUrl }),
        });

        if (hfResponse.ok) {
          const hfData = await hfResponse.json();
          if (Array.isArray(hfData)) {
            additionalInfo = `\n\n[Hugging Face Specialized Plant Analysis]:\n${hfData
              .map((res) => `- ${res.label}: ${(res.score * 100).toFixed(1)}% confidence`)
              .join('\n')}`;
          }
        } else {
          console.warn('Hugging Face image analysis request failed:', hfResponse.status);
        }
      } catch (hfError) {
        console.error('Hugging Face Analysis Error:', hfError);
      }
    }

    if (imageDataUrl && !HUGGING_FACE_API_KEY) {
      console.warn('Hugging Face key missing; image analysis skipped.');
    }

    let userContent = message || "I've uploaded a photo of my plant.";
    if (additionalInfo) {
      userContent += additionalInfo;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    // Build the user message with image support if available
    if (imageDataUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userContent },
          {
            type: 'image_url',
            image_url: {
              url: imageDataUrl
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: userContent
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        max_tokens: parseInt(process.env.MAX_TOKENS) || 1000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter backend error:', data);
      return res.status(response.status).json({ error: data.error?.message || data.message || 'OpenRouter request failed.' });
    }

    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      return res.status(500).json({ error: 'Invalid response structure from OpenRouter API.' });
    }

    const choice = data.choices[0];
    if (!choice || !choice.message || typeof choice.message.content !== 'string') {
      return res.status(500).json({ error: 'Invalid message format in OpenRouter response.' });
    }

    res.json({ message: choice.message.content.trim() });
  } catch (err) {
    console.error('Chat proxy error:', err);
    res.status(500).json({ error: 'Server error while processing chat request.' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const PORT = process.env.PORT || 5005;
const NODE_ENV = process.env.NODE_ENV || 'development';
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Plant Doctor Backend running on http://localhost:${PORT} [${NODE_ENV}]`);
});
