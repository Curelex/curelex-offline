const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const Clinic  = require('../models/Clinic');
const User    = require('../models/User');

function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// ── POST /api/auth/register  (Clinic self-registration) ─────────
router.post('/register', async (req, res) => {
  try {
    const { name, owner, email, password, phone, whatsapp, address, city, district, state } = req.body;

    if (!name || !owner || !email || !password)
      return res.status(400).json({ message: 'Please fill all required fields.' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const exists = await Clinic.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(400).json({ message: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const clinic = await Clinic.create({
      name, owner, email, password: hashed,
      phone, whatsapp, address, city, district, state,
    });

    const token = sign({ id: clinic._id, role: 'admin', clinicId: clinic._id });
    res.status(201).json({ token, role: 'admin', clinicId: clinic._id, clinic });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { role, email, password } = req.body;

    // Super admin
    if (role === 'superadmin') {
      if (
        email    === process.env.SUPER_ADMIN_EMAIL &&
        password === process.env.SUPER_ADMIN_PASSWORD
      ) {
        const token = sign({ id: 'superadmin', role: 'superadmin', clinicId: null });
        return res.json({ token, role: 'superadmin', clinicId: null });
      }
      return res.status(401).json({ message: 'Invalid super admin credentials.' });
    }

    // Clinic admin
    if (role === 'admin') {
      const clinic = await Clinic.findOne({ email: email.toLowerCase() });
      if (!clinic) return res.status(401).json({ message: 'Invalid admin credentials.' });

      const match = await bcrypt.compare(password, clinic.password);
      if (!match) return res.status(401).json({ message: 'Invalid admin credentials.' });

      const token = sign({ id: clinic._id, role: 'admin', clinicId: clinic._id });
      return res.json({ token, role: 'admin', clinicId: clinic._id, clinic });
    }

    // Doctor or Receptionist
    if (role === 'doctor' || role === 'receptionist') {
      const user = await User.findOne({ email: email.toLowerCase(), role });
      if (!user) return res.status(401).json({ message: `Invalid ${role} credentials.` });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ message: `Invalid ${role} credentials.` });

      const token = sign({ id: user._id, role, clinicId: user.clinicId });
      return res.json({ token, role, clinicId: user.clinicId, user });
    }

    res.status(400).json({ message: 'Unknown role.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;