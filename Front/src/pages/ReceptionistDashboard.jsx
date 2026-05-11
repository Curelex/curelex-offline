import React, { useState, useEffect, useCallback } from 'react';
import {
  DashboardLayout, Card, Stat, Btn, Badge, Input, Select,
  Textarea, Modal, Alert, SectionHeader, Empty, TokenBadge,
} from '../components/UI';
import { today, currentTime } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { AllPatients } from './AdminDashboard';

function getGreeting(name) {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${greet}, ${name} 👋`;
}

// ── Follow-up helpers ─────────────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now    = new Date(); now.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

function followUpBadgeStyle(days) {
  if (days < 0)   return { bg: 'rgba(231,76,60,0.10)',  border: 'rgba(231,76,60,0.3)',   color: '#c0392b', label: 'Overdue' };
  if (days === 0) return { bg: 'rgba(231,76,60,0.10)',  border: 'rgba(231,76,60,0.3)',   color: '#c0392b', label: 'Today!' };
  if (days <= 3)  return { bg: 'rgba(243,156,18,0.10)', border: 'rgba(243,156,18,0.3)',  color: '#d68910', label: `${days}d left` };
  return              { bg: 'rgba(0,184,148,0.08)',  border: 'rgba(0,184,148,0.25)',  color: '#00a878', label: `${days}d left` };
}

export default function ReceptionistDashboard() {
  const { session, logout, getPatients, getUsers, updatePatientStatus, updateFollowUp, addPatient } = useApp();
  const [tab,      setTab]      = useState('register');
  const [patients, setPatients] = useState([]);
  const [doctors,  setDoctors]  = useState([]);
  const [showToken, setShowToken] = useState(null);
  const [clinicName, setClinicName] = useState(session?.clinicName || '');

  const reload = useCallback(async () => {
    try {
      const [pats, users] = await Promise.all([getPatients(), getUsers()]);
      setPatients(pats);
      setDoctors(users.filter((u) => u.role === 'doctor'));
    } catch (e) {
      console.error('Receptionist reload error:', e);
    }
  }, [getPatients, getUsers]);

  useEffect(() => {
    reload();
    const id = setInterval(reload, 3000);
    return () => clearInterval(id);
  }, [reload]);

  const todayStr    = new Date().toISOString().split('T')[0];
  const todayQueue  = patients.filter((p) => p.date === todayStr).sort((a, b) => a.token - b.token);
  const waitingCount = todayQueue.filter((p) => p.status === 'waiting').length;

  const receptionistName = session?.user?.name || 'Receptionist';

  const navItems = [
    { icon: '➕', label: 'Register Patient', active: tab === 'register', onClick: () => setTab('register') },
    { icon: '📋', label: "Today's Queue",    active: tab === 'queue',    onClick: () => setTab('queue'),    badge: waitingCount || undefined },
    { icon: '👥', label: 'All Patients',     active: tab === 'all',      onClick: () => setTab('all') },
    { icon: '📅', label: 'Follow-ups',       active: tab === 'followups',onClick: () => setTab('followups') },
  ];

  async function handleUpdateStatus(patientId, status) {
    try {
      const updated = await updatePatientStatus(patientId, status);
      setPatients((prev) => prev.map((p) => (p._id === patientId ? updated : p)));
    } catch (e) { console.error(e); }
  }

  async function handleUpdateFollowUp(patientId, followUpDate, followUpNote) {
    try {
      const updated = await updateFollowUp(patientId, followUpDate, followUpNote);
      setPatients((prev) => prev.map((p) => (p._id === patientId ? updated : p)));
      return updated;
    } catch (e) { throw e; }
  }

  async function handleRegister(patientData) {
    const newPatient = await addPatient(patientData);
    setPatients((prev) => [...prev, newPatient]);
    setShowToken(newPatient);
    setTab('queue');
  }

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .rp-register-grid { grid-template-columns: 1fr !important; }
          .rp-age-gender { grid-template-columns: 1fr 1fr !important; }
          .rp-phone-wa { grid-template-columns: 1fr !important; }
          .rp-queue-header { flex-direction: column !important; align-items: flex-start !important; }
          .rp-queue-badges { flex-wrap: wrap !important; gap: 6px !important; }
          .rp-queue-card { flex-wrap: wrap !important; }
        }
      `}</style>

      <DashboardLayout
        title={<span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{getGreeting(receptionistName)}</span>}
        subtitle={<span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{clinicName}</span>}
        navItems={navItems}
        onLogout={logout}
        clinicName={clinicName}
        userRole="Receptionist"
        accent="#0f766e"
      >
        {tab === 'register'  && <PatientRegister doctors={doctors} patients={patients} onRegistered={handleRegister} />}
        {tab === 'queue'     && <TodayQueue todayQueue={todayQueue} doctors={doctors} onUpdateStatus={handleUpdateStatus} onUpdateFollowUp={handleUpdateFollowUp} />}
        {tab === 'all'       && <AllPatients patients={patients} />}
        {tab === 'followups' && <FollowUpsTab patients={patients} onUpdateFollowUp={handleUpdateFollowUp} />}

        {showToken && <TokenPopup patient={showToken} onClose={() => setShowToken(null)} />}
      </DashboardLayout>
    </>
  );
}

/* ── Token Popup ─────────────────────────────────────────────── */
function TokenPopup({ patient, onClose }) {
  return (
    <Modal title="🎉 Token Generated!" onClose={onClose} width={420}>
      <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
        <div style={{ width: 130, height: 130, borderRadius: 65, background: 'var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(15,76,129,0.3)' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: 1 }}>TOKEN</div>
          <div style={{ color: '#fff', fontSize: 52, fontWeight: 800, lineHeight: 1 }}>{patient.token}</div>
        </div>
        <h3 style={{ fontSize: 20, marginBottom: 4 }}>{patient.name}</h3>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>Dr. {patient.doctorName}</div>
        <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 20 }}>{patient.date} · {patient.time}</div>
        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px', marginBottom: 20, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: patient.dues > 0 ? 8 : 0 }}>
            <span style={{ color: 'var(--text-muted)' }}>Amount Paid</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Rs. {patient.paid || 0}</span>
          </div>
          {patient.dues > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Dues Remaining</span>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Rs. {patient.dues}</span>
            </div>
          )}
        </div>
        <Btn full size="lg" onClick={onClose}>✓ Done — Register Next Patient</Btn>
      </div>
    </Modal>
  );
}

/* ── Patient Register ─────────────────────────────────────────── */
function PatientRegister({ doctors, patients, onRegistered }) {
  const init = { name: '', age: '', phone: '', whatsapp: '', gender: 'male', symptoms: '', doctorId: '', totalFee: '', paid: '', notes: '' };
  const [form, setForm] = useState(init);
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const todayStr = new Date().toISOString().split('T')[0];
  const dues = Math.max(0, (parseFloat(form.totalFee) || 0) - (parseFloat(form.paid) || 0));

  async function register() {
    if (!form.name.trim())    { setErr('Patient name is required.'); return; }
    if (!form.doctorId)       { setErr('Please select a doctor.'); return; }
    if (!form.symptoms.trim()) { setErr('Please describe the symptoms.'); return; }
    setBusy(true); setErr('');
    try {
      await onRegistered({
        name: form.name.trim(), age: form.age, phone: form.phone,
        whatsapp: form.whatsapp, gender: form.gender,
        symptoms: form.symptoms.trim(), notes: form.notes,
        doctorId: form.doctorId,
        totalFee: parseFloat(form.totalFee) || 0,
        paid:     parseFloat(form.paid)     || 0,
      });
      setForm(init);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <SectionHeader title="Register Patient" subtitle="Fill the form to assign a queue token" />
      <div className="rp-register-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <Card>
          <h3 style={{ fontSize: 16, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>👤 Patient Information</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <Input label="Full Name *" value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="e.g. Muhammad Ahmed" />
            <div className="rp-age-gender" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Age" type="number" value={form.age} onChange={(e) => f('age', e.target.value)} placeholder="25" />
              <Select label="Gender" value={form.gender} onChange={(e) => f('gender', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="rp-phone-wa" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Phone" value={form.phone} onChange={(e) => f('phone', e.target.value)} placeholder="03xx-xxxxxxx" />
              <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => f('whatsapp', e.target.value)} placeholder="03xx-xxxxxxx" />
            </div>
            <Textarea label="Symptoms / Complaint *" value={form.symptoms} onChange={(e) => f('symptoms', e.target.value)} placeholder="Describe patient's symptoms..." rows={3} />
            <Textarea label="Additional Notes (optional)" value={form.notes} onChange={(e) => f('notes', e.target.value)} placeholder="Any other information..." rows={2} />
          </div>
        </Card>

        <div style={{ display: 'grid', gap: 16 }}>
          <Card>
            <h3 style={{ fontSize: 16, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>👨‍⚕️ Select Doctor</h3>
            {doctors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: 13 }}>No doctors registered yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {doctors.map((doc) => {
                  const todayCount = patients.filter((p) => String(p.doctorId) === String(doc._id) && p.date === new Date().toISOString().split('T')[0]).length;
                  const isSelected = form.doctorId === String(doc._id);
                  const limit = doc.dailyTokenLimit ?? 0;
                  const limitReached = limit > 0 && todayCount >= limit;
                  return (
                    <div key={doc._id}
                      onClick={() => { if (!limitReached) { f('doctorId', String(doc._id)); if (doc.fee) f('totalFee', String(doc.fee)); } }}
                      style={{ border: `2px solid ${isSelected ? 'var(--primary)' : limitReached ? '#e74c3c' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px', cursor: limitReached ? 'not-allowed' : 'pointer', background: isSelected ? 'var(--primary-light)' : limitReached ? 'rgba(231,76,60,0.04)' : 'var(--surface)', opacity: limitReached ? 0.7 : 1, transition: '.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{doc.specialist}{doc.fee ? ` · Rs. ${doc.fee}` : ''}</div>
                          {limitReached && <div style={{ fontSize: 11, color: '#e74c3c', fontWeight: 700, marginTop: 2 }}>🚫 Daily limit reached ({todayCount}/{limit})</div>}
                        </div>
                        <div style={{ textAlign: 'center', background: isSelected ? 'var(--primary)' : 'var(--surface2)', borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: isSelected ? '#fff' : 'var(--primary)' }}>#{todayCount + 1}</div>
                          <div style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                            {limit > 0 ? `${todayCount}/${limit}` : 'Next Token'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <h3 style={{ fontSize: 16, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>💰 Payment Details</h3>
            <div style={{ display: 'grid', gap: 14 }}>
              <Input label="Total Fee (Rs.)" type="number" value={form.totalFee} onChange={(e) => f('totalFee', e.target.value)} placeholder="0" />
              <Input label="Amount Paid Now (Rs.)" type="number" value={form.paid} onChange={(e) => f('paid', e.target.value)} placeholder="0" />
              <div style={{ background: dues > 0 ? 'var(--danger-light)' : 'var(--success-light)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Dues / Remaining</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: dues > 0 ? 'var(--danger)' : 'var(--success)' }}>Rs. {dues.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          {err && <Alert type="error">{err}</Alert>}
          <Btn full size="lg" onClick={register} disabled={busy}>{busy ? 'Registering…' : '🎫 Generate Token & Register'}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Today's Queue ────────────────────────────────────────────── */
const STATUS_ORDER = { waiting: 0, called: 1, done: 2 };
function sortQueue(patients) {
  return [...patients].sort((a, b) => {
    const d = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return d !== 0 ? d : a.token - b.token;
  });
}

function TodayQueue({ todayQueue, doctors, onUpdateStatus, onUpdateFollowUp }) {
  const sorted   = sortQueue(todayQueue);
  const waiting  = sorted.filter((p) => p.status === 'waiting');
  const called   = sorted.filter((p) => p.status === 'called');
  const done     = sorted.filter((p) => p.status === 'done');

  return (
    <div>
      <div className="rp-queue-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Today's Queue</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Auto-refreshes every 3 seconds</p>
        </div>
        <div className="rp-queue-badges" style={{ display: 'flex', gap: 10 }}>
          <Badge color="blue">⏳ {waiting.length} Waiting</Badge>
          <Badge color="yellow">📢 {called.length} Called</Badge>
          <Badge color="green">✓ {done.length} Done</Badge>
        </div>
      </div>

      {doctors.map((doc) => {
        const docQ   = sortQueue(sorted.filter((p) => String(p.doctorId) === String(doc._id)));
        if (docQ.length === 0) return null;
        const activeQ = docQ.filter((p) => p.status !== 'done');
        const doneQ   = docQ.filter((p) => p.status === 'done');

        return (
          <div key={doc._id} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 16px', background: 'var(--primary-light)', borderRadius: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 18 }}>👨‍⚕️</span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{doc.name}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>— {doc.specialist}</span>
              <Badge color="blue">{docQ.length} patients</Badge>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {activeQ.map((p) => <QueueCard key={p._id} patient={p} onUpdateStatus={onUpdateStatus} onUpdateFollowUp={onUpdateFollowUp} />)}
              {activeQ.length > 0 && doneQ.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Completed</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
              )}
              {doneQ.map((p) => <QueueCard key={p._id} patient={p} onUpdateStatus={onUpdateStatus} onUpdateFollowUp={onUpdateFollowUp} />)}
            </div>
          </div>
        );
      })}

      {sorted.length === 0 && <Empty icon="🪑" title="Queue is empty" desc="No patients registered today. Go to 'Register Patient' to add one." />}
    </div>
  );
}

/* ── Queue Card ──────────────────────────────────────────────── */
function QueueCard({ patient: p, onUpdateStatus, onUpdateFollowUp }) {
  const pid = p._id || p.id;
  const [showFollowUp, setShowFollowUp] = useState(false);
  const statusBg = { waiting: 'var(--surface)', called: '#fffbeb', done: 'var(--surface2)' };
  const days = daysUntil(p.followUpDate);

  return (
    <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
      <div style={{ background: statusBg[p.status], padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <TokenBadge token={p.token} size="md" status={p.status} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, textDecoration: p.status === 'done' ? 'line-through' : 'none', color: p.status === 'done' ? 'var(--text-muted)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.symptoms?.substring(0, 50)}{p.symptoms?.length > 50 ? '…' : ''}</div>
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span>🕐 {p.time}</span>
            {p.dues > 0 && <span style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠️ Due: Rs.{p.dues}</span>}
            {p.followUpDate && days !== null && (
              <span style={{ color: followUpBadgeStyle(days).color, fontWeight: 600 }}>
                📅 Follow-up: {p.followUpDate} ({followUpBadgeStyle(days).label})
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          {p.dues > 0 && <Badge color="red">Due: Rs.{p.dues}</Badge>}
          <Badge color={p.status === 'called' ? 'yellow' : p.status === 'done' ? 'gray' : 'blue'}>
            {p.status === 'waiting' ? '⏳ Waiting' : p.status === 'called' ? '📢 Called' : '✓ Done'}
          </Badge>
          {p.status === 'waiting' && <Btn size="sm" variant="warning" onClick={() => onUpdateStatus(pid, 'called')}>Call</Btn>}
          {p.status === 'called'  && <Btn size="sm" variant="accent"  onClick={() => onUpdateStatus(pid, 'done')}>Done</Btn>}
          <button
            onClick={() => setShowFollowUp((v) => !v)}
            title="Set follow-up date"
            style={{ background: p.followUpDate ? 'rgba(124,58,237,0.10)' : 'none', border: '1px solid #c5d5e8', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontSize: 14, color: '#7c3aed' }}
          >📅</button>
        </div>
      </div>

      {showFollowUp && (
        <FollowUpInlineEditor
          patient={p}
          onSave={async (date, note) => { await onUpdateFollowUp(pid, date, note); setShowFollowUp(false); }}
          onCancel={() => setShowFollowUp(false)}
        />
      )}
    </div>
  );
}

/* ── Follow-up Inline Editor ─────────────────────────────────── */
function FollowUpInlineEditor({ patient: p, onSave, onCancel }) {
  const [date, setDate] = useState(p.followUpDate || '');
  const [note, setNote] = useState(p.followUpNote || '');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  async function save() {
    setBusy(true); setErr('');
    try { await onSave(date, note); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ padding: '12px 16px 14px', background: 'rgba(124,58,237,0.04)', borderTop: '1px solid rgba(124,58,237,0.12)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>📅 Set Follow-up Date</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Date</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #c5d5e8', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#0a3d62', fontWeight: 600 }} />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Note (optional)</div>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Check blood pressure"
            style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px solid #c5d5e8', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button onClick={save} disabled={busy || !date}
          style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 700, cursor: busy || !date ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !date ? 0.6 : 1 }}>
          {busy ? '…' : '✓ Save'}
        </button>
        {p.followUpDate && (
          <button onClick={() => onSave('', '')} disabled={busy}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', color: '#e74c3c', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            🗑 Clear
          </button>
        )}
        <button onClick={onCancel}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #d0dce8', background: '#fff', color: '#4a6278', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
      </div>
      {err && <div style={{ fontSize: 12, color: '#e74c3c', marginTop: 6 }}>{err}</div>}
    </div>
  );
}

/* ── Follow-ups Tab ──────────────────────────────────────────── */
function FollowUpsTab({ patients, onUpdateFollowUp }) {
  const [editingId, setEditingId] = useState(null);

  const upcoming = patients
    .filter((p) => p.followUpDate)
    .map((p) => ({ ...p, _days: daysUntil(p.followUpDate) }))
    .sort((a, b) => a._days - b._days);

  const urgent = upcoming.filter((p) => p._days <= 3);
  const rest   = upcoming.filter((p) => p._days > 3);

  function renderRow(p) {
    const style = followUpBadgeStyle(p._days);
    const pid   = p._id || p.id;
    return (
      <div key={pid}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid var(--border)', background: p._days <= 3 ? style.bg : '#fff', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dr. {p.doctorName} · {p.symptoms?.substring(0, 40)}</div>
            {p.followUpNote && <div style={{ fontSize: 11.5, color: '#7c3aed', marginTop: 2 }}>📝 {p.followUpNote}</div>}
            {p.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>📞 {p.phone}{p.whatsapp && p.whatsapp !== p.phone ? ` · 💬 ${p.whatsapp}` : ''}</div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: style.color }}>{p.followUpDate}</div>
            <div style={{ fontSize: 11, color: style.color, fontWeight: 600, marginTop: 1 }}>{style.label}</div>
          </div>
          <button
            onClick={() => setEditingId(editingId === pid ? null : pid)}
            style={{ background: 'none', border: '1px solid #c5d5e8', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontSize: 13, color: '#7c3aed' }}
          >✏️</button>
        </div>
        {editingId === pid && (
          <FollowUpInlineEditor
            patient={p}
            onSave={async (date, note) => { await onUpdateFollowUp(pid, date, note); setEditingId(null); }}
            onCancel={() => setEditingId(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Follow-up Dates" subtitle="All patients with scheduled follow-ups" />

      {upcoming.length === 0 ? (
        <div style={{ background: 'rgba(124,58,237,0.04)', border: '1.5px solid rgba(124,58,237,0.15)', borderRadius: 14, padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No follow-up dates set yet</div>
          <div style={{ fontSize: 13 }}>Use the 📅 button on any patient in Today's Queue to set a follow-up date.</div>
        </div>
      ) : (
        <div style={{ border: '1.5px solid rgba(124,58,237,0.2)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: 'linear-gradient(90deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>📅</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>All Follow-up Appointments</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {urgent.length > 0 && <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>🔴 {urgent.length} urgent</span>}
              <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{upcoming.length} total</span>
            </div>
          </div>

          {urgent.length > 0 && (
            <>
              <div style={{ padding: '7px 14px', background: 'rgba(231,76,60,0.07)', borderBottom: '1px solid rgba(231,76,60,0.15)', fontSize: 11, fontWeight: 700, color: '#c0392b', textTransform: 'uppercase', letterSpacing: 0.4 }}>⚠️ Needs attention soon (within 3 days)</div>
              {urgent.map(renderRow)}
            </>
          )}
          {rest.length > 0 && (
            <>
              <div style={{ padding: '7px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>📆 Upcoming</div>
              {rest.map(renderRow)}
            </>
          )}
        </div>
      )}
    </div>
  );
}