const mongoose = require('mongoose');

// One session is created per patient token when SMS is sent
const QueueSessionSchema = new mongoose.Schema({
  // Link to patient record
  patientId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  clinicId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic',  required: true },
  doctorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  doctorName: { type: String, required: true },
  clinicName: { type: String, required: true },

  // Patient info (denormalized for fast public access without auth)
  patientName:  { type: String, required: true },
  patientPhone: { type: String, required: true },
  tokenNumber:  { type: Number, required: true },
  date:         { type: String, required: true }, // "YYYY-MM-DD"

  // Unique public token for the tracking URL (no auth needed)
  // e.g. https://yourapp.com/track/abc123xyz
  sessionToken: { type: String, required: true, unique: true },

  // Whether SMS was sent
  smsSent:  { type: Boolean, default: false },
  smsError: { type: String,  default: '' },

  // Expires 24 hours after creation
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true });

// Auto-delete expired sessions using MongoDB TTL index
QueueSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('QueueSession', QueueSessionSchema);