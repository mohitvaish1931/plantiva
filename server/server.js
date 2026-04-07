const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/plant_doctor';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
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

const PORT = 5005;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Plant Doctor Backend running on http://localhost:${PORT}`);
});
