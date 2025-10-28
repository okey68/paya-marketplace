const mongoose = require('mongoose');
const UnderwritingModel = require('./src/models/UnderwritingModel');
require('dotenv').config();

async function copyUnderwritingModel() {
  try {
    // Connect to source database (paya-marketplace)
    const sourceUri = 'mongodb+srv://paya-admin:QVFHuUWKKlOYsAgR@marketplace.ty20ofu.mongodb.net/paya-marketplace?retryWrites=true&w=majority&appName=marketplace';
    await mongoose.connect(sourceUri);
    console.log('✅ Connected to source database (paya-marketplace)');

    // Get the active model from source
    const sourceModel = await UnderwritingModel.findOne({ isActive: true });
    
    if (!sourceModel) {
      console.log('❌ No active underwriting model found in source database');
      process.exit(1);
    }

    console.log('📋 Found active model:', {
      version: sourceModel.version,
      createdAt: sourceModel.createdAt
    });

    // Disconnect from source
    await mongoose.disconnect();

    // Connect to destination database (default/test)
    const destUri = 'mongodb+srv://paya-admin:QVFHuUWKKlOYsAgR@marketplace.ty20ofu.mongodb.net/?retryWrites=true&w=majority&appName=marketplace';
    await mongoose.connect(destUri);
    console.log('✅ Connected to destination database (Railway default)');

    // Delete existing models in destination
    await UnderwritingModel.deleteMany({});
    console.log('🗑️  Deleted existing models in destination');

    // Create new model in destination
    const newModel = await UnderwritingModel.create({
      metrics: sourceModel.metrics,
      parameters: sourceModel.parameters,
      isActive: true,
      version: sourceModel.version,
      createdBy: sourceModel.createdBy
    });

    console.log('✅ Created underwriting model in destination database');
    console.log('\n🎉 Underwriting model copied successfully!');
    console.log('Model details:', {
      version: newModel.version,
      isActive: newModel.isActive,
      metrics: newModel.metrics,
      parameters: newModel.parameters
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error copying underwriting model:', error);
    process.exit(1);
  }
}

copyUnderwritingModel();
