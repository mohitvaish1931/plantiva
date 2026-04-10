import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  plants: [{ name: String, diagnosis: String, image: String, date: { type: Date, default: Date.now } }],
  xp: { type: Number, default: 0 },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');

  const { name } = req.body;
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('SERVER_ERROR: MONGO_URI is missing in Vercel Settings.');
    return res.status(200).json({ name, plants: [], xp: 0, error: 'Database key missing' });
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    }
    
    let user = await User.findOne({ name });
    if (!user) {
      user = new User({ name });
      await user.save();
    }
    res.status(200).json(user);
  } catch (err) {
    console.error('MONO_DB_CRITICAL_ERROR:', err.message);
    // Return a default object so the frontend doesn't crash
    res.status(200).json({ name, plants: [], xp: 0, error: `DB Error: ${err.message}` });
  }
}
