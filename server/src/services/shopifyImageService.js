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

    // Wrap the upload in a Promise that waits for the 'finish' event
    const uploadResult = await new Promise((resolve, reject) => {
      let uploadedFileId;
      let uploadedSize = 0;

      uploadStream.on('finish', () => {
        uploadedFileId = uploadStream.id;
        uploadedSize = uploadStream.length || 0;

        // Give GridFS a moment to commit the metadata
        setTimeout(() => {
          resolve({
            filename: String(filename),
            originalName: String(originalFilename || filename), // Fallback to filename if originalFilename is undefined
            path: `/uploads/${uploadedFileId}`,
            size: Number(uploadedSize) || 0,
            gridfsId: uploadedFileId
          });
        }, 100); // 100ms delay to ensure GridFS metadata is committed
      });

      uploadStream.on('error', (error) => {
        reject(new Error(`GridFS upload failed: ${error.message}`));
      });

      // Pipe the download to GridFS
      pipeline(response.data, uploadStream).catch(reject);
    });

    // Image downloaded and stored successfully

    return uploadResult;
  } catch (error) {
    console.error(`❌ Failed to download image from ${imageUrl}:`, error.message);

    // Return URL as fallback
    const fallbackFilename = imageUrl.split('/').pop() || `image_${index}.jpg`;
    return {
      filename: String(fallbackFilename),
      originalName: String(fallbackFilename),
      path: String(imageUrl), // Store original URL as fallback
      size: 0,
      downloadError: true
    };
  }
}

/**
 * Verify that an image exists in GridFS
 * @param {string} gridfsId - The GridFS file ID
 * @returns {boolean}
 */
async function verifyImageExists(gridfsId) {
  try {
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'uploads'
    });

    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(gridfsId) }).toArray();
    return files.length > 0;
  } catch (error) {
    console.error(`Failed to verify image ${gridfsId}:`, error.message);
    return false;
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
    // Download all images in parallel
    const images = await Promise.all(downloadPromises);

    // Filter out failed downloads
    const successfulImages = images.filter(img => !img.downloadError);

    if (successfulImages.length === 0) {
      return [];
    }

    // Verify all images exist in GridFS
    const verificationPromises = successfulImages.map(async (img) => {
      if (img.gridfsId) {
        const exists = await verifyImageExists(img.gridfsId);
        return exists ? img : null;
      }
      return null;
    });

    const verifiedImages = await Promise.all(verificationPromises);
    return verifiedImages.filter(img => img !== null);
  } catch (error) {
    console.error('Error downloading product images:', error.message);

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
