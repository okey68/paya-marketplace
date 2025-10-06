const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB Atlas
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://paya-admin:QVFHuUWKKlOYsAgR@marketplace.ty20ofu.mongodb.net/paya-marketplace?retryWrites=true&w=majority&appName=marketplace';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');

    // 1. Create Admin Account
    console.log('\n📋 Setting up Admin Account...');
    const existingAdmin = await User.findOne({ email: 'admin@paya.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists');
    } else {
      const adminUser = new User({
        firstName: 'Paya',
        lastName: 'Admin',
        email: 'admin@paya.com',
        password: 'admin123', // Will be hashed by pre-save middleware
        role: 'admin',
        isActive: true,
        isVerified: true,
        phone: '+254700000001',
        address: {
          street: 'Admin Street',
          city: 'Nairobi',
          county: 'Nairobi',
          postalCode: '00100',
          country: 'Kenya'
        }
      });

      await adminUser.save();
      console.log('✅ Admin account created successfully');
      console.log('   Email: admin@paya.com');
      console.log('   Password: admin123');
    }

    // 2. Create Merchant Account
    console.log('\n📋 Setting up Merchant Account...');
    const existingMerchant = await User.findOne({ email: 'merchant@paya.com' });
    
    if (existingMerchant) {
      console.log('⚠️  Merchant account already exists');
    } else {
      const merchantUser = new User({
        firstName: 'Test',
        lastName: 'Merchant',
        email: 'merchant@paya.com',
        password: 'merchant123', // Will be hashed by pre-save middleware
        role: 'merchant',
        isActive: true,
        isVerified: true,
        phone: '+254700000002',
        address: {
          street: '123 Business Avenue',
          city: 'Nairobi',
          county: 'Nairobi',
          postalCode: '00100',
          country: 'Kenya'
        },
        business: {
          name: 'Test Merchant Store',
          description: 'A test merchant store for development and testing',
          category: 'Electronics',
          registrationNumber: 'TEST-BIZ-001',
          taxId: 'TAX-001',
          bankAccount: {
            bankName: 'Test Bank',
            accountNumber: '1234567890',
            accountName: 'Test Merchant Store'
          },
          documents: {
            businessLicense: {
              filename: 'test-license.pdf',
              uploadDate: new Date()
            },
            taxCertificate: {
              filename: 'test-tax-cert.pdf',
              uploadDate: new Date()
            }
          },
          verificationStatus: 'approved',
          approvedAt: new Date()
        }
      });

      await merchantUser.save();
      console.log('✅ Merchant account created successfully');
      console.log('   Email: merchant@paya.com');
      console.log('   Password: merchant123');
      console.log('   Business: Test Merchant Store');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📝 Test Accounts:');
    console.log('\n1. ADMIN ACCOUNT:');
    console.log('   URL (Dev):  http://localhost:3001');
    console.log('   URL (Prod): https://paya-marketplace-admin.netlify.app');
    console.log('   Email:      admin@paya.com');
    console.log('   Password:   admin123');
    console.log('\n2. MERCHANT ACCOUNT:');
    console.log('   URL (Dev):  http://localhost:3002');
    console.log('   URL (Prod): https://paya-marketplace-merchant.netlify.app');
    console.log('   Email:      merchant@paya.com');
    console.log('   Password:   merchant123');
    console.log('\n' + '='.repeat(60));
    console.log('✅ You can now login with these credentials on both');
    console.log('   development and production environments!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
