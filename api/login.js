const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  plants: [{ name: String, diagnosis: String, image: String, date: { type: Date, default: Date.now } }],
  xp: { type: Number, default: 0 },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { name } = req.body;
  const mongoUri = process.env.MONGO_URI;

  try {
    if (mongoose.connection.readyState === 0) await mongoose.connect(mongoUri);
    
    let user = await User.findOne({ name });
    if (!user) {
      user = new User({ name });
      await user.save();
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
