const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
require('dotenv').config();

const sampleProducts = [
  {
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with titanium design, A17 Pro chip, and advanced camera system. Perfect for photography and professional use.',
    price: 120000,
    category: 'Electronics',
    stock: 25,
    sku: 'IPH15PRO001',
    weight: 0.187,
    dimensions: { length: 14.67, width: 7.09, height: 0.83 },
    tags: ['smartphone', 'apple', 'premium', 'camera'],
    status: 'active'
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Flagship Android phone with S Pen, 200MP camera, and AI features. Built for productivity and creativity.',
    price: 135000,
    category: 'Electronics',
    stock: 18,
    sku: 'SAM24ULTRA001',
    weight: 0.232,
    dimensions: { length: 16.26, width: 7.90, height: 0.86 },
    tags: ['smartphone', 'samsung', 'android', 's-pen'],
    status: 'active'
  },
  {
    name: 'MacBook Air M3',
    description: 'Ultra-thin laptop with M3 chip, all-day battery life, and stunning Retina display. Perfect for students and professionals.',
    price: 180000,
    category: 'Electronics',
    stock: 12,
    sku: 'MBA13M3001',
    weight: 1.24,
    dimensions: { length: 30.41, width: 21.5, height: 1.13 },
    tags: ['laptop', 'apple', 'macbook', 'portable'],
    status: 'active'
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling headphones with exceptional sound quality and 30-hour battery life.',
    price: 45000,
    category: 'Electronics',
    stock: 35,
    sku: 'SONYWH1000XM5',
    weight: 0.249,
    dimensions: { length: 26.4, width: 19.5, height: 8.0 },
    tags: ['headphones', 'sony', 'noise-canceling', 'wireless'],
    status: 'active'
  },
  {
    name: 'Nike Air Max 270',
    description: 'Comfortable lifestyle sneakers with Max Air unit for all-day comfort. Perfect for casual wear and light exercise.',
    price: 15000,
    category: 'Clothing',
    stock: 50,
    sku: 'NIKEAM270001',
    weight: 0.4,
    dimensions: { length: 32, width: 12, height: 11 },
    tags: ['shoes', 'nike', 'sneakers', 'casual'],
    status: 'active'
  },
  {
    name: 'Levi\'s 501 Original Jeans',
    description: 'Classic straight-leg jeans with authentic fit and timeless style. Made from premium denim.',
    price: 8500,
    category: 'Clothing',
    stock: 40,
    sku: 'LEVI501001',
    weight: 0.6,
    dimensions: { length: 110, width: 45, height: 2 },
    tags: ['jeans', 'levis', 'denim', 'classic'],
    status: 'active'
  },
  {
    name: 'Instant Pot Duo 7-in-1',
    description: 'Multi-functional pressure cooker that replaces 7 kitchen appliances. Perfect for quick and healthy meals.',
    price: 12000,
    category: 'Appliances',
    stock: 22,
    sku: 'INSTPOT7IN1',
    weight: 5.7,
    dimensions: { length: 33, width: 31.5, height: 32.5 },
    tags: ['kitchen', 'pressure-cooker', 'appliance', 'cooking'],
    status: 'active'
  },
  {
    name: 'Dyson V15 Detect Vacuum',
    description: 'Powerful cordless vacuum with laser dust detection and intelligent suction adjustment.',
    price: 85000,
    category: 'Appliances',
    stock: 8,
    sku: 'DYSONV15DET',
    weight: 3.0,
    dimensions: { length: 125, width: 25, height: 25 },
    tags: ['vacuum', 'dyson', 'cordless', 'cleaning'],
    status: 'active'
  },
  {
    name: 'The Psychology of Money',
    description: 'Bestselling book about the psychology behind financial decisions. Essential reading for personal finance.',
    price: 2500,
    category: 'Other',
    stock: 100,
    sku: 'PSYCHMONEY001',
    weight: 0.3,
    dimensions: { length: 23, width: 15, height: 2 },
    tags: ['book', 'finance', 'psychology', 'bestseller'],
    status: 'active'
  },
  {
    name: 'Yoga Mat Premium',
    description: 'High-quality non-slip yoga mat with excellent cushioning. Perfect for yoga, pilates, and home workouts.',
    price: 4500,
    category: 'Other',
    stock: 60,
    sku: 'YOGAMATPREM',
    weight: 1.2,
    dimensions: { length: 183, width: 61, height: 0.6 },
    tags: ['yoga', 'fitness', 'exercise', 'mat'],
    status: 'active'
  }
];

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://paya-admin:QVFHuUWKKlOYsAgR@marketplace.ty20ofu.mongodb.net/paya-marketplace?retryWrites=true&w=majority&appName=marketplace';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    // Find the test merchant
    const merchant = await User.findOne({ email: 'merchant@paya.com' });
    if (!merchant) {
      console.error('Test merchant not found. Please run seedMerchant.js first.');
      process.exit(1);
    }

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Create products with merchant reference
    const merchantName = merchant.business?.name || merchant.businessInfo?.businessName || `${merchant.firstName} ${merchant.lastName}`;
    console.log(`Using merchant: ${merchantName} (${merchant.email})`);
    
    const productsWithMerchant = sampleProducts.map(product => ({
      ...product,
      merchant: merchant._id,
      merchantName: merchantName,
      inventory: {
        quantity: product.stock,
        lowStockThreshold: 5,
        trackInventory: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await Product.insertMany(productsWithMerchant);
    console.log(`Created ${productsWithMerchant.length} sample products`);

    // Log summary
    console.log('\n📦 Sample Products Created:');
    sampleProducts.forEach(product => {
      console.log(`- ${product.name} (KSh ${product.price.toLocaleString()}) - ${product.category}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();
