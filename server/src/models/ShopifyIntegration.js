const mongoose = require('mongoose');
const crypto = require('crypto');

const shopifyIntegrationSchema = new mongoose.Schema({
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  shop: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true,
    // Encrypt before saving
    set: function(token) {
      if (!token) return token;
      try {
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(token, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
      } catch (error) {
        console.error('Encryption error:', error);
        return token;
      }
    },
    // Decrypt when reading
    get: function(encrypted) {
      if (!encrypted) return encrypted;
      try {
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
        const parts = encrypted.split(':');
        if (parts.length !== 2) return encrypted;
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch (error) {
        console.error('Decryption error:', error);
        return null;
      }
    }
  },
  scope: {
    type: String,
    required: true
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('ShopifyIntegration', shopifyIntegrationSchema);
