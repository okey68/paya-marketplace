const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/paya-marketplace';

mongoose.connect(uri).then(async () => {
  const Order = require('../src/models/Order');
  const HRVerification = require('../src/models/HRVerification');
  const User = require('../src/models/User');

  const orderId = process.argv[2] || '693fbd356a29dfe1b72e6e57';

  // Find the order
  const order = await Order.findById(orderId)
    .populate('customer', 'firstName lastName email financialInfo')
    .populate('hrVerification');

  if (!order) {
    console.log('Order not found');
    process.exit(0);
  }

  console.log('=== ORDER ===');
  console.log('Order ID:', order._id);
  console.log('Order Number:', order.orderNumber);
  console.log('HR Verification Ref on Order:', order.hrVerification ? order.hrVerification._id : 'null');
  console.log('Customer ID:', order.customer?._id);
  console.log('Customer Name:', order.customer?.firstName, order.customer?.lastName);
  console.log('Customer financialInfo.payslip:', JSON.stringify(order.customer?.financialInfo?.payslip, null, 2));

  // Check HR Verification separately
  const hrVerification = await HRVerification.findOne({ order: order._id });
  console.log('\n=== HR VERIFICATION (by order lookup) ===');
  if (hrVerification) {
    console.log('HR Verification ID:', hrVerification._id);
    console.log('payslipPath:', hrVerification.payslipPath);
    console.log('payslipOriginalName:', hrVerification.payslipOriginalName);
    console.log('agreementPdfPath:', hrVerification.agreementPdfPath);
    console.log('status:', hrVerification.status);
  } else {
    console.log('No HR Verification found for this order');
  }

  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
