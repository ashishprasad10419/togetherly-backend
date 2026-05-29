const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = system
    action: { type: String, required: true, index: true }, // e.g. 'user.delete', 'admin.stats'
    target: { type: String }, // free-form target identifier (user id, chat id, etc.)
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String },
  },
  { timestamps: true }
);

auditSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditSchema);
