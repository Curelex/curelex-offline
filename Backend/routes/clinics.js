const router = require('express').Router();
const Clinic = require('../models/Clinic');
const auth   = require('../middleware/auth');

// ── GET /api/clinics/me  — get own clinic ────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin only.' });

    const clinic = await Clinic.findById(req.user.clinicId).select('-password');
    if (!clinic) return res.status(404).json({ message: 'Clinic not found.' });
    res.json(clinic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/clinics/me  — update clinic settings ────────────────
router.put('/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin only.' });

    const { name, owner, phone, city } = req.body;
    const clinic = await Clinic.findByIdAndUpdate(
      req.user.clinicId,
      { name, owner, phone, city },
      { new: true }
    ).select('-password');

    res.json(clinic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/clinics/activate-plan  — choose/activate plan ──────
router.post('/activate-plan', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin only.' });

    const { plan } = req.body;
    if (!['basic', 'pro'].includes(plan))
      return res.status(400).json({ message: 'Invalid plan.' });

    const now = new Date();
    const exp = new Date(now);
    exp.setMonth(exp.getMonth() + 1);

    const clinic = await Clinic.findByIdAndUpdate(
      req.user.clinicId,
      {
        plan,
        planActivatedAt: now.toISOString().split('T')[0],
        planExpiresAt:   exp.toISOString().split('T')[0],
      },
      { new: true }
    ).select('-password');

    res.json(clinic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;