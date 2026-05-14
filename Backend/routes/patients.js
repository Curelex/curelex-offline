const router  = require('express').Router();
const Patient = require('../models/Patient');
const User    = require('../models/User');
const auth    = require('../middleware/auth');

// ── Helper: emit live queue update to all patients in that room ───────────────
async function broadcastQueueUpdate(io, clinicId, doctorId, date) {
  if (!io) return;
  try {
    const patients = await Patient.find({ clinicId, doctorId, date })
      .select('token name status')
      .sort({ token: 1 })
      .lean();

    const currentlyServing = patients.find((p) => p.status === 'called');

    const payload = {
      currentToken:   currentlyServing ? currentlyServing.token : null,
      currentPatient: currentlyServing ? currentlyServing.name  : null,
      waitingCount:   patients.filter((p) => p.status === 'waiting').length,
      doneCount:      patients.filter((p) => p.status === 'done').length,
      totalCount:     patients.length,
      patients:       patients.map((p) => ({ token: p.token, name: p.name, status: p.status })),
    };

    const room = `queue_${clinicId}_${doctorId}_${date}`;
    io.to(room).emit('queue_update', payload);
    console.log(`📡 Broadcasted queue_update to room: ${room}`);
  } catch (err) {
    console.error('broadcastQueueUpdate error:', err.message);
  }
}

// ── GET /api/patients  — list with optional filters ──────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { role, clinicId } = req.user;
    const { date, doctorId, status } = req.query;

    const filter = { clinicId };
    if (date)     filter.date     = date;
    if (doctorId) filter.doctorId = doctorId;
    if (status)   filter.status   = status;

    // Receptionist & admin see all; doctor sees only their own
    if (role === 'doctor') filter.doctorId = req.user.id;

    const patients = await Patient.find(filter).sort({ token: 1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/patients  — add new patient + assign token ─────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { role, clinicId } = req.user;
    if (!['admin', 'receptionist'].includes(role))
      return res.status(403).json({ message: 'Not authorized.' });

    const {
      doctorId, doctorName,
      name, age, phone, whatsapp, gender, symptoms, notes,
      totalFee, paid, dues, paymentMethod,
      date, time,
    } = req.body;

    if (!doctorId || !name || !symptoms || !date || !time)
      return res.status(400).json({ message: 'Missing required fields.' });

    // Check doctor daily token limit
    const doctor = await User.findById(doctorId);
    if (doctor && doctor.dailyTokenLimit > 0) {
      const todayCount = await Patient.countDocuments({ clinicId, doctorId, date });
      if (todayCount >= doctor.dailyTokenLimit) {
        return res.status(400).json({
          message: `Token limit reached for Dr. ${doctorName}. Max ${doctor.dailyTokenLimit} patients per day.`,
        });
      }
    }

    // Next token number for this doctor today
    const lastPatient = await Patient.findOne({ clinicId, doctorId, date }).sort({ token: -1 });
    const token = lastPatient ? lastPatient.token + 1 : 1;

    const patient = await Patient.create({
      clinicId, doctorId, doctorName,
      token, name, age, phone, whatsapp, gender, symptoms, notes,
      totalFee, paid, dues, paymentMethod,
      date, time, status: 'waiting',
    });

    // Broadcast updated queue to all live-tracking patients
    const io = req.app.get('io');
    await broadcastQueueUpdate(io, clinicId, doctorId, date);

    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/patients/:id/status  — update status (called/done/waiting) ────
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { role, clinicId } = req.user;
    if (!['admin', 'receptionist', 'doctor'].includes(role))
      return res.status(403).json({ message: 'Not authorized.' });

    const { status } = req.body;
    if (!['waiting', 'called', 'done'].includes(status))
      return res.status(400).json({ message: 'Invalid status.' });

    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, clinicId },
      { status },
      { new: true }
    );

    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    // 🔴 KEY: Broadcast live queue update to all patients tracking this doctor
    const io = req.app.get('io');
    await broadcastQueueUpdate(io, clinicId, patient.doctorId, patient.date);

    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/patients/:id/followup  — update follow-up ─────────────────────
router.patch('/:id/followup', auth, async (req, res) => {
  try {
    const { clinicId } = req.user;
    const { followUpDate, followUpNote } = req.body;

    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, clinicId },
      { followUpDate, followUpNote },
      { new: true }
    );

    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/patients/:id/payment  — update payment ────────────────────────
router.patch('/:id/payment', auth, async (req, res) => {
  try {
    const { clinicId } = req.user;
    const { totalFee, paid, dues, paymentMethod } = req.body;

    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, clinicId },
      { totalFee, paid, dues, paymentMethod },
      { new: true }
    );

    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/patients/:id ──────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const { role, clinicId } = req.user;
    if (!['admin', 'receptionist'].includes(role))
      return res.status(403).json({ message: 'Not authorized.' });

    const patient = await Patient.findOneAndDelete({ _id: req.params.id, clinicId });
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    // Broadcast updated queue
    const io = req.app.get('io');
    await broadcastQueueUpdate(io, clinicId, patient.doctorId, patient.date);

    res.json({ message: 'Patient deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;