const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  clinicId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  doctorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  doctorName: { type: String, required: true },

  token:    { type: Number, required: true },
  name:     { type: String, required: true },
  age:      { type: String, default: '' },
  phone:    { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  gender:   { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  symptoms: { type: String, required: true },
  notes:    { type: String, default: '' },

  totalFee: { type: Number, default: 0 },
  paid:     { type: Number, default: 0 },
  dues:     { type: Number, default: 0 },

  date:   { type: String, required: true },  // "YYYY-MM-DD"
  time:   { type: String, required: true },  // "HH:MM AM/PM"
  status: { type: String, enum: ['waiting', 'called', 'done'], default: 'waiting' },

  // ── Follow-up ─────────────────────────────────────────────────
  followUpDate: { type: String, default: '' },  // "YYYY-MM-DD"
  followUpNote: { type: String, default: '' },  // optional note
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);