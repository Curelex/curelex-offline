import React, { useState, useEffect } from 'react';
import {
  DashboardLayout, Card, Stat, Btn, Badge, Input, Select,
  Modal, Alert, SectionHeader, Empty, TokenBadge,
} from '../components/UI';
import { getClinic, updateClinic, genId, today } from '../utils/helpers';
import { useApp } from '../context/AppContext';

export default function AdminDashboard() {
  const { session, logout } = useApp();
  const [tab, setTab] = useState('overview');
  const [clinic, setClinic] = useState(() => getClinic(session.clinicId));

  function reload() {
    const fresh = getClinic(session.clinicId);
    if (fresh) setClinic(fresh);
  }

  useEffect(() => { reload(); }, [tab]);

  function saveClinic(updated) {
    updateClinic(updated);
    setClinic(updated);
  }

  const todayStr = today();
  const todayPatients = (clinic?.patients || []).filter((p) => p.date === todayStr);
  const paidTotal = todayPatients.reduce((s, p) => s + (p.paid || 0), 0);
  const duesTotal = todayPatients.reduce((s, p) => s + (p.dues || 0), 0);

  if (!clinic) return <div style={{ padding: 32 }}>Clinic not found.</div>;

  const navItems = [
    { icon: '📊', label: 'Overview', active: tab === 'overview', onClick: () => setTab('overview') },
    { icon: '👨‍⚕️', label: 'Doctors', active: tab === 'doctors', onClick: () => setTab('doctors'), badge: clinic.doctors?.length || undefined },
    { icon: '📋', label: 'Receptionists', active: tab === 'receptionists', onClick: () => setTab('receptionists'), badge: clinic.receptionists?.length || undefined },
    { icon: '👥', label: 'All Patients', active: tab === 'patients', onClick: () => setTab('patients') },
    { icon: '⚙️', label: 'Settings', active: tab === 'settings', onClick: () => setTab('settings') },
  ];

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle={`Welcome, ${clinic.owner}`}
      navItems={navItems}
      onLogout={logout}
      clinicName={clinic.name}
      userRole="Administrator"
      accent="var(--primary)"
    >
      {tab === 'overview' && (
        <Overview clinic={clinic} todayPatients={todayPatients} paidTotal={paidTotal} duesTotal={duesTotal} />
      )}
      {tab === 'doctors' && <DoctorManagement clinic={clinic} saveClinic={saveClinic} />}
      {tab === 'receptionists' && <ReceptionistManagement clinic={clinic} saveClinic={saveClinic} />}
      {tab === 'patients' && <AllPatients clinic={clinic} />}
      {tab === 'settings' && <ClinicSettings clinic={clinic} saveClinic={saveClinic} />}
    </DashboardLayout>
  );
}

/* ── Overview ─────────────────────────────────────────────────── */
function Overview({ clinic, todayPatients, paidTotal, duesTotal }) {
  return (
    <div>
      <SectionHeader title="Clinic Overview" subtitle={`Today's summary — ${today()}`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 16, marginBottom: 24 }}>
        <Stat label="Today's Tokens" value={todayPatients.length} icon="🎫" color="var(--primary)" />
        <Stat label="Total Doctors" value={clinic.doctors?.length || 0} icon="👨‍⚕️" color="var(--accent)" />
        <Stat label="Receptionists" value={clinic.receptionists?.length || 0} icon="📋" color="var(--warning)" />
        <Stat label="Today's Revenue Rs." value={paidTotal.toLocaleString()} icon="💰" color="var(--success)" />
        <Stat label="Pending Dues Rs." value={duesTotal.toLocaleString()} icon="⚠️" color="var(--danger)" />
      </div>

      {/* Per-doctor breakdown */}
      {(clinic.doctors || []).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>Doctor Queue Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
            {clinic.doctors.map((doc) => {
              const docPatients = todayPatients.filter((p) => p.doctorId === doc.id);
              const waiting = docPatients.filter((p) => p.status === 'waiting').length;
              const done = docPatients.filter((p) => p.status === 'done').length;
              return (
                <Card key={doc.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👨‍⚕️</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.specialist}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Badge color="blue">🎫 {docPatients.length} Total</Badge>
                    <Badge color="yellow">⏳ {waiting} Wait</Badge>
                    <Badge color="green">✓ {done} Done</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's queue table */}
      <Card noPad>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16 }}>📋 Today's Patient Queue</h3>
          <Badge color="blue">{todayPatients.length} patients</Badge>
        </div>
        {todayPatients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🪑</div>
            <div>No patients registered today yet.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['Token', 'Patient', 'Doctor', 'Symptoms', 'Paid Rs.', 'Dues Rs.', 'Time', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todayPatients.sort((a, b) => a.token - b.token).map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px' }}><TokenBadge token={p.token} size="sm" status={p.status} /></td>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{p.doctorName}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.symptoms}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--success)', fontWeight: 500 }}>{p.paid || 0}</td>
                    <td style={{ padding: '10px 14px', color: p.dues > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: p.dues > 0 ? 600 : 400 }}>{p.dues || 0}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.time}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge color={p.status === 'called' ? 'green' : p.status === 'done' ? 'gray' : 'blue'}>
                        {p.status === 'waiting' ? 'Waiting' : p.status === 'called' ? 'Called' : 'Done'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── Doctor Management ────────────────────────────────────────── */
const SPECIALISTS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'ENT Specialist',
  'Gynecologist', 'Neurologist', 'Orthopedic', 'Pediatrician', 'Psychiatrist',
  'Urologist', 'Dentist', 'Eye Specialist', 'Diabetologist', 'Chest Specialist',
];

function DoctorManagement({ clinic, saveClinic }) {
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ name: '', specialist: '', phone: '', email: '', password: '', fee: '', days: '', timing: '' });
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function addDoctor() {
    if (!form.name || !form.email || !form.password || !form.specialist) { setErr('Fill all required fields.'); return; }
    const exists = [...(clinic.doctors || []), ...(clinic.receptionists || [])].find((x) => x.email === form.email);
    if (exists) { setErr('This email is already in use.'); return; }
    const doc = { id: genId(), ...form, addedAt: today() };
    saveClinic({ ...clinic, doctors: [...(clinic.doctors || []), doc] });
    setForm({ name: '', specialist: '', phone: '', email: '', password: '', fee: '', days: '', timing: '' });
    setErr('');
    setShow(false);
  }

  function removeDoctor(id) {
    if (!window.confirm('Remove this doctor?')) return;
    saveClinic({ ...clinic, doctors: clinic.doctors.filter((d) => d.id !== id) });
  }

  return (
    <div>
      <SectionHeader
        title="Doctors"
        subtitle={`${clinic.doctors?.length || 0} doctors registered`}
        action={<Btn onClick={() => setShow(true)}>+ Add Doctor</Btn>}
      />

      {(clinic.doctors || []).length === 0 ? (
        <Empty icon="👨‍⚕️" title="No doctors yet" desc="Add your first doctor to get started." action={<Btn onClick={() => setShow(true)}>+ Add First Doctor</Btn>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {clinic.doctors.map((doc) => <DoctorCard key={doc.id} doc={doc} onRemove={() => removeDoctor(doc.id)} />)}
        </div>
      )}

      {show && (
        <Modal title="Add New Doctor" onClose={() => { setShow(false); setErr(''); }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Doctor Name" value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="Dr. Ahmed Ali" required />
              <Select label="Specialist *" value={form.specialist} onChange={(e) => f('specialist', e.target.value)}>
                <option value="">-- Select --</option>
                {SPECIALISTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Login Email" type="email" value={form.email} onChange={(e) => f('email', e.target.value)} placeholder="doctor@clinic.com" required />
              <Input label="Password" type="password" value={form.password} onChange={(e) => f('password', e.target.value)} placeholder="••••••" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Phone" value={form.phone} onChange={(e) => f('phone', e.target.value)} placeholder="03xx-xxxxxxx" />
              <Input label="Consultation Fee (Rs.)" type="number" value={form.fee} onChange={(e) => f('fee', e.target.value)} placeholder="500" />
            </div>
            <Input label="Available Days" value={form.days} onChange={(e) => f('days', e.target.value)} placeholder="Mon – Fri" />
            <Input label="Timing" value={form.timing} onChange={(e) => f('timing', e.target.value)} placeholder="9:00 AM – 5:00 PM" />
            {err && <Alert type="error">{err}</Alert>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => { setShow(false); setErr(''); }}>Cancel</Btn>
              <Btn onClick={addDoctor}>Add Doctor</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DoctorCard({ doc, onRemove }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>👨‍⚕️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{doc.name}</div>
          <Badge color="blue">{doc.specialist}</Badge>
        </div>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16, padding: 4, flexShrink: 0 }}>🗑</button>
      </div>
      <div style={{ display: 'grid', gap: 5, fontSize: 13 }}>
        {doc.phone && <div style={{ color: 'var(--text-muted)' }}>📞 {doc.phone}</div>}
        {doc.email && <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>✉️ {doc.email}</div>}
        {doc.fee && <div style={{ color: 'var(--text-muted)' }}>💰 Rs. {doc.fee} per consultation</div>}
        {doc.days && <div style={{ color: 'var(--text-muted)' }}>📅 {doc.days}</div>}
        {doc.timing && <div style={{ color: 'var(--text-muted)' }}>🕐 {doc.timing}</div>}
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-light)' }}>
        Added {doc.addedAt} · Login: {doc.email}
      </div>
    </Card>
  );
}

/* ── Receptionist Management ──────────────────────────────────── */
function ReceptionistManagement({ clinic, saveClinic }) {
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function addRec() {
    if (!form.name || !form.email || !form.password) { setErr('Fill all required fields.'); return; }
    const exists = [...(clinic.doctors || []), ...(clinic.receptionists || [])].find((x) => x.email === form.email);
    if (exists) { setErr('This email is already in use.'); return; }
    const rec = { id: genId(), ...form, addedAt: today() };
    saveClinic({ ...clinic, receptionists: [...(clinic.receptionists || []), rec] });
    setForm({ name: '', email: '', phone: '', password: '' });
    setErr('');
    setShow(false);
  }

  function removeRec(id) {
    if (!window.confirm('Remove this receptionist?')) return;
    saveClinic({ ...clinic, receptionists: clinic.receptionists.filter((r) => r.id !== id) });
  }

  return (
    <div>
      <SectionHeader
        title="Receptionists"
        subtitle={`${clinic.receptionists?.length || 0} receptionists registered`}
        action={<Btn onClick={() => setShow(true)}>+ Add Receptionist</Btn>}
      />

      {(clinic.receptionists || []).length === 0 ? (
        <Empty icon="📋" title="No receptionists yet" desc="Add a receptionist to handle patient registration." action={<Btn onClick={() => setShow(true)}>+ Add Receptionist</Btn>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {clinic.receptionists.map((rec) => (
            <Card key={rec.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📋</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{rec.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receptionist</div>
                </div>
                <button onClick={() => removeRec(rec.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16, padding: 4 }}>🗑</button>
              </div>
              <div style={{ fontSize: 13, display: 'grid', gap: 4 }}>
                <div style={{ color: 'var(--text-muted)' }}>✉️ {rec.email}</div>
                {rec.phone && <div style={{ color: 'var(--text-muted)' }}>📞 {rec.phone}</div>}
              </div>
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-light)' }}>
                Added {rec.addedAt} · Login: {rec.email}
              </div>
            </Card>
          ))}
        </div>
      )}

      {show && (
        <Modal title="Add Receptionist" onClose={() => { setShow(false); setErr(''); }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <Input label="Full Name" value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="e.g. Ayesha Bibi" required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Login Email" type="email" value={form.email} onChange={(e) => f('email', e.target.value)} placeholder="rec@clinic.com" required />
              <Input label="Password" type="password" value={form.password} onChange={(e) => f('password', e.target.value)} placeholder="••••••" required />
            </div>
            <Input label="Phone" value={form.phone} onChange={(e) => f('phone', e.target.value)} placeholder="03xx-xxxxxxx" />
            {err && <Alert type="error">{err}</Alert>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => { setShow(false); setErr(''); }}>Cancel</Btn>
              <Btn onClick={addRec}>Add Receptionist</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── All Patients ─────────────────────────────────────────────── */
export function AllPatients({ clinic }) {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const todayStr = today();

  const filtered = (clinic.patients || []).filter((p) => {
    const matchDate = dateFilter === 'all' || p.date === todayStr;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || String(p.token).includes(search);
    return matchDate && matchSearch;
  }).sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.token - b.token;
  });

  return (
    <div>
      <SectionHeader
        title="All Patients"
        subtitle={`${(clinic.patients || []).length} total patients`}
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or token..." style={{ width: 200 }} />
            <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ width: 130 }}>
              <option value="today">Today</option>
              <option value="all">All Time</option>
            </Select>
          </div>
        }
      />
      <Card noPad>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Token', 'Name', 'Age', 'Phone', 'Doctor', 'Symptoms', 'Paid Rs.', 'Dues Rs.', 'Date', 'Time', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No patients found</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px' }}><TokenBadge token={p.token} size="sm" status={p.status} /></td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{p.age || '-'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{p.phone || '-'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{p.doctorName}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.symptoms}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--success)', fontWeight: 500 }}>{p.paid || 0}</td>
                  <td style={{ padding: '10px 14px', color: p.dues > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: p.dues > 0 ? 600 : 400 }}>{p.dues || 0}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.date}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.time}</td>
                  <td style={{ padding: '10px 14px' }}><Badge color={p.status === 'called' ? 'green' : p.status === 'done' ? 'gray' : 'blue'}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ── Clinic Settings ──────────────────────────────────────────── */
function ClinicSettings({ clinic, saveClinic }) {
  const [form, setForm] = useState({ name: clinic.name, city: clinic.city || '', phone: clinic.phone || '', owner: clinic.owner });
  const [saved, setSaved] = useState(false);
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function save() {
    saveClinic({ ...clinic, ...form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <SectionHeader title="Clinic Settings" />
      <Card>
        <div style={{ display: 'grid', gap: 14 }}>
          <Input label="Clinic Name" value={form.name} onChange={(e) => f('name', e.target.value)} />
          <Input label="Owner Name" value={form.owner} onChange={(e) => f('owner', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={(e) => f('phone', e.target.value)} />
          <Input label="City" value={form.city} onChange={(e) => f('city', e.target.value)} />
          {saved && <Alert type="success">✓ Settings saved successfully!</Alert>}
          <Btn onClick={save}>Save Changes</Btn>
        </div>
      </Card>
    </div>
  );
}