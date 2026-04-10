const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors()); // CORS is fine now because it's the same domain

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/plant_doctor';
if (mongoose.connection.readyState === 0) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ Connected to MongoDB (Vercel)'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

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
  res.json({ status: 'Online', service: 'Vercel Serverless' });
});

app.post('/api/login', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    let user = await User.findOne({ name });
    if (!user) {
      user = new User({ name });
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/update', async (req, res) => {
  const { name, plants, xp } = req.body;
  try {
    const user = await User.findOneAndUpdate({ name }, { $set: { plants, xp } }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], imageDataUrl, locationContext = '' } = req.body;
    
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

    if (!OPENROUTER_API_KEY) return res.status(500).json({ error: 'API key missing' });

    const systemPrompt = `You are Plantiva, a world-class AI botanical expert...`; // Shortened for brevity in log

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages }),
    });

    const data = await response.json();
    res.json({ message: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = app;
