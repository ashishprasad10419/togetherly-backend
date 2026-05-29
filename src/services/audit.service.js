const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

async function record({ actor, action, target, metadata, ip }) {
  try {
    await AuditLog.create({ actor, action, target, metadata: metadata || {}, ip });
  } catch (err) {
    logger.warn('audit log write failed', err.message);
  }
}

module.exports = { record };
