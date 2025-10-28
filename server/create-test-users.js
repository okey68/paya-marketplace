const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const testUsers = [
  {
    // APPROVED USER - Meets all criteria
    firstName: 'Approved',
    lastName: 'Customer',
    email: 'approved@test.com',
    password: 'password123',
    phoneNumber: '+254700000001',
    role: 'customer',
    dateOfBirth: new Date('1990-01-15'),
    kraPin: 'A000000001A',
    
    // Employment & Financial Info (Will be approved)
    employmentInfo: {
      employerName: 'Tech Corp Kenya',
      jobTitle: 'Software Engineer',
      monthlyIncome: 80000, // Good income
      yearsEmployed: 5, // Long employment
      employmentStatus: 'permanent'
    },
    
    financialInfo: {
      creditScore: 750, // Excellent credit
      hasDefaults: false,
      defaultCount: 0,
      otherObligations: 5000 // Low obligations
    },
    
    isActive: true,
    isVerified: true
  },
  {
    // REJECTED USER - Fails multiple criteria
    firstName: 'Rejected',
    lastName: 'Customer',
    email: 'rejected@test.com',
    password: 'password123',
    phoneNumber: '+254700000002',
    role: 'customer',
    dateOfBirth: new Date('2010-01-15'), // Too young (15 years old)
    kraPin: 'A000000002A',
    
    // Employment & Financial Info (Will be rejected)
    employmentInfo: {
      employerName: 'Small Shop',
      jobTitle: 'Clerk',
      monthlyIncome: 20000, // Low income (below 30,000 minimum)
      yearsEmployed: 0.5, // Short employment (below 1 year minimum)
      employmentStatus: 'contract'
    },
    
    financialInfo: {
      creditScore: 550, // Poor credit (below 600 minimum)
      hasDefaults: true,
      defaultCount: 2, // Has defaults (max is 0)
      otherObligations: 60000 // High obligations (above 50,000 max)
    },
    
    isActive: true,
    isVerified: true
  }
];

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Delete existing test users
    await User.deleteMany({ 
      email: { $in: ['approved@test.com', 'rejected@test.com'] } 
    });
    console.log('Deleted existing test users');
    
    // Create new test users
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created test user: ${user.email} (${user.firstName} ${user.lastName})`);
    }
    
    console.log('\n🎉 Test users created successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('APPROVED USER (Will pass underwriting):');
    console.log('  Email: approved@test.com');
    console.log('  Password: password123');
    console.log('  Name: Approved Customer');
    console.log('  Income: Ksh 80,000/month');
    console.log('  Credit Score: 750');
    console.log('  Max Loan: ~Ksh 80,000 (for 4-month term)');
    console.log('═══════════════════════════════════════════════════════');
    console.log('REJECTED USER (Will fail underwriting):');
    console.log('  Email: rejected@test.com');
    console.log('  Password: password123');
    console.log('  Name: Rejected Customer');
    console.log('  Income: Ksh 20,000/month (too low)');
    console.log('  Credit Score: 550 (too low)');
    console.log('  Age: 15 years (too young)');
    console.log('  Defaults: 2 (has defaults)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();
