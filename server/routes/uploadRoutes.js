import express from 'express';
import multer from 'multer';
import { protect, admin } from '../middleware/auth.js';
import { uploadToCloudinary, uploadVideoToCloudinary, deleteFromCloudinary } from '../services/cloudinary.js';

const router = express.Router();

// Configure multer for memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();

// File filter - allow images and videos
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) and video files (mp4, webm, mov, avi) are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for videos
  }
});

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private (Admin only)
router.post('/image', protect, admin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert buffer to base64 data URI
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(dataURI, {
      folder: 'xplore-articles/images',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' }, // Limit max size
        { quality: 'auto:good' }
      ]
    });

    res.json({
      message: 'Image uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id,
      type: 'image',
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// @desc    Upload single video
// @route   POST /api/upload/video
// @access  Private (Admin only)
router.post('/video', protect, admin, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert buffer to base64 data URI
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await uploadVideoToCloudinary(dataURI);

    // Generate thumbnail URL
    const thumbnailUrl = result.secure_url.replace(/\.[^/.]+$/, '.jpg');

    res.json({
      message: 'Video uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id,
      type: 'video',
      thumbnail: thumbnailUrl,
      duration: result.duration,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// @desc    Upload multiple media files
// @route   POST /api/upload/media
// @access  Private (Admin only)
router.post('/media', protect, admin, upload.array('media', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      
      const isVideo = file.mimetype.startsWith('video/');
      
      if (isVideo) {
        const result = await uploadVideoToCloudinary(dataURI);
        const thumbnailUrl = result.secure_url.replace(/\.[^/.]+$/, '.jpg');
        return {
          type: 'video',
          url: result.secure_url,
          publicId: result.public_id,
          thumbnail: thumbnailUrl,
          duration: result.duration
        };
      } else {
        const result = await uploadToCloudinary(dataURI, {
          folder: 'xplore-articles/images',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto:good' }
          ]
        });
        return {
          type: 'image',
          url: result.secure_url,
          publicId: result.public_id
        };
      }
    });

    const media = await Promise.all(uploadPromises);

    res.json({
      message: 'Media uploaded successfully',
      media
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading files', error: error.message });
  }
});

// @desc    Delete media from Cloudinary
// @route   DELETE /api/upload/:publicId
// @access  Private (Admin only)
router.delete('/:publicId', protect, admin, async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;
    
    // Decode the publicId (it might be URL encoded)
    const decodedPublicId = decodeURIComponent(publicId);
    
    await deleteFromCloudinary(decodedPublicId, resourceType);

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 50MB' });
    }
    return res.status(400).json({ message: error.message });
  }
  
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  
  next();
});

export default router;
