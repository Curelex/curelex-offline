const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User   = require('../models/User');
const auth   = require('../middleware/auth');

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function defaultSchedule() {
  return DAYS.map((day) => ({ day, open: false, from: '09:00', to: '17:00' }));
}

function sanitiseSchedule(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return defaultSchedule();
  return DAYS.map((day) => {
    const slot = raw.find((s) => s.day === day);
    if (!slot) return { day, open: false, from: '09:00', to: '17:00' };
    return { day, open: !!slot.open, from: slot.from || '09:00', to: slot.to || '17:00' };
  });
}

// ── GET /api/users  — list doctors & receptionists for clinic ────
router.get('/', auth, async (req, res) => {
  try {
    const allowedRoles = ['admin', 'receptionist'];
    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({ message: 'Not allowed.' });

    const users = await User.find({ clinicId: req.user.clinicId }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/users  — add doctor or receptionist ────────────────
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin only.' });

    const { role, name, email, password, phone, specialist, fee, schedule } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'Fill all required fields.' });

    if (!['doctor', 'receptionist'].includes(role))
      return res.status(400).json({ message: 'Invalid role.' });

    const exists = await User.findOne({ clinicId: req.user.clinicId, email: email.toLowerCase() });
    if (exists)
      return res.status(400).json({ message: 'This email is already in use.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      clinicId:        req.user.clinicId,
      role,
      name,
      email:           email.toLowerCase(),
      password:        hashed,
      phone:           phone      || '',
      specialist:      specialist || '',
      fee:             fee        || 0,
      schedule:        sanitiseSchedule(schedule),
      dailyTokenLimit: 0, // default: unlimited
    });

    const { password: _, ...safe } = user.toObject();
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/users/:id/schedule  — update doctor schedule ──────
// Admin can update anyone; doctor can only update themselves.
router.patch('/:id/schedule', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isSelf  = String(req.user.id) === String(req.params.id);
    if (!isAdmin && !isSelf)
      return res.status(403).json({ message: 'Not allowed.' });

    const user = await User.findOne({ _id: req.params.id, clinicId: req.user.clinicId });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.schedule = sanitiseSchedule(req.body.schedule);
    await user.save();

    const { password: _, ...safe } = user.toObject();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/users/:id/token-limit  — set daily token limit ────
// Admin can set limit for any doctor.
// Doctor can set their own limit too.
router.patch('/:id/token-limit', auth, async (req, res) => {
  try {
    const isAdmin  = req.user.role === 'admin';
    const isDoctor = req.user.role === 'doctor';
    const isSelf   = String(req.user.id) === String(req.params.id);

    if (!isAdmin && !(isDoctor && isSelf))
      return res.status(403).json({ message: 'Not allowed.' });

    const { dailyTokenLimit } = req.body;

    if (dailyTokenLimit === undefined || dailyTokenLimit === null)
      return res.status(400).json({ message: 'dailyTokenLimit is required.' });

    const limit = parseInt(dailyTokenLimit, 10);
    if (isNaN(limit) || limit < 0)
      return res.status(400).json({ message: 'dailyTokenLimit must be a non-negative integer. Use 0 for unlimited.' });

    const user = await User.findOne({ _id: req.params.id, clinicId: req.user.clinicId });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.role !== 'doctor')
      return res.status(400).json({ message: 'Token limit can only be set for doctors.' });

    user.dailyTokenLimit = limit;
    await user.save();

    const { password: _, ...safe } = user.toObject();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/users/:id ─────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin only.' });

    const user = await User.findOne({ _id: req.params.id, clinicId: req.user.clinicId });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    await user.deleteOne();
    res.json({ message: 'Deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;