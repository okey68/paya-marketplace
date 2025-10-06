const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://paya-admin:QVFHuUWKKlOYsAgR@marketplace.ty20ofu.mongodb.net/paya-marketplace?retryWrites=true&w=majority&appName=marketplace';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@paya.com', role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = new User({
      firstName: 'Paya',
      lastName: 'Admin',
      email: 'admin@paya.com',
      password: 'admin123', // Will be hashed by the pre-save middleware
      role: 'admin',
      isActive: true,
      isVerified: true,
      address: {
        city: 'Nairobi',
        county: 'Nairobi',
        country: 'Kenya'
      }
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@paya.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
