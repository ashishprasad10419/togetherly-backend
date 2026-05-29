const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    const isAudio = file.mimetype.startsWith('audio/');
    return {
      folder: 'togetherly',
      resource_type: isImage ? 'image' : isVideo || isAudio ? 'video' : 'raw',
      allowed_formats: isImage
        ? ['jpg', 'jpeg', 'png', 'webp', 'gif']
        : isVideo
        ? ['mp4', 'mov', 'webm']
        : isAudio
        ? ['m4a', 'mp3', 'wav', 'ogg', 'aac']
        : undefined,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

module.exports = upload;
