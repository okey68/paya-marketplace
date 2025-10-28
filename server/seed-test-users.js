const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const testUsers = [
  {
    email: 'approved@test.com',
    password: 'Test123!',
    firstName: 'Approved',
    lastName: 'Tester',
    role: 'customer',
    phone: '+254712345678',
    employmentInfo: {
      employer: 'Test Company Ltd',
      position: 'Senior Developer',
      yearsEmployed: 5,
      monthlyIncome: 150000,
      employmentType: 'permanent'
    },
    financialInfo: {
      creditScore: 750,
      defaults: 0,
      otherObligations: 10000
    },
    dateOfBirth: new Date('1990-01-01'),
    address: {
      street: '123 Test Street',
      city: 'Nairobi',
      country: 'Kenya',
      postalCode: '00100'
    }
  },
  {
    email: 'rejected@test.com',
    password: 'Test123!',
    firstName: 'Rejected',
    lastName: 'Tester',
    role: 'customer',
    phone: '+254712345679',
    employmentInfo: {
      employer: 'Test Company Ltd',
      position: 'Junior Developer',
      yearsEmployed: 0.5,
      monthlyIncome: 25000,
      employmentType: 'contract'
    },
    financialInfo: {
      creditScore: 450,
      defaults: 3,
      otherObligations: 60000
    },
    dateOfBirth: new Date('2005-01-01'),
    address: {
      street: '456 Test Street',
      city: 'Nairobi',
      country: 'Kenya',
      postalCode: '00100'
    }
  },
  {
    email: 'pending@test.com',
    password: 'Test123!',
    firstName: 'Pending',
    lastName: 'Tester',
    role: 'customer',
    phone: '+254712345680',
    employmentInfo: {
      employer: 'Test Company Ltd',
      position: 'Mid-level Developer',
      yearsEmployed: 2,
      monthlyIncome: 80000,
      employmentType: 'permanent'
    },
    financialInfo: {
      creditScore: 620,
      defaults: 0,
      otherObligations: 30000
    },
    dateOfBirth: new Date('1995-01-01'),
    address: {
      street: '789 Test Street',
      city: 'Nairobi',
      country: 'Kenya',
      postalCode: '00100'
    }
  }
];

async function seedTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paya-marketplace');
    console.log('✅ Connected to MongoDB');

    // Delete existing test users
    await User.deleteMany({ email: { $in: testUsers.map(u => u.email) } });
    console.log('🗑️  Deleted existing test users');

    // Create test users
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created test user: ${userData.email}`);
    }

    console.log('\n🎉 Test users seeded successfully!');
    console.log('\nTest Users:');
    console.log('1. approved@test.com - Should be APPROVED (high income, good credit)');
    console.log('2. rejected@test.com - Should be REJECTED (low income, poor credit, too young)');
    console.log('3. pending@test.com - Should be BORDERLINE (moderate income and credit)');
    console.log('\nPassword for all: Test123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    process.exit(1);
  }
}

seedTestUsers();
