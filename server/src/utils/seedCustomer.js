const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedCustomer = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://okey68_db_user:6PyTMOIkvsQF5cRh@college.gd8jyma.mongodb.net/paya-marketplace?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    // Check if customer already exists
    const existingCustomer = await User.findOne({ email: 'customer@paya.com' });
    if (existingCustomer) {
      console.log('Test customer user already exists');
      await mongoose.disconnect();
      return;
    }

    // Create customer user
    const customerUser = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'customer@paya.com',
      password: 'customer123', // Will be hashed by the pre-save hook
      role: 'customer',
      isActive: true,
      isVerified: true,
      phoneNumber: '+254712345678',
      dateOfBirth: new Date('1990-05-15'),
      kraPin: 'A123456789Z',
      address: {
        street: '456 Customer Avenue',
        city: 'Nairobi',
        county: 'Nairobi',
        postalCode: '00200',
        country: 'Kenya'
      }
    });

    await customerUser.save();
    console.log('Test customer user created successfully');
    console.log('Email: customer@paya.com');
    console.log('Password: customer123');
    console.log('Name: John Doe');
    console.log('Phone: +254712345678');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding customer user:', error);
    process.exit(1);
  }
};

seedCustomer();
