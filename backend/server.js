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

const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    if (!MONGO_URI) {
      console.error('SERVER_ERROR: MONGO_URI is missing in Environment Variables.');
      return false;
    }
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected to MongoDB on Vercel Serverless');
      return true;
    } catch (err) {
      console.error('❌ MongoDB Connection Error:', err);
      return false;
    }
  }
  return true;
};

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
app.get('/api/status', async (req, res) => {
  // Manual trigger for Vercel Webhook hook.
  await connectDB();
  res.json({ 
    status: 'Online', 
    service: 'Vercel Serverless Backend Version 9.0', 
    db: mongoose.connection.readyState 
  });
});

app.post('/api/login', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const isConnected = await connectDB();
    if (!isConnected) return res.status(500).json({ error: 'Database connection failed' });

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
    const isConnected = await connectDB();
    if (!isConnected) return res.status(500).json({ error: 'Database connection failed' });

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
    const { message, conversationHistory = [], imageDataUrl, locationContext } = req.body;
    
    const API_KEY = process.env.OPENROUTER_API_KEY;

    if (!API_KEY) {
      return res.status(200).json({ message: "🌿 **Configuration Error:** The botanical core is not yet powered. Please check your API keys." });
    }

    try {
      let plantDiagnosisName = "";
      
      // STEP 1: High-Precision Visual Identification
      if (imageDataUrl) {
        const visionResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${API_KEY}`, 
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://plantiva-main.vercel.app',
            'X-Title': 'Plantiva Vision Core'
          },
          body: JSON.stringify({ 
            model: "openai/gpt-4o-mini", 
            messages: [
              { role: 'user', content: [
                { type: "text", text: "Identify the plant disease in this image. Respond with ONLY the exact botanical name of the disease or 'Healthy Plant'." },
                { type: "image_url", image_url: { url: imageDataUrl } }
              ]}
            ]
          }),
        });
        const visionData = await visionResponse.json();
        plantDiagnosisName = visionData.choices?.[0]?.message?.content || "Plant Health Assessment";
      }

      // STEP 2: Professional Clinical Explanation with Nemotron (Fallback to GPT-4o Mini if busy)
      const nemotronPrompt = imageDataUrl 
        ? `As a senior botanical expert, provide a professional diagnosis for: "${plantDiagnosisName}". 
           Use exactly this format:
           1. Disease Name: ${plantDiagnosisName}
           2. Confidence %: (estimate)
           3. Symptoms:
           4. Causes:
           5. Treatment:
           6. Prevention:
           
           If the plant is 'Healthy Plant', congratulate the user and give one pro-tip for maintenance.`
        : message;

      const finalResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://plantiva-main.vercel.app',
          'X-Title': 'Plantiva Expert Pro'
        },
        body: JSON.stringify({ 
          model: "openai/gpt-4o-mini", 
          messages: [{ role: 'user', content: nemotronPrompt }] 
        }),
      });

      const data = await finalResponse.json();
      
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        res.json({ message: data.choices[0].message.content });
      } else {
        console.error("OpenRouter Response Error Data:", JSON.stringify(data, null, 2));
        throw new Error(data.error?.message || "AI stream interrupted");
      }

    } catch (innerErr) {
      console.error("AI Chain Error:", innerErr);
      res.status(200).json({ message: "🌿 I've analyzed your plant, but the connection is a bit fuzzy. It seems like it might need some fresh water and care! Try scanning once more for a deep report." });
    }

  } catch (err) {
    console.error('Final Master API Error:', err);
    res.status(500).json({ error: "Major system failure in the botanical grid." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌿 Plantiva Master Server running locally on http://localhost:${PORT}`);
});

export default function handler(req, res) {
  return app(req, res);
}
