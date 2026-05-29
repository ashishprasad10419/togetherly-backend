const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

function mapFile(file) {
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  const isAudio = file.mimetype.startsWith('audio/');
  return {
    type: isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'file',
    url: file.path,
    publicId: file.filename,
    name: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  };
}

exports.uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided');
  res.json({ file: mapFile(req.file) });
});

exports.uploadMany = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw ApiError.badRequest('No files provided');
  res.json({ files: req.files.map(mapFile) });
});
