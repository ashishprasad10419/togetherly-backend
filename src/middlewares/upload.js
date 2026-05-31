const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

/**
 * Cloudinary upload params.
 *
 *  - For images we keep `resource_type: image` so we get image-specific
 *    transformations.
 *  - For videos AND audio we use `resource_type: video` — Cloudinary stores
 *    audio under the video type because it shares the same media pipeline.
 *  - For anything else, `raw` lets users send arbitrary files.
 *  - `allowed_formats` is intentionally NOT set: Android voice recorders save
 *    `.m4a` inside `.mp4` containers, so a strict whitelist incorrectly rejects
 *    valid voice notes. The 50 MB cap below is our guardrail.
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const m = (file.mimetype || '').toLowerCase();
    const name = (file.originalname || '').toLowerCase();
    const isImage = m.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic)$/.test(name);
    const isVideo = m.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi)$/.test(name);
    const isAudio = m.startsWith('audio/') || /\.(m4a|mp3|wav|ogg|aac|3gp)$/.test(name);

    let resource_type = 'raw';
    if (isImage) resource_type = 'image';
    else if (isVideo || isAudio) resource_type = 'video';

    return {
      folder: 'togetherly',
      resource_type,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

module.exports = upload;
