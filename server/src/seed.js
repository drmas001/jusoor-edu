const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      console.log('Admin already exists:', existing.phone);
      process.exit(0);
    }

    const admin = new User({
      name: 'مدير النظام',
      phone: '0500000000',
      password: 'admin123',
      role: 'admin',
    });
    await admin.save();
    console.log('Admin created successfully');
    console.log('  Phone: 0500000000');
    console.log('  Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
