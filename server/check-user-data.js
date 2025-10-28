const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkUserData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/paya-marketplace');
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'merchant1@merchant.com' });
    
    if (user) {
      console.log('\n=== User Data ===');
      console.log('Email:', user.email);
      console.log('Name:', user.firstName, user.lastName);
      console.log('\n=== Business Info ===');
      console.log(JSON.stringify(user.businessInfo, null, 2));
      console.log('\n=== Address ===');
      console.log(JSON.stringify(user.address, null, 2));
    } else {
      console.log('User not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserData();
