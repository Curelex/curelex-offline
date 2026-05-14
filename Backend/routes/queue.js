const router       = require('express').Router();
const crypto       = require('crypto');
const auth         = require('../middleware/auth');
const Patient      = require('../models/Patient');
const Clinic       = require('../models/Clinic');
const User         = require('../models/User');
const QueueSession = require('../models/QueueSession');
const { sendTokenSMS } = require('../utils/sms');

// ── Helper: generate secure random session token ──────────────────────────────
function generateSessionToken() {
  return crypto.randomBytes(10).toString('hex'); // 20-char hex string
}

// ── Helper: get today's queue snapshot for a doctor ──────────────────────────
async function getDoctorQueueSnapshot(clinicId, doctorId, date) {
  const patients = await Patient.find({
    clinicId,
    doctorId,
    date,
  })
    .select('token name status')
    .sort({ token: 1 })
    .lean();

  const currentlyServing = patients.find((p) => p.status === 'called');
  const waiting          = patients.filter((p) => p.status === 'waiting');
  const done             = patients.filter((p) => p.status === 'done');

  return {
    currentToken:   currentlyServing ? currentlyServing.token : null,
    currentPatient: currentlyServing ? currentlyServing.name  : null,
    waitingCount:   waiting.length,
    doneCount:      done.length,
    totalCount:     patients.length,
    patients:       patients.map((p) => ({ token: p.token, name: p.name, status: p.status })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queue/send-sms
// Called by receptionist after creating a patient token
// Body: { patientId }
// Auth: receptionist or admin
// ─────────────────────────────────────────────────────────────────────────────
router.post('/send-sms', auth, async (req, res) => {
  try {
    const { role, clinicId } = req.user;
    if (!['admin', 'receptionist'].includes(role)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ message: 'patientId is required.' });
    }

    // Fetch patient
    const patient = await Patient.findOne({ _id: patientId, clinicId });
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    if (!patient.phone) {
      return res.status(400).json({ message: 'Patient has no phone number — cannot send SMS.' });
    }

    // Fetch clinic & doctor names
    const clinic = await Clinic.findById(clinicId).select('name');
    const doctor = await User.findById(patient.doctorId).select('name');

    const clinicName = clinic?.name  || 'Clinic';
    const doctorName = doctor?.name  || patient.doctorName;

    // Create or reuse session for today
    let session = await QueueSession.findOne({
      patientId: patient._id,
      date:      patient.date,
    });

    if (!session) {
      session = await QueueSession.create({
        patientId:    patient._id,
        clinicId,
        doctorId:     patient.doctorId,
        doctorName,
        clinicName,
        patientName:  patient.name,
        patientPhone: patient.phone,
        tokenNumber:  patient.token,
        date:         patient.date,
        sessionToken: generateSessionToken(),
      });
    }

    // Send SMS
    const smsResult = await sendTokenSMS(patient.phone, {
      tokenNumber:  patient.token,
      patientName:  patient.name,
      doctorName,
      clinicName,
      sessionToken: session.sessionToken,
    });

    // Update SMS status on session
    session.smsSent  = smsResult.success;
    session.smsError = smsResult.error || '';
    await session.save();

    return res.json({
      success:      smsResult.success,
      sessionToken: session.sessionToken,
      trackUrl:     `${process.env.APP_BASE_URL}/track/${session.sessionToken}`,
      message:      smsResult.success
        ? `SMS sent to ${patient.phone}`
        : `SMS failed: ${smsResult.error}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queue/track/:sessionToken   ← PUBLIC (no auth needed)
// Called by the patient's browser when they open the SMS link
// Returns full queue snapshot + their own token info
// ─────────────────────────────────────────────────────────────────────────────
router.get('/track/:sessionToken', async (req, res) => {
  try {
    const session = await QueueSession.findOne({
      sessionToken: req.params.sessionToken,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found or expired.' });
    }

    const snapshot = await getDoctorQueueSnapshot(
      session.clinicId,
      session.doctorId,
      session.date
    );

    const myToken     = session.tokenNumber;
    const nowServing  = snapshot.currentToken;

    // Tokens waiting ahead of patient
    const aheadCount = snapshot.patients.filter(
      (p) => p.status === 'waiting' && p.token < myToken
    ).length;

    // Estimated wait (avg 5 min per patient)
    const estWaitMins = aheadCount * 5;

    // Patient's own status
    const myRecord = snapshot.patients.find((p) => p.token === myToken);
    const myStatus = myRecord ? myRecord.status : 'waiting';

    return res.json({
      // Session info
      clinicName:   session.clinicName,
      doctorName:   session.doctorName,
      patientName:  session.patientName,
      date:         session.date,

      // My token
      myToken,
      myStatus,   // 'waiting' | 'called' | 'done'

      // Live queue
      currentToken:   nowServing,
      aheadCount,
      estWaitMins,
      totalPatients:  snapshot.totalCount,
      doneCount:      snapshot.doneCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queue/live/:clinicId/:doctorId/:date   ← INTERNAL (used by WebSocket)
// Returns live queue snapshot — called by socket server periodically
// ─────────────────────────────────────────────────────────────────────────────
router.get('/live/:clinicId/:doctorId/:date', auth, async (req, res) => {
  try {
    const { clinicId, doctorId, date } = req.params;
    const snapshot = await getDoctorQueueSnapshot(clinicId, doctorId, date);
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;