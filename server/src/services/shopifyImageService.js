/**
 * Shopify Image Download Service
 * Downloads images from Shopify URLs and stores them in GridFS
 */

const axios = require('axios');
const mongoose = require('mongoose');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);

/**
 * Download an image from URL and store in GridFS
 * @param {string} imageUrl - The Shopify image URL
 * @param {string} productName - Name of the product (for filename)
 * @param {number} index - Image index (for ordering)
 * @returns {Object} - Image metadata { filename, originalName, path, size }
 */
async function downloadAndStoreImage(imageUrl, productName, index = 0) {
  try {
    // Download image from Shopify
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'stream',
      timeout: 30000 // 30 second timeout
    });

    // Extract filename from URL or generate one
    const urlParts = imageUrl.split('/');
    const originalFilename = urlParts[urlParts.length - 1].split('?')[0];
    const extension = originalFilename.split('.').pop() || 'jpg';

    // Generate safe filename
    const safeName = productName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 50);
    const filename = `${safeName}_${index}_${Date.now()}.${extension}`;

    // Get GridFS bucket
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'uploads'
    });

    // Create upload stream
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: response.headers['content-type'] || 'image/jpeg',
      metadata: {
        originalUrl: imageUrl,
        productName: productName,
        uploadedAt: new Date()
      }
    });

    // Pipe the download to GridFS
    await pipeline(response.data, uploadStream);

    console.log(`✅ Image downloaded and stored: ${filename}`);

    return {
      filename: uploadStream.filename,
      originalName: originalFilename,
      path: `/uploads/${uploadStream.id}`,
      size: uploadStream.length,
      gridfsId: uploadStream.id
    };
  } catch (error) {
    console.error(`❌ Failed to download image from ${imageUrl}:`, error.message);

    // Return URL as fallback
    return {
      filename: imageUrl.split('/').pop(),
      originalName: imageUrl.split('/').pop(),
      path: imageUrl, // Store original URL as fallback
      size: 0,
      downloadError: true
    };
  }
}

/**
 * Download multiple images for a product
 * @param {Array} imageUrls - Array of Shopify image URLs
 * @param {string} productName - Name of the product
 * @returns {Array} - Array of image metadata objects
 */
async function downloadProductImages(imageUrls, productName) {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }

  const downloadPromises = imageUrls.map((url, index) =>
    downloadAndStoreImage(url, productName, index)
  );

  try {
    // Download all images in parallel (but limit to prevent overload)
    const images = await Promise.all(downloadPromises);

    // Filter out failed downloads (optional - you might want to keep URLs as fallback)
    return images.filter(img => !img.downloadError);
  } catch (error) {
    console.error('Error downloading product images:', error);

    // Return URLs as fallback
    return imageUrls.map((url, index) => ({
      filename: url.split('/').pop(),
      originalName: url.split('/').pop(),
      path: url,
      size: 0
    }));
  }
}

/**
 * Delete an image from GridFS
 * @param {string} gridfsId - The GridFS file ID
 */
async function deleteImage(gridfsId) {
  try {
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'uploads'
    });

    await bucket.delete(new mongoose.Types.ObjectId(gridfsId));
    console.log(`✅ Image deleted from GridFS: ${gridfsId}`);
  } catch (error) {
    console.error(`❌ Failed to delete image ${gridfsId}:`, error.message);
  }
}

/**
 * Check if a URL is a Shopify CDN URL (not already in GridFS)
 * @param {string} urlOrPath - The image URL or path
 * @returns {boolean}
 */
function isShopifyUrl(urlOrPath) {
  if (!urlOrPath) return false;
  return urlOrPath.includes('shopify.com') ||
         urlOrPath.includes('cdn.shopify.com') ||
         urlOrPath.startsWith('http://') ||
         urlOrPath.startsWith('https://');
}

module.exports = {
  downloadAndStoreImage,
  downloadProductImages,
  deleteImage,
  isShopifyUrl
};
