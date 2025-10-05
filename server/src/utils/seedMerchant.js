const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedMerchant = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://okey68_db_user:6PyTMOIkvsQF5cRh@college.gd8jyma.mongodb.net/paya-marketplace?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    // Check if merchant already exists
    const existingMerchant = await User.findOne({ email: 'merchant@paya.com' });
    if (existingMerchant) {
      console.log('Test merchant user already exists');
      await mongoose.disconnect();
      return;
    }

    // Create merchant user
    const merchantUser = new User({
      firstName: 'Test',
      lastName: 'Merchant',
      email: 'merchant@paya.com',
      password: 'merchant123', // Will be hashed by the pre-save hook
      role: 'merchant',
      isActive: true,
      isVerified: true,
      address: {
        street: '123 Business Street',
        city: 'Nairobi',
        county: 'Nairobi',
        postalCode: '00100',
        country: 'Kenya'
      },
      businessInfo: {
        businessName: 'Test Electronics Store',
        businessType: 'retail',
        description: 'A test electronics store for demonstration purposes',
        website: 'https://testelectronics.co.ke',
        taxId: 'A123456789B',
        approvalStatus: 'approved',
        documents: {
          businessFormation: {
            filename: null,
            originalName: null,
            path: null,
            size: null,
            uploadDate: null
          },
          businessPermit: {
            filename: null,
            originalName: null,
            path: null,
            size: null,
            uploadDate: null
          }
        }
      }
    });

    await merchantUser.save();
    console.log('Test merchant user created successfully');
    console.log('Email: merchant@paya.com');
    console.log('Password: merchant123');
    console.log('Business: Test Electronics Store (Approved)');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding merchant user:', error);
    process.exit(1);
  }
};

seedMerchant();
