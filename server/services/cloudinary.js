import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file to Cloudinary
 * @param {string} fileBuffer - Base64 encoded file or file path
 * @param {object} options - Upload options
 * @returns {Promise} Cloudinary upload result
 */
export const uploadToCloudinary = async (fileBuffer, options = {}) => {
  const defaultOptions = {
    folder: 'xplore-articles',
    resource_type: 'auto', // Automatically detect image or video
  };

  const uploadOptions = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(fileBuffer, uploadOptions, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * Upload a video to Cloudinary with transformations
 * @param {string} fileBuffer - Base64 encoded file or file path
 * @param {object} options - Upload options
 * @returns {Promise} Cloudinary upload result
 */
export const uploadVideoToCloudinary = async (fileBuffer, options = {}) => {
  const defaultOptions = {
    folder: 'xplore-articles/videos',
    resource_type: 'video',
    eager: [
      { width: 400, height: 300, crop: 'pad', audio_codec: 'none', format: 'jpg' } // Generate thumbnail
    ],
    eager_async: true,
  };

  const uploadOptions = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(fileBuffer, uploadOptions, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Promise} Cloudinary deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * Delete multiple files from Cloudinary
 * @param {Array} publicIds - Array of Cloudinary public IDs
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Promise} Cloudinary deletion result
 */
export const deleteMultipleFromCloudinary = async (publicIds, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    cloudinary.api.delete_resources(publicIds, { resource_type: resourceType }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

export default cloudinary;
