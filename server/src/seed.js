const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ phone: 'moh', role: 'admin' });
    if (existing) {
      console.log('Admin already exists:', existing.phone);
      process.exit(0);
    }

    const admin = new User({
      name: 'مدير النظام',
      phone: 'moh',
      password: 'drmas001',
      role: 'admin',
      gender: 'male',
    });
    await admin.save();
    console.log('Admin created successfully');
    console.log('  Phone: moh');
    console.log('  Password: drmas001');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
