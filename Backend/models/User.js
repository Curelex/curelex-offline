const mongoose = require('mongoose');

// Each day's schedule slot
const DayScheduleSchema = new mongoose.Schema({
  day:  { type: String, required: true }, // 'Monday', 'Tuesday', etc.
  open: { type: Boolean, default: false },
  from: { type: String, default: '09:00' }, // 24-hr "HH:MM"
  to:   { type: String, default: '17:00' }, // 24-hr "HH:MM"
}, { _id: false });

const UserSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  role:     { type: String, enum: ['doctor', 'receptionist'], required: true },

  name:     { type: String, required: true },
  email:    { type: String, required: true, lowercase: true },
  password: { type: String, required: true },
  phone:    { type: String, default: '' },

  // Doctor-only fields
  specialist: { type: String, default: '' },
  fee:        { type: Number, default: 0 },

  // ── NEW: Daily token limit per doctor (0 = unlimited) ──────────
  dailyTokenLimit: { type: Number, default: 0, min: 0 },

  // Weekly schedule
  schedule: {
    type: [DayScheduleSchema],
    default: () => [
      { day: 'Monday',    open: false, from: '09:00', to: '17:00' },
      { day: 'Tuesday',   open: false, from: '09:00', to: '17:00' },
      { day: 'Wednesday', open: false, from: '09:00', to: '17:00' },
      { day: 'Thursday',  open: false, from: '09:00', to: '17:00' },
      { day: 'Friday',    open: false, from: '09:00', to: '17:00' },
      { day: 'Saturday',  open: false, from: '09:00', to: '17:00' },
      { day: 'Sunday',    open: false, from: '09:00', to: '17:00' },
    ],
  },

  addedAt: { type: String, default: () => new Date().toISOString().split('T')[0] },
}, { timestamps: true });

// Unique email per clinic
UserSchema.index({ clinicId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);