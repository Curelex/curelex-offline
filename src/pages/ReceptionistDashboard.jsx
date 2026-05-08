import React, { useState, useEffect } from 'react';
import {
  DashboardLayout, Card, Stat, Btn, Badge, Input, Select,
  Textarea, Modal, Alert, SectionHeader, Empty, TokenBadge,
} from '../components/UI';
import { getClinic, updateClinic, genId, today, currentTime } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { AllPatients } from './AdminDashboard';

function getGreeting(name) {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${greet}, ${name} 👋`;
}

export default function ReceptionistDashboard() {
  const { session, logout } = useApp();
  const [tab, setTab] = useState('register');
  const [clinic, setClinic] = useState(() => getClinic(session.clinicId));
  const [showToken, setShowToken] = useState(null);

  function reload() {
    const fresh = getClinic(session.clinicId);
    if (fresh) setClinic(fresh);
  }

  useEffect(() => {
    reload();
    const id = setInterval(reload, 3000);
    return () => clearInterval(id);
  }, []);

  const todayStr = today();
  const todayQueue = (clinic?.patients || [])
    .filter((p) => p.date === todayStr)
    .sort((a, b) => a.token - b.token);
  const waitingCount = todayQueue.filter((p) => p.status === 'waiting').length;

  if (!clinic) return <div style={{ padding: 32 }}>Clinic not found.</div>;

  const receptionistName = session.user?.name || 'Receptionist';

  const navItems = [
    { icon: '➕', label: 'Register Patient', active: tab === 'register', onClick: () => setTab('register') },
    { icon: '📋', label: "Today's Queue", active: tab === 'queue', onClick: () => setTab('queue'), badge: waitingCount || undefined },
    { icon: '👥', label: 'All Patients', active: tab === 'all', onClick: () => setTab('all') },
  ];

  function onPatientRegistered(patient) {
    setShowToken(patient);
    reload();
    setTab('queue');
  }

  return (
    <>
      {/* ── Mobile-first global overrides ── */}
      <style>{`
        @media (max-width: 640px) {
          .rp-register-grid { grid-template-columns: 1fr !important; }
          .rp-age-gender { grid-template-columns: 1fr 1fr !important; }
          .rp-phone-wa { grid-template-columns: 1fr !important; }
          .rp-doctor-card { flex-direction: row !important; }
          .rp-payment-card { grid-template-columns: 1fr !important; }
          .rp-greeting { font-size: 15px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
          .rp-subtitle { font-size: 11px !important; }
          .rp-queue-header { flex-direction: column !important; align-items: flex-start !important; }
          .rp-queue-badges { flex-wrap: wrap !important; gap: 6px !important; }
          .rp-queue-card { display: grid !important; grid-template-columns: auto 1fr !important; grid-template-areas: "token info" "actions actions" !important; gap: 8px 10px !important; padding: 10px 12px !important; align-items: start !important; }
          .rp-queue-card-info { grid-area: info; }
          .rp-queue-card-actions { grid-area: actions !important; width: 100% !important; justify-content: flex-end !important; padding-top: 2px !important; }
          .rp-action-btn { flex: 1 !important; text-align: center !important; }
        }
      `}</style>

      <DashboardLayout
        title={
          <span
            className="rp-greeting"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--primary)',
              letterSpacing: '-0.3px',
            }}
          >
            {getGreeting(receptionistName)}
          </span>
        }
        subtitle={
          <span className="rp-subtitle" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {clinic.name}
          </span>
        }
        navItems={navItems}
        onLogout={logout}
        clinicName={clinic.name}
        userRole="Receptionist"
        accent="#0f766e"
      >
        {tab === 'register' && (
          <PatientRegister clinic={clinic} reload={reload} onRegistered={onPatientRegistered} />
        )}
        {tab === 'queue' && <TodayQueue clinic={clinic} reload={reload} />}
        {tab === 'all' && <AllPatients clinic={clinic} />}

        {showToken && (
          <TokenPopup patient={showToken} onClose={() => setShowToken(null)} />
        )}
      </DashboardLayout>
    </>
  );
}

/* ── Token Generated Popup ───────────────────────────────────── */
function TokenPopup({ patient, onClose }) {
  return (
    <Modal title="🎉 Token Generated!" onClose={onClose} width={420}>
      <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
        <div
          style={{
            width: 130, height: 130, borderRadius: 65,
            background: 'var(--primary)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(15,76,129,0.3)',
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: 1 }}>TOKEN</div>
          <div style={{ color: '#fff', fontSize: 52, fontWeight: 800, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
            {patient.token}
          </div>
        </div>

        <h3 style={{ fontSize: 20, marginBottom: 4 }}>{patient.name}</h3>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>Dr. {patient.doctorName}</div>
        <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 20 }}>
          {patient.date} · {patient.time}
        </div>

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

        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, textAlign: 'left', display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>Symptoms:</span>
            <span style={{ fontWeight: 500 }}>{patient.symptoms}</span>
          </div>
          {patient.age && (
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>Age:</span>
              <span>{patient.age} yrs ({patient.gender})</span>
            </div>
          )}
          {patient.whatsapp && (
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>WhatsApp:</span>
              <span>{patient.whatsapp}</span>
            </div>
          )}
        </div>

        <Btn full size="lg" onClick={onClose}>✓ Done — Register Next Patient</Btn>
      </div>
    </Modal>
  );
}

/* ── Patient Register Form ────────────────────────────────────── */
function PatientRegister({ clinic, reload, onRegistered }) {
  // ✅ whatsapp field added to init
  const init = { name: '', age: '', phone: '', whatsapp: '', gender: 'male', symptoms: '', doctorId: '', totalFee: '', paid: '', notes: '' };
  const [form, setForm] = useState(init);
  const [err, setErr] = useState('');
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const dues = Math.max(0, (parseFloat(form.totalFee) || 0) - (parseFloat(form.paid) || 0));

  function register() {
    if (!form.name.trim()) { setErr('Patient name is required.'); return; }
    if (!form.doctorId) { setErr('Please select a doctor.'); return; }
    if (!form.symptoms.trim()) { setErr('Please describe the symptoms.'); return; }

    const fresh = getClinic(clinic.id);
    if (!fresh) return;

    const todayStr = today();
    const doctorTodayTokens = (fresh.patients || []).filter(
      (p) => p.doctorId === form.doctorId && p.date === todayStr
    );
    const token = doctorTodayTokens.length + 1;

    const doctor = fresh.doctors.find((d) => d.id === form.doctorId);
    const patient = {
      id: genId(),
      token,
      name: form.name.trim(),
      age: form.age,
      phone: form.phone,
      whatsapp: form.whatsapp,   // ✅ saved to patient record
      gender: form.gender,
      symptoms: form.symptoms.trim(),
      notes: form.notes,
      doctorId: form.doctorId,
      doctorName: doctor?.name || '',
      totalFee: parseFloat(form.totalFee) || 0,
      paid: parseFloat(form.paid) || 0,
      dues,
      date: todayStr,
      time: currentTime(),
      status: 'waiting',
    };

    fresh.patients = [...(fresh.patients || []), patient];
    updateClinic(fresh);
    setForm(init);
    setErr('');
    reload();
    onRegistered(patient);
  }

  return (
    <div>
      <SectionHeader title="Register Patient" subtitle="Fill the form to assign a queue token" />

      <div
        className="rp-register-grid"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}
      >
        {/* Left: Patient Info */}
        <Card>
          <h3 style={{ fontSize: 16, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>👤 Patient Information</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <Input label="Full Name" value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="e.g. Muhammad Ahmed" required />

            {/* Age + Gender */}
            <div className="rp-age-gender" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Age" type="number" value={form.age} onChange={(e) => f('age', e.target.value)} placeholder="25" />
              <Select label="Gender" value={form.gender} onChange={(e) => f('gender', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>

            {/* ✅ Phone + WhatsApp side by side */}
            <div className="rp-phone-wa" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => f('phone', e.target.value)}
                placeholder="03xx-xxxxxxx"
              />
              <div>
                <Input
                  label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </span>
                  }
                  value={form.whatsapp}
                  onChange={(e) => f('whatsapp', e.target.value)}
                  placeholder="03xx-xxxxxxx"
                />
              </div>
            </div>

            <Textarea label="Symptoms / Complaint" value={form.symptoms} onChange={(e) => f('symptoms', e.target.value)} placeholder="Describe patient's symptoms..." rows={3} required />
            <Textarea label="Additional Notes (optional)" value={form.notes} onChange={(e) => f('notes', e.target.value)} placeholder="Any other information..." rows={2} />
          </div>
        </Card>

        {/* Right: Doctor + Payment */}
        <div style={{ display: 'grid', gap: 16 }}>
          <Card>
            <h3 style={{ fontSize: 16, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>👨‍⚕️ Select Doctor</h3>
            {(clinic.doctors || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: 13 }}>
                No doctors registered yet. Ask admin to add doctors first.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {clinic.doctors.map((doc) => {
                  const todayCount = (clinic.patients || []).filter(
                    (p) => p.doctorId === doc.id && p.date === today()
                  ).length;
                  const isSelected = form.doctorId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        f('doctorId', doc.id);
                        if (doc.fee) f('totalFee', String(doc.fee));
                      }}
                      style={{
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 10,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                        transition: '.15s',
                      }}
                    >
                      <div className="rp-doctor-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {doc.specialist}{doc.fee ? ` · Rs. ${doc.fee}` : ''}
                          </div>
                          {doc.timing && <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>🕐 {doc.timing}</div>}
                        </div>
                        <div className="rp-token-preview" style={{ textAlign: 'center', background: isSelected ? 'var(--primary)' : 'var(--surface2)', borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: isSelected ? '#fff' : 'var(--primary)', fontFamily: "'Playfair Display', serif" }}>
                            #{todayCount + 1}
                          </div>
                          <div style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>Next Token</div>
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
              <div
                style={{
                  background: dues > 0 ? 'var(--danger-light)' : 'var(--success-light)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Dues / Remaining</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: dues > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  Rs. {dues.toLocaleString()}
                </div>
              </div>
            </div>
          </Card>

          {err && <Alert type="error">{err}</Alert>}
          <Btn full size="lg" onClick={register}>🎫 Generate Token &amp; Register</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Status sort order: waiting → called → done ──────────────── */
const STATUS_ORDER = { waiting: 0, called: 1, done: 2 };

function sortQueue(patients) {
  return [...patients].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.token - b.token;
  });
}

/* ── Today's Queue ────────────────────────────────────────────── */
function TodayQueue({ clinic, reload }) {
  const [localClinic, setLocalClinic] = useState(clinic);

  function freshReload() {
    const fresh = getClinic(clinic.id);
    if (fresh) setLocalClinic(fresh);
  }

  useEffect(() => {
    freshReload();
    const id = setInterval(freshReload, 3000);
    return () => clearInterval(id);
  }, []);

  const todayStr = today();
  const todayQ = sortQueue(
    (localClinic.patients || []).filter((p) => p.date === todayStr)
  );

  const waiting = todayQ.filter((p) => p.status === 'waiting');
  const called  = todayQ.filter((p) => p.status === 'called');
  const done    = todayQ.filter((p) => p.status === 'done');

  function updateStatus(patientId, status) {
    const fresh = getClinic(clinic.id);
    fresh.patients = fresh.patients.map((p) => (p.id === patientId ? { ...p, status } : p));
    updateClinic(fresh);
    freshReload();
  }

  return (
    <div>
      <div
        className="rp-queue-header"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}
      >
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

      {(localClinic.doctors || []).map((doc) => {
        const docQ = sortQueue(todayQ.filter((p) => p.doctorId === doc.id));
        if (docQ.length === 0) return null;

        const activeQ = docQ.filter((p) => p.status !== 'done');
        const doneQ   = docQ.filter((p) => p.status === 'done');

        return (
          <div key={doc.id} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 16px', background: 'var(--primary-light)', borderRadius: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 18 }}>👨‍⚕️</span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{doc.name}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>— {doc.specialist}</span>
              <Badge color="blue">{docQ.length} patients</Badge>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {activeQ.map((p) => (
                <QueueCard key={p.id} patient={p} onUpdateStatus={updateStatus} />
              ))}

              {activeQ.length > 0 && doneQ.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Completed</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
              )}

              {doneQ.map((p) => (
                <QueueCard key={p.id} patient={p} onUpdateStatus={updateStatus} />
              ))}
            </div>
          </div>
        );
      })}

      {todayQ.length === 0 && (
        <Empty
          icon="🪑"
          title="Queue is empty"
          desc="No patients registered today. Go to 'Register Patient' to add one."
        />
      )}
    </div>
  );
}

function QueueCard({ patient: p, onUpdateStatus }) {
  const statusBg = { waiting: 'var(--surface)', called: '#fffbeb', done: 'var(--surface2)' };
  return (
    <div
      className="rp-queue-card"
      style={{
        background: statusBg[p.status],
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: 'var(--shadow)',
      }}
    >
      <TokenBadge token={p.token} size="md" status={p.status} />
      <div className="rp-queue-card-info" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, textDecoration: p.status === 'done' ? 'line-through' : 'none', color: p.status === 'done' ? 'var(--text-muted)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.symptoms?.substring(0, 50)}{p.symptoms?.length > 50 ? '…' : ''}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2, display: 'flex', gap: 10 }}>
          <span>🕐 {p.time}</span>
          {/* ✅ Show WhatsApp in queue card if present */}
          {p.whatsapp && (
            <span style={{ color: '#25D366' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#25D366" style={{ verticalAlign: 'middle', marginRight: 2 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {p.whatsapp}
            </span>
          )}
        </div>
      </div>
      <div
        className="rp-queue-card-actions"
        style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
      >
        {p.dues > 0 && <Badge color="red">Due: Rs.{p.dues}</Badge>}
        <Badge color={p.status === 'called' ? 'yellow' : p.status === 'done' ? 'gray' : 'blue'}>
          {p.status === 'waiting' ? '⏳ Waiting' : p.status === 'called' ? '📢 Called' : '✓ Done'}
        </Badge>
        {p.status === 'waiting' && <Btn className="rp-action-btn" size="sm" variant="warning" onClick={() => onUpdateStatus(p.id, 'called')}>Call</Btn>}
        {p.status === 'called' && <Btn className="rp-action-btn" size="sm" variant="accent" onClick={() => onUpdateStatus(p.id, 'done')}>Done</Btn>}
      </div>
    </div>
  );
}