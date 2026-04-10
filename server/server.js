// Render deployment entry point
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: '*', // Allow Vercel and any other origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000, 
})
.then(() => console.log('✅ Connected to MongoDB on Render'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

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

const User = mongoose.models.User || mongoose.model('User', userSchema);

// API Endpoints
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Online', 
    service: 'Render Node JS Backend', 
    db: mongoose.connection.readyState 
  });
});

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

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

    if (!OPENROUTER_API_KEY) {
      console.error('SERVER_ERROR: OPENROUTER_API_KEY is missing.');
      return res.status(200).json({ message: "🌿 **Configuration Error:** My API key is missing on the server. Please check Render environment variables." });
    }

    const messages = [
      { role: 'system', content: 'You are Plantiva, a world-class AI botanical expert.' },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://plantiva-main.vercel.app',
        'X-Title': 'Plantiva Server'
      },
      body: JSON.stringify({ model, messages }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        return res.status(200).json({ message: `🌿 **AI Provider Error:** The AI service responded with an error: ${errorData.substring(0, 50)}...` });
    }

    const data = await response.json();
    
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      res.json({ message: data.choices[0].message.content });
    } else {
      res.status(200).json({ message: "🌿 **Data Error:** Invalid response from the AI provider." });
    }
  } catch (err) {
    console.error('Render Chat Error:', err);
    res.status(200).json({ message: `🌿 **Server Error:** Something went wrong: ${err.message}` });
  }
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Plant Doctor Backend running on http://localhost:${PORT}`);
});
