import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  plants: Array,
  xp: Number,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default async function handler(req, res) {
  const { name } = req.query; // Vercel captures name from [name].js
  const mongoUri = process.env.MONGO_URI;

  try {
    if (mongoose.connection.readyState === 0) await mongoose.connect(mongoUri);
    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
