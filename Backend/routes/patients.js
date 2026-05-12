const router  = require('express').Router();
const Patient = require('../models/Patient');
const User    = require('../models/User');
const auth    = require('../middleware/auth');

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function currentTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ── GET /api/patients ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const query = { clinicId: req.user.clinicId };

    // ── If requester is a doctor, only return their own patients ──
    if (req.user.role === 'doctor') {
      query.doctorId = req.user.id;
    }

    if (req.query.date === 'today') query.date = todayStr();

    let patients = await Patient.find(query).sort({ date: -1, token: 1 });

    if (req.query.search) {
      const s = req.query.search.toLowerCase();
      patients = patients.filter(
        (p) => p.name.toLowerCase().includes(s) || String(p.token).includes(s)
      );
    }
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/patients ────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const allowed = ['admin', 'receptionist'];
    if (!allowed.includes(req.user.role))
      return res.status(403).json({ message: 'Not allowed.' });

    const {
      name, age, phone, whatsapp, gender, symptoms, notes,
      doctorId, totalFee, paid, paymentMethod,
    } = req.body;

    if (!name || !doctorId || !symptoms)
      return res.status(400).json({ message: 'Name, doctor, and symptoms are required.' });

    const doctor = await User.findOne({ _id: doctorId, clinicId: req.user.clinicId, role: 'doctor' });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });

    // ── Check daily token limit ───────────────────────────────────
    if (doctor.dailyTokenLimit > 0) {
      const todayCount = await Patient.countDocuments({
        clinicId: req.user.clinicId, doctorId, date: todayStr(),
      });
      if (todayCount >= doctor.dailyTokenLimit) {
        return res.status(400).json({
          message: `Daily token limit of ${doctor.dailyTokenLimit} reached for Dr. ${doctor.name}.`,
        });
      }
    }

    const count = await Patient.countDocuments({
      clinicId: req.user.clinicId, doctorId, date: todayStr(),
    });
    const dues = Math.max(0, (parseFloat(totalFee) || 0) - (parseFloat(paid) || 0));

    const patient = await Patient.create({
      clinicId:      req.user.clinicId,
      doctorId,
      doctorName:    doctor.name,
      token:         count + 1,
      name:          name.trim(),
      age:           age       || '',
      phone:         phone     || '',
      whatsapp:      whatsapp  || '',
      gender:        gender    || 'male',
      symptoms:      symptoms.trim(),
      notes:         notes     || '',
      totalFee:      parseFloat(totalFee) || 0,
      paid:          parseFloat(paid)     || 0,
      dues,
      paymentMethod: paymentMethod === 'upi' ? 'upi' : 'cash',
      date:          todayStr(),
      time:          currentTime(),
      status:        'waiting',
    });

    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/patients/:id/status ───────────────────────────────
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['waiting', 'called', 'done'].includes(status))
      return res.status(400).json({ message: 'Invalid status.' });

    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.user.clinicId },
      { status },
      { new: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/patients/:id/followup ─────────────────────────────
router.patch('/:id/followup', auth, async (req, res) => {
  try {
    const allowed = ['admin', 'doctor', 'receptionist'];
    if (!allowed.includes(req.user.role))
      return res.status(403).json({ message: 'Not allowed.' });

    const { followUpDate, followUpNote } = req.body;

    if (followUpDate && !/^\d{4}-\d{2}-\d{2}$/.test(followUpDate))
      return res.status(400).json({ message: 'followUpDate must be YYYY-MM-DD format.' });

    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.user.clinicId },
      {
        followUpDate: followUpDate || '',
        followUpNote: followUpNote || '',
      },
      { new: true }
    );

    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;