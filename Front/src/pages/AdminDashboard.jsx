import React, { useState, useEffect, useCallback } from 'react';
import {
  DashboardLayout, Card, Stat, Btn, Badge, Input, Select,
  Modal, Alert, SectionHeader, Empty, TokenBadge,
} from '../components/UI';
import { today } from '../utils/helpers';
import { useApp } from '../context/AppContext';

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_SHORT = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri', Saturday:'Sat', Sunday:'Sun' };

function defaultSchedule() {
  return DAYS.map((day) => ({ day, open: false, from: '09:00', to: '17:00' }));
}

function fmt24(t) {
  if (!t) return '';
  const [hStr, m] = t.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

// ── Payment method badge helper ───────────────────────────────────
function PaymentBadge({ method }) {
  if (method === 'upi') {
    return (
      <span style={{ background: 'rgba(124,58,237,0.10)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
        📲 UPI
      </span>
    );
  }
  return (
    <span style={{ background: 'rgba(0,184,148,0.10)', color: '#00a878', border: '1px solid rgba(0,184,148,0.25)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      💵 Cash
    </span>
  );
}

// ── Weekly Schedule Picker ────────────────────────────────────────────────────
function WeeklySchedulePicker({ value, onChange }) {
  const schedule = value && value.length === 7 ? value : defaultSchedule();

  function toggle(idx) {
    onChange(schedule.map((s, i) => i === idx ? { ...s, open: !s.open } : s));
  }
  function setTime(idx, key, val) {
    onChange(schedule.map((s, i) => i === idx ? { ...s, [key]: val } : s));
  }

  return (
    <div style={{ border: '1.5px solid #d0dce8', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '10px 16px', background: 'linear-gradient(90deg, #0a3d62, #1565a8)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>📅</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Weekly Availability</span>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginLeft: 'auto' }}>{schedule.filter(s => s.open).length} days open</span>
      </div>

      {schedule.map((slot, idx) => {
        const isWeekend = slot.day === 'Saturday' || slot.day === 'Sunday';
        return (
          <div key={slot.day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: idx < 6 ? '1px solid #eef1f5' : 'none', background: slot.open ? (isWeekend ? 'rgba(0,184,148,0.04)' : '#fff') : '#fafbfc' }}>
            <button type="button" onClick={() => toggle(idx)} style={{ width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: slot.open ? '#00b894' : '#d0dce8', position: 'relative', flexShrink: 0, padding: 0 }}>
              <span style={{ position: 'absolute', top: 3, left: slot.open ? 18 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', transition: 'left 0.2s', display: 'block' }} />
            </button>
            <span style={{ width: 84, fontWeight: slot.open ? 700 : 500, fontSize: 13, color: slot.open ? (isWeekend ? '#00a878' : '#0a3d62') : '#8fa8bc', flexShrink: 0 }}>{slot.day}</span>
            {slot.open ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                <input type="time" value={slot.from} onChange={(e) => setTime(idx, 'from', e.target.value)} style={{ padding: '4px 8px', borderRadius: 7, border: '1.5px solid #c5d5e8', fontSize: 13, color: '#0a3d62', fontWeight: 600, background: '#f4f8fc', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }} />
                <span style={{ color: '#8fa8bc', fontSize: 12, fontWeight: 500 }}>to</span>
                <input type="time" value={slot.to} onChange={(e) => setTime(idx, 'to', e.target.value)} style={{ padding: '4px 8px', borderRadius: 7, border: '1.5px solid #c5d5e8', fontSize: 13, color: '#0a3d62', fontWeight: 600, background: '#f4f8fc', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }} />
                {slot.from && slot.to && (() => {
                  const [fh, fm] = slot.from.split(':').map(Number);
                  const [th, tm] = slot.to.split(':').map(Number);
                  const mins = (th * 60 + tm) - (fh * 60 + fm);
                  if (mins <= 0) return null;
                  const h = Math.floor(mins / 60), m = mins % 60;
                  return <span style={{ fontSize: 11, color: '#00a878', fontWeight: 600 }}>{h > 0 ? `${h}h` : ''}{m > 0 ? ` ${m}m` : ''}</span>;
                })()}
              </div>
            ) : (
              <span style={{ color: '#b0bec5', fontSize: 12.5, fontStyle: 'italic', fontWeight: 500 }}>Closed</span>
            )}
          </div>
        );
      })}

      <div style={{ padding: '9px 14px', borderTop: '1.5px solid #eef1f5', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: '#f7f9fc' }}>
        <span style={{ fontSize: 11.5, color: '#8fa8bc', fontWeight: 600, marginRight: 2 }}>Quick set:</span>
        {[
          { label: 'Mon–Fri', days: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
          { label: 'Mon–Sat', days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] },
          { label: 'Every day', days: DAYS },
          { label: 'Clear all', days: [] },
        ].map(({ label, days }) => (
          <button key={label} type="button"
            onClick={() => onChange(schedule.map((s) => ({ ...s, open: days.includes(s.day) })))}
            style={{ padding: '3px 10px', borderRadius: 20, border: '1.5px solid #c5d5e8', background: '#fff', color: '#0a3d62', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={(e) => { e.target.style.background = '#0a3d62'; e.target.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#0a3d62'; }}
          >{label}</button>
        ))}
      </div>
    </div>
  );
}

// ── Schedule display in DoctorCard ────────────────────────────────────────────
function ScheduleDisplay({ schedule }) {
  const [expanded, setExpanded] = useState(false);
  if (!schedule || schedule.length === 0) return null;
  const openDays = schedule.filter((s) => s.open);
  if (openDays.length === 0) return <div style={{ color: '#8fa8bc', fontSize: 12.5 }}>📅 No available days</div>;

  return (
    <div>
      <button type="button" onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#1565a8', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span>📅</span>
        <span>{openDays.length} day{openDays.length > 1 ? 's' : ''} available</span>
        <span style={{ fontSize: 10, color: '#8fa8bc' }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{ marginTop: 8, border: '1px solid #e8eff6', borderRadius: 8, overflow: 'hidden' }}>
          {schedule.map((s, i) => (
            <div key={s.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', borderBottom: i < 6 ? '1px solid #f0f4f8' : 'none', background: s.open ? '#fff' : '#fafbfc' }}>
              <span style={{ fontSize: 12, fontWeight: s.open ? 600 : 400, color: s.open ? '#0a3d62' : '#b0bec5', width: 80 }}>{s.day}</span>
              {s.open
                ? <span style={{ fontSize: 11.5, color: '#00a878', fontWeight: 600 }}>{fmt24(s.from)} – {fmt24(s.to)}</span>
                : <span style={{ fontSize: 11, color: '#b0bec5', fontStyle: 'italic' }}>Closed</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Token Limit Inline Editor ────────────────────────────────────
function TokenLimitEditor({ doc, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value,   setValue]   = useState(String(doc.dailyTokenLimit ?? 0));
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState('');

  useEffect(() => { setValue(String(doc.dailyTokenLimit ?? 0)); }, [doc.dailyTokenLimit]);

  async function save(e) {
    e.stopPropagation();
    const limit = parseInt(value, 10);
    if (isNaN(limit) || limit < 0) { setErr('Enter a valid number (0 = unlimited)'); return; }
    setBusy(true); setErr('');
    try {
      await onSave(doc._id, limit);
      setEditing(false);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  function cancel(e) { e.stopPropagation(); setEditing(false); setErr(''); setValue(String(doc.dailyTokenLimit ?? 0)); }

  const limit = doc.dailyTokenLimit ?? 0;

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 6 }}>
      {!editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, color: limit === 0 ? '#8fa8bc' : '#0a3d62', fontWeight: limit === 0 ? 400 : 700 }}>
            🎫 Daily limit:{' '}
            <span style={{ color: limit === 0 ? '#00a878' : '#0a3d62', fontWeight: 700 }}>
              {limit === 0 ? 'Unlimited' : limit}
            </span>
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            style={{ fontSize: 11, color: '#1565a8', background: 'rgba(21,101,168,0.08)', border: '1px solid rgba(21,101,168,0.2)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
          >Edit</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#4a6278', fontWeight: 600, whiteSpace: 'nowrap' }}>🎫 Daily limit:</span>
            <input
              type="number" min="0" value={value}
              onChange={(e) => setValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="0 = unlimited"
              style={{ width: 100, padding: '4px 8px', borderRadius: 7, border: '1.5px solid #1565a8', fontSize: 13, fontWeight: 600, color: '#0a3d62', fontFamily: 'inherit', outline: 'none' }}
            />
            <button onClick={save} disabled={busy}
              style={{ padding: '4px 12px', borderRadius: 7, border: 'none', background: '#00b894', color: '#fff', fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {busy ? '…' : 'Save'}
            </button>
            <button onClick={cancel}
              style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #d0dce8', background: '#fff', color: '#4a6278', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
          {err && <div style={{ fontSize: 11.5, color: '#e74c3c', fontWeight: 600 }}>{err}</div>}
          <div style={{ fontSize: 11, color: '#8fa8bc' }}>Set 0 for unlimited tokens per day</div>
        </div>
      )}
    </div>
  );
}

// ── Plan Gate Overlay ─────────────────────────────────────────────────────────
function PlanGateOverlay({ clinicName, onChoosePlan }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,25,50,0.60)', backdropFilter: 'blur(7px)' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', maxWidth: 420, width: '90%', textAlign: 'center', boxShadow: '0 32px 90px rgba(10,61,98,0.28)', position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:4, background:'linear-gradient(90deg,#0a3d62,#1565a8,#00b894)' }} />
        <div style={{ fontSize:54, marginBottom:14 }}>🔒</div>
        <div style={{ fontFamily:'Georgia,serif',fontSize:24,fontWeight:700,color:'#0a3d62',marginBottom:10 }}>No Active Plan</div>
        <div style={{ color:'#4a6278',fontSize:14,lineHeight:1.75,marginBottom:22 }}>
          <strong>{clinicName}</strong> doesn't have an active subscription.<br />Choose a plan to unlock your full dashboard.
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:26 }}>
          {[
            { name:'Basic', price:'Rs. 999/mo',  icon:'🏥', color:'#1565a8', bg:'rgba(21,101,168,0.07)' },
            { name:'Pro',   price:'Rs. 2,999/mo', icon:'⭐', color:'#d68910', bg:'rgba(243,156,18,0.08)' },
          ].map((p) => (
            <div key={p.name} onClick={onChoosePlan}
              style={{ background:p.bg, border:`1.5px solid ${p.color}28`, borderRadius:12, padding:'13px 10px', cursor:'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform='translateY(0)'}>
              <div style={{ fontSize:22,marginBottom:4 }}>{p.icon}</div>
              <div style={{ fontWeight:700,fontSize:14,color:p.color }}>{p.name}</div>
              <div style={{ fontSize:12,color:'#8fa8bc',marginTop:2 }}>{p.price}</div>
            </div>
          ))}
        </div>
        <button onClick={onChoosePlan} style={{ width:'100%',padding:'14px 20px',borderRadius:11,border:'none',background:'linear-gradient(135deg,#00b894,#00cec9)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 5px 18px rgba(0,184,148,0.32)',marginBottom:10 }}>
          🚀 Choose a Plan to Continue
        </button>
        <div style={{ fontSize:12,color:'#8fa8bc' }}>No hidden fees · Cancel anytime</div>
      </div>
    </div>
  );
}

// ── AdminDashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard({ onChoosePlan }) {
  const { session, logout, refreshClinic, saveClinic: apiSaveClinic,
          getUsers, addUser, deleteUser,
          getPatients, updatePatientStatus,
          updateTokenLimit, updateFollowUp } = useApp();

  const [tab,      setTab]      = useState('overview');
  const [clinic,   setClinic]   = useState(null);
  const [users,    setUsers]    = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const reload = useCallback(async () => {
    try {
      const [c, u, p] = await Promise.all([refreshClinic(), getUsers(), getPatients()]);
      setClinic(c);
      setUsers(u);
      setPatients(p);
    } catch (e) {
      console.error('Reload error:', e);
    } finally {
      setLoading(false);
    }
  }, [refreshClinic, getUsers, getPatients]);

  useEffect(() => { reload(); }, [tab, reload]);

  const todayStr      = new Date().toISOString().split('T')[0];
  const doctors       = users.filter((u) => u.role === 'doctor');
  const receptionists = users.filter((u) => u.role === 'receptionist');
  const todayPatients = patients.filter((p) => p.date === todayStr);
  const paidTotal     = todayPatients.reduce((s, p) => s + (p.paid  || 0), 0);
  const duesTotal     = todayPatients.reduce((s, p) => s + (p.dues  || 0), 0);

  async function handleSaveClinic(updates) {
    const updated = await apiSaveClinic(updates);
    setClinic(updated);
    return updated;
  }

  async function handleAddUser(data) {
    const newUser = await addUser(data);
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  }

  async function handleDeleteUser(id) {
    await deleteUser(id);
    setUsers((prev) => prev.filter((u) => u._id !== id));
  }

  async function handleUpdateStatus(patientId, status) {
    const updated = await updatePatientStatus(patientId, status);
    setPatients((prev) => prev.map((p) => p._id === patientId ? updated : p));
  }

  async function handleUpdateTokenLimit(doctorId, limit) {
    const updated = await updateTokenLimit(doctorId, limit);
    setUsers((prev) => prev.map((u) => u._id === doctorId ? { ...u, dailyTokenLimit: updated.dailyTokenLimit } : u));
    return updated;
  }

  async function handleUpdateFollowUp(patientId, followUpDate, followUpNote) {
    const updated = await updateFollowUp(patientId, followUpDate, followUpNote);
    setPatients((prev) => prev.map((p) => p._id === patientId ? updated : p));
    return updated;
  }

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'DM Sans,sans-serif',color:'#4a6278' }}>
      <div>Loading dashboard…</div>
    </div>
  );

  if (!clinic) return <div style={{ padding:32 }}>Clinic not found.</div>;

  const active = !!clinic.plan;

  const planBadge = active ? (
    <span style={{ display:'inline-flex',alignItems:'center',gap:5, background: clinic.plan==='pro' ? 'rgba(243,156,18,0.12)' : 'rgba(21,101,168,0.10)', color: clinic.plan==='pro' ? '#d68910' : '#1565a8', border:`1px solid ${clinic.plan==='pro' ? 'rgba(243,156,18,0.28)' : 'rgba(21,101,168,0.2)'}`, borderRadius:20,padding:'3px 11px',fontSize:12,fontWeight:700 }}>
      {clinic.plan==='pro' ? '⭐ Pro' : '🏥 Basic'} Plan
    </span>
  ) : (
    <span style={{ display:'inline-flex',alignItems:'center',gap:5, background:'rgba(192,57,43,0.09)',color:'#c0392b', border:'1px solid rgba(192,57,43,0.18)', borderRadius:20,padding:'3px 11px',fontSize:12,fontWeight:700 }}>
      🔒 No Plan
    </span>
  );

  // Count upcoming follow-ups (today or future)
  const followUpPatients = patients.filter((p) => p.followUpDate && p.followUpDate >= todayStr);

  const navItems = [
    { icon:'📊', label:'Overview',      active: tab==='overview',      onClick:()=>setTab('overview') },
    { icon:'👨‍⚕️', label:'Doctors',       active: tab==='doctors',       onClick:()=>setTab('doctors'),       badge: doctors.length || undefined },
    { icon:'📋', label:'Receptionists', active: tab==='receptionists', onClick:()=>setTab('receptionists'), badge: receptionists.length || undefined },
    { icon:'👥', label:'All Patients',  active: tab==='patients',      onClick:()=>setTab('patients') },
    { icon:'📅', label:'Follow-ups',    active: tab==='followups',     onClick:()=>setTab('followups'),     badge: followUpPatients.length || undefined },
    { icon:'⚙️', label:'Settings',      active: tab==='settings',      onClick:()=>setTab('settings') },
  ];

  return (
    <>
      <div style={{ filter: active ? 'none' : 'blur(3px) brightness(0.88)', pointerEvents: active ? 'auto' : 'none', userSelect: active ? 'auto' : 'none', transition: 'filter 0.3s' }}>
        <DashboardLayout
          title="Admin Dashboard"
          subtitle={`Welcome, ${clinic.owner}`}
          navItems={navItems}
          onLogout={logout}
          clinicName={clinic.name}
          userRole="Administrator"
          accent="var(--primary)"
          headerExtra={planBadge}
        >
          {tab === 'overview'      && <Overview clinic={clinic} doctors={doctors} todayPatients={todayPatients} paidTotal={paidTotal} duesTotal={duesTotal} />}
          {tab === 'doctors'       && <DoctorManagement doctors={doctors} patients={patients} onAdd={handleAddUser} onDelete={handleDeleteUser} onUpdateTokenLimit={handleUpdateTokenLimit} />}
          {tab === 'receptionists' && <ReceptionistManagement receptionists={receptionists} onAdd={handleAddUser} onDelete={handleDeleteUser} />}
          {tab === 'patients'      && <AllPatients patients={patients} />}
          {tab === 'followups'     && <AdminFollowUps patients={patients} doctors={doctors} onUpdateFollowUp={handleUpdateFollowUp} />}
          {tab === 'settings'      && <ClinicSettings clinic={clinic} onSave={handleSaveClinic} />}
        </DashboardLayout>
      </div>
      {!active && <PlanGateOverlay clinicName={clinic.name} onChoosePlan={onChoosePlan} />}
    </>
  );
}

/* ── Overview ─────────────────────────────────────────────────── */
function Overview({ clinic, doctors, todayPatients, paidTotal, duesTotal }) {
  return (
    <div>
      <SectionHeader title="Clinic Overview" subtitle={`Today's summary — ${today()}`} />
      {/* ── REMOVED: Total Doctors stat card ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:16, marginBottom:24 }}>
        <Stat label="Today's Tokens"     value={todayPatients.length}       icon="🎫" color="var(--primary)" />
        <Stat label="Today's Revenue Rs." value={paidTotal.toLocaleString()} icon="💰" color="var(--success)" />
        <Stat label="Pending Dues Rs."    value={duesTotal.toLocaleString()} icon="⚠️" color="var(--danger)" />
      </div>

      {doctors.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:17, marginBottom:14 }}>Doctor Queue Summary</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
            {doctors.map((doc) => {
              const docPatients = todayPatients.filter((p) => String(p.doctorId) === String(doc._id));
              const waiting = docPatients.filter((p) => p.status === 'waiting').length;
              const done    = docPatients.filter((p) => p.status === 'done').length;
              const limit   = doc.dailyTokenLimit ?? 0;
              return (
                <Card key={doc._id}>
                  <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
                    <div style={{ width:38,height:38,borderRadius:10,background:'var(--primary-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>👨‍⚕️</div>
                    <div>
                      <div style={{ fontWeight:600,fontSize:14 }}>{doc.name}</div>
                      <div style={{ fontSize:11,color:'var(--text-muted)' }}>{doc.specialist}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                    <Badge color="blue">🎫 {docPatients.length}{limit > 0 ? `/${limit}` : ''} Total</Badge>
                    <Badge color="yellow">⏳ {waiting} Wait</Badge>
                    <Badge color="green">✓ {done} Done</Badge>
                    {limit > 0 && docPatients.length >= limit && <Badge color="red">🚫 Limit reached</Badge>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Card noPad>
        <div style={{ padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <h3 style={{ fontSize:16 }}>📋 Today's Patient Queue</h3>
          <Badge color="blue">{todayPatients.length} patients</Badge>
        </div>
        {todayPatients.length === 0 ? (
          <div style={{ textAlign:'center',padding:'2.5rem',color:'var(--text-muted)' }}>
            <div style={{ fontSize:40,marginBottom:8 }}>🪑</div>
            <div>No patients registered today yet.</div>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--surface2)' }}>
                  {['Token','Patient','Doctor','Symptoms','Paid Rs.','Dues Rs.','Time','Payment','Status'].map((h) => (
                    <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontWeight:600,color:'var(--text-muted)',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...todayPatients].sort((a,b)=>a.token-b.token).map((p) => (
                  <tr key={p._id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'10px 14px' }}><TokenBadge token={p.token} size="sm" status={p.status} /></td>
                    <td style={{ padding:'10px 14px',fontWeight:500 }}>{p.name}</td>
                    <td style={{ padding:'10px 14px',color:'var(--text-muted)' }}>{p.doctorName}</td>
                    <td style={{ padding:'10px 14px',color:'var(--text-muted)',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.symptoms}</td>
                    <td style={{ padding:'10px 14px',color:'var(--success)',fontWeight:500 }}>{p.paid||0}</td>
                    <td style={{ padding:'10px 14px',color:p.dues>0?'var(--danger)':'var(--text-muted)',fontWeight:p.dues>0?600:400 }}>{p.dues||0}</td>
                    <td style={{ padding:'10px 14px',color:'var(--text-muted)',whiteSpace:'nowrap' }}>{p.time}</td>
                    <td style={{ padding:'10px 14px' }}><PaymentBadge method={p.paymentMethod} /></td>
                    <td style={{ padding:'10px 14px' }}>
                      <Badge color={p.status==='called'?'green':p.status==='done'?'gray':'blue'}>
                        {p.status==='waiting'?'Waiting':p.status==='called'?'Called':'Done'}
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

/* ── Admin Follow-ups ─────────────────────────────────────────────────────── */
function AdminFollowUps({ patients, doctors, onUpdateFollowUp }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [doctorFilter, setDoctorFilter] = useState('all');
  const [dateFilter,   setDateFilter]   = useState('upcoming');
  const [search,       setSearch]       = useState('');
  const [editingId,    setEditingId]    = useState(null);
  const [editDate,     setEditDate]     = useState('');
  const [editNote,     setEditNote]     = useState('');
  const [busy,         setBusy]         = useState(false);

  // Only patients that have a follow-up date set
  const followUpPatients = patients.filter((p) => p.followUpDate);

  const filtered = followUpPatients.filter((p) => {
    const matchDoctor = doctorFilter === 'all' || String(p.doctorId) === doctorFilter;
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search));
    const matchDate =
      dateFilter === 'all'      ? true :
      dateFilter === 'today'    ? p.followUpDate === todayStr :
      dateFilter === 'upcoming' ? p.followUpDate >= todayStr :
      dateFilter === 'overdue'  ? p.followUpDate < todayStr  : true;
    return matchDoctor && matchSearch && matchDate;
  }).sort((a, b) => (a.followUpDate || '').localeCompare(b.followUpDate || ''));

  function startEdit(p) {
    setEditingId(p._id);
    setEditDate(p.followUpDate || '');
    setEditNote(p.followUpNote || '');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDate('');
    setEditNote('');
  }

  async function saveEdit(patientId) {
    setBusy(true);
    try {
      await onUpdateFollowUp(patientId, editDate, editNote);
      setEditingId(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function clearFollowUp(patientId) {
    if (!window.confirm('Clear this follow-up?')) return;
    try {
      await onUpdateFollowUp(patientId, null, '');
    } catch (e) {
      alert(e.message);
    }
  }

  function getFollowUpStatus(followUpDate) {
    if (!followUpDate) return null;
    if (followUpDate < todayStr)  return { label: 'Overdue',  color: 'red',    bg: 'rgba(231,76,60,0.08)',   text: '#e74c3c' };
    if (followUpDate === todayStr) return { label: 'Today',    color: 'green',  bg: 'rgba(0,184,148,0.10)',   text: '#00a878' };
    return                               { label: 'Upcoming', color: 'blue',   bg: 'rgba(21,101,168,0.08)', text: '#1565a8' };
  }

  // Summary counts
  const todayCount    = followUpPatients.filter((p) => p.followUpDate === todayStr).length;
  const upcomingCount = followUpPatients.filter((p) => p.followUpDate > todayStr).length;
  const overdueCount  = followUpPatients.filter((p) => p.followUpDate < todayStr).length;

  return (
    <div>
      <SectionHeader
        title="Follow-ups"
        subtitle={`${followUpPatients.length} patients with scheduled follow-ups`}
      />

      {/* ── Summary Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Today',    value: todayCount,    icon: '📅', color: '#00a878', bg: 'rgba(0,184,148,0.08)',   border: 'rgba(0,184,148,0.20)',   filter: 'today'    },
          { label: 'Upcoming', value: upcomingCount, icon: '🔮', color: '#1565a8', bg: 'rgba(21,101,168,0.07)', border: 'rgba(21,101,168,0.18)',  filter: 'upcoming' },
          { label: 'Overdue',  value: overdueCount,  icon: '⚠️', color: '#e74c3c', bg: 'rgba(231,76,60,0.07)',  border: 'rgba(231,76,60,0.18)',   filter: 'overdue'  },
          { label: 'All',      value: followUpPatients.length, icon: '📋', color: '#4a6278', bg: 'rgba(74,98,120,0.06)', border: 'rgba(74,98,120,0.15)', filter: 'all' },
        ].map((s) => (
          <div
            key={s.label}
            onClick={() => setDateFilter(s.filter)}
            style={{ background: dateFilter === s.filter ? s.bg : '#fff', border: `1.5px solid ${dateFilter === s.filter ? s.border : 'var(--border, #e4eaf1)'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}
            onMouseEnter={(e) => { if (dateFilter !== s.filter) e.currentTarget.style.borderColor = s.border; }}
            onMouseLeave={(e) => { if (dateFilter !== s.filter) e.currentTarget.style.borderColor = 'var(--border, #e4eaf1)'; }}
          >
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: dateFilter === s.filter ? s.color : 'var(--text, #1a2a3a)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, fontWeight: dateFilter === s.filter ? 700 : 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters Row ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patient name or phone…"
          style={{ flex: '1 1 200px', minWidth: 0 }}
        />
        <Select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          style={{ flex: '0 0 180px' }}
        >
          <option value="all">All Doctors</option>
          {doctors.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </Select>
      </div>

      {/* ── Table / Empty ── */}
      {filtered.length === 0 ? (
        <Empty
          icon="📅"
          title="No follow-ups found"
          desc={dateFilter === 'overdue' ? 'No overdue follow-ups.' : dateFilter === 'today' ? 'No follow-ups scheduled for today.' : 'No follow-ups match your filters.'}
        />
      ) : (
        <Card noPad>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['Patient', 'Phone', 'Doctor', 'Last Visit', 'Follow-up Date', 'Note', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const st = getFollowUpStatus(p.followUpDate);
                  const isEditing = editingId === p._id;
                  return (
                    <tr key={p._id} style={{ borderBottom: '1px solid var(--border)', background: isEditing ? 'rgba(21,101,168,0.03)' : (i % 2 === 0 ? '#fff' : 'var(--surface2, #fafbfc)') }}>
                      {/* Patient */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>{p.name}</div>
                        {p.age && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Age {p.age}{p.gender ? ` · ${p.gender}` : ''}</div>}
                      </td>
                      {/* Phone */}
                      <td style={{ padding: '11px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.phone || '—'}</td>
                      {/* Doctor */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#1565a8', fontSize: 13 }}>{p.doctorName}</div>
                        {p.specialist && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.specialist}</div>}
                      </td>
                      {/* Last Visit */}
                      <td style={{ padding: '11px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 12.5 }}>{p.date || '—'}</td>
                      {/* Follow-up Date */}
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: 7, border: '1.5px solid #1565a8', fontSize: 13, color: '#0a3d62', fontWeight: 600, fontFamily: 'inherit', outline: 'none' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 700, color: st?.text || 'var(--text)', fontSize: 13 }}>{p.followUpDate || '—'}</span>
                        )}
                      </td>
                      {/* Note */}
                      <td style={{ padding: '11px 14px', maxWidth: 160 }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Note (optional)"
                            style={{ width: '100%', padding: '4px 8px', borderRadius: 7, border: '1.5px solid #1565a8', fontSize: 13, color: '#0a3d62', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <span style={{ color: p.followUpNote ? 'var(--text)' : 'var(--text-muted)', fontStyle: p.followUpNote ? 'normal' : 'italic', fontSize: 12.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.followUpNote || 'No note'}
                          </span>
                        )}
                      </td>
                      {/* Status */}
                      <td style={{ padding: '11px 14px' }}>
                        {st && (
                          <span style={{ background: st.bg, color: st.text, border: `1px solid ${st.text}30`, borderRadius: 20, padding: '3px 10px', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {st.label === 'Overdue' ? '⚠️' : st.label === 'Today' ? '📅' : '🔮'} {st.label}
                          </span>
                        )}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => saveEdit(p._id)}
                              disabled={busy}
                              style={{ padding: '4px 12px', borderRadius: 7, border: 'none', background: '#00b894', color: '#fff', fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                              {busy ? '…' : '✓ Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #d0dce8', background: '#fff', color: '#4a6278', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => startEdit(p)}
                              style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(21,101,168,0.25)', background: 'rgba(21,101,168,0.06)', color: '#1565a8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => clearFollowUp(p._id)}
                              style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(231,76,60,0.25)', background: 'rgba(231,76,60,0.06)', color: '#e74c3c', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                              🗑
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ── Doctor Detail Modal ──────────────────────────────────────────────────── */
function DoctorDetailModal({ doc, patients, onClose, onUpdateTokenLimit }) {
  const todayStr    = new Date().toISOString().split('T')[0];
  const allDocPat   = patients.filter((p) => String(p.doctorId) === String(doc._id));
  const todayDocPat = allDocPat.filter((p) => p.date === todayStr).sort((a, b) => a.token - b.token);

  const waiting  = todayDocPat.filter((p) => p.status === 'waiting').length;
  const called   = todayDocPat.filter((p) => p.status === 'called').length;
  const done     = todayDocPat.filter((p) => p.status === 'done').length;
  const revenue  = todayDocPat.reduce((s, p) => s + (p.paid || 0), 0);
  const dues     = todayDocPat.reduce((s, p) => s + (p.dues || 0), 0);
  const totalRev = allDocPat.reduce((s, p) => s + (p.paid || 0), 0);
  const totalDue = allDocPat.reduce((s, p) => s + (p.dues || 0), 0);
  const limit    = doc.dailyTokenLimit ?? 0;

  return (
    <Modal title="" onClose={onClose}>
      <div style={{ background: 'linear-gradient(135deg, #0a3d62 0%, #1565a8 100%)', borderRadius: 14, padding: '20px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>👨‍⚕️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 3 }}>{doc.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{doc.specialist}</div>
          {doc.phone && <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>📞 {doc.phone}</div>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 2 }}>Consultation Fee</div>
          <div style={{ color: '#f9ca24', fontWeight: 800, fontSize: 20 }}>Rs. {doc.fee || 0}</div>
        </div>
      </div>

      <div style={{ background: limit > 0 ? 'rgba(21,101,168,0.06)' : 'rgba(0,184,148,0.06)', border: `1.5px solid ${limit > 0 ? 'rgba(21,101,168,0.18)' : 'rgba(0,184,148,0.18)'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>🎫 Daily Token Limit</div>
        <TokenLimitEditor doc={doc} onSave={onUpdateTokenLimit} />
        {limit > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#4a6278' }}>
            Today: <strong style={{ color: todayDocPat.length >= limit ? '#e74c3c' : '#00a878' }}>{todayDocPat.length}/{limit}</strong> tokens used
            {todayDocPat.length >= limit && <span style={{ color: '#e74c3c', fontWeight: 700, marginLeft: 8 }}>🚫 Limit reached</span>}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>📆 Today's Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
          {[
            { label: 'Waiting', value: waiting, icon: '⏳', color: '#1565a8', bg: 'rgba(21,101,168,0.08)' },
            { label: 'In Room', value: called,  icon: '📢', color: '#d68910', bg: 'rgba(243,156,18,0.10)' },
            { label: 'Done',    value: done,    icon: '✅', color: '#00a878', bg: 'rgba(0,184,148,0.08)'  },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontWeight: 800, fontSize: 22, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: "Today's Revenue", value: `Rs. ${revenue.toLocaleString()}`, icon: '💰', color: '#00a878', bg: 'rgba(0,184,148,0.07)' },
            { label: "Today's Dues",    value: `Rs. ${dues.toLocaleString()}`,    icon: '⚠️', color: '#e74c3c', bg: 'rgba(231,76,60,0.07)'  },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>📊 All-time: {allDocPat.length} patients</span>
        <span style={{ fontSize: 12.5, color: '#00a878', fontWeight: 700 }}>💰 Rs. {totalRev.toLocaleString()} collected</span>
        <span style={{ fontSize: 12.5, color: '#e74c3c', fontWeight: 700 }}>⚠️ Rs. {totalDue.toLocaleString()} dues</span>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>🎫 Today's Tokens ({todayDocPat.length})</div>
      {todayDocPat.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🪑</div>
          <div style={{ fontSize: 14 }}>No patients assigned today</div>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
          {todayDocPat.map((p, i) => (
            <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: i < todayDocPat.length - 1 ? '1px solid var(--border)' : 'none', background: p.status === 'called' ? '#fefce8' : p.status === 'done' ? 'var(--surface2)' : '#fff' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: p.status === 'done' ? '#e8f5e9' : p.status === 'called' ? '#fff8e1' : 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: p.status === 'done' ? '#2e7d32' : p.status === 'called' ? '#f57f17' : 'var(--primary)' }}>
                {p.token}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: p.status === 'done' ? 'var(--text-muted)' : 'var(--text)', textDecoration: p.status === 'done' ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.symptoms} · 🕐 {p.time}</div>
                {(p.age || p.phone) && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.age ? `Age: ${p.age}` : ''}{p.age && p.phone ? ' · ' : ''}{p.phone ? `📞 ${p.phone}` : ''}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: '#00a878', fontWeight: 700 }}>+Rs.{p.paid || 0}</div>
                {p.dues > 0 && <div style={{ fontSize: 11, color: '#e74c3c', fontWeight: 600 }}>⚠️ Rs.{p.dues}</div>}
                <div style={{ marginTop: 4 }}><PaymentBadge method={p.paymentMethod} /></div>
              </div>
              <Badge color={p.status === 'called' ? 'yellow' : p.status === 'done' ? 'gray' : 'blue'}>
                {p.status === 'waiting' ? '⏳' : p.status === 'called' ? '📢' : '✓'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ── Doctor Management ────────────────────────────────────────── */
const SPECIALISTS = [
  'General Physician','Cardiologist','Dermatologist','ENT Specialist',
  'Gynecologist','Neurologist','Orthopedic','Pediatrician','Psychiatrist',
  'Urologist','Dentist','Eye Specialist','Diabetologist','Chest Specialist',
];

function DoctorManagement({ doctors, patients, onAdd, onDelete, onUpdateTokenLimit }) {
  const [show,      setShow]      = useState(false);
  const [detailDoc, setDetailDoc] = useState(null);
  const [err,       setErr]       = useState('');
  const [busy,      setBusy]      = useState(false);
  const [form,      setForm]      = useState({
    name:'', specialist:'', phone:'', email:'', password:'', fee:'',
    schedule: defaultSchedule(),
  });
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function addDoctor() {
    if (!form.name || !form.email || !form.password || !form.specialist) {
      setErr('Fill all required fields.'); return;
    }
    setBusy(true); setErr('');
    try {
      await onAdd({ role: 'doctor', ...form, fee: parseFloat(form.fee) || 0 });
      setForm({ name:'', specialist:'', phone:'', email:'', password:'', fee:'', schedule: defaultSchedule() });
      setShow(false);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function removeDoctor(id) {
    if (!window.confirm('Remove this doctor?')) return;
    try { await onDelete(id); }
    catch(e) { alert(e.message); }
  }

  const syncedDetailDoc = detailDoc
    ? doctors.find((d) => d._id === detailDoc._id) || detailDoc
    : null;

  return (
    <div>
      <SectionHeader
        title="Doctors"
        subtitle={`${doctors.length} doctors registered`}
        action={<Btn onClick={() => setShow(true)}>+ Add Doctor</Btn>}
      />

      {doctors.length === 0 ? (
        <Empty icon="👨‍⚕️" title="No doctors yet" desc="Add your first doctor to get started."
          action={<Btn onClick={() => setShow(true)}>+ Add First Doctor</Btn>} />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:16 }}>
          {doctors.map((doc) => (
            <DoctorCard
              key={doc._id}
              doc={doc}
              onRemove={(e) => { e.stopPropagation(); removeDoctor(doc._id); }}
              onClick={() => setDetailDoc(doc)}
              onUpdateTokenLimit={onUpdateTokenLimit}
            />
          ))}
        </div>
      )}

      {syncedDetailDoc && (
        <DoctorDetailModal
          doc={syncedDetailDoc}
          patients={patients}
          onClose={() => setDetailDoc(null)}
          onUpdateTokenLimit={onUpdateTokenLimit}
        />
      )}

      {show && (
        <Modal title="Add New Doctor" onClose={() => { setShow(false); setErr(''); }}>
          <div style={{ display:'grid', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Input label="Doctor Name *" value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="Dr. Ahmed Ali" />
              <Select label="Specialist *" value={form.specialist} onChange={(e) => f('specialist', e.target.value)}>
                <option value="">-- Select --</option>
                {SPECIALISTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Input label="Login Email *" type="email" value={form.email} onChange={(e) => f('email', e.target.value)} placeholder="doctor@clinic.com" />
              <Input label="Password *" type="password" value={form.password} onChange={(e) => f('password', e.target.value)} placeholder="••••••" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Input label="Phone" value={form.phone} onChange={(e) => f('phone', e.target.value)} placeholder="03xx-xxxxxxx" />
              <Input label="Consultation Fee (Rs.)" type="number" value={form.fee} onChange={(e) => f('fee', e.target.value)} placeholder="500" />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:7 }}>Weekly Availability</div>
              <WeeklySchedulePicker value={form.schedule} onChange={(s) => f('schedule', s)} />
            </div>
            {err && <Alert type="error">{err}</Alert>}
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <Btn variant="ghost" onClick={() => { setShow(false); setErr(''); }}>Cancel</Btn>
              <Btn onClick={addDoctor} disabled={busy}>{busy ? 'Adding…' : 'Add Doctor'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── DoctorCard ─────────────────────────────────────────────────── */
function DoctorCard({ doc, onRemove, onClick, onUpdateTokenLimit }) {
  const [hovered, setHovered] = useState(false);
  const limit = doc.dailyTokenLimit ?? 0;

  return (
    <div
      role="button" tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: '#fff', borderRadius: 14, border: hovered ? '1.5px solid #1565a8' : '1.5px solid var(--border, #e4eaf1)', padding: '16px 16px 14px', cursor: 'pointer', position: 'relative', transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s', transform: hovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow: hovered ? '0 8px 28px rgba(10,61,98,0.14)' : '0 1px 4px rgba(0,0,0,0.06)', userSelect: 'none' }}
    >
      {hovered && (
        <div style={{ position: 'absolute', top: -1, left: 0, right: 0, background: 'linear-gradient(90deg,#0a3d62,#1565a8)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 0', borderRadius: '12px 12px 0 0', textAlign: 'center', letterSpacing: 0.3, pointerEvents: 'none', zIndex: 1 }}>
          👁 Click to view full details
        </div>
      )}

      <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12, marginTop: hovered ? 18 : 0, transition:'margin-top 0.15s' }}>
        <div style={{ width:48, height:48, borderRadius:12, background:'var(--primary-light, rgba(21,101,168,0.10))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>👨‍⚕️</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:4, color: hovered ? '#1565a8' : 'var(--text, #1a2a3a)', textDecoration: hovered ? 'underline' : 'none', transition: 'color 0.15s' }}>{doc.name}</div>
          <Badge color="blue">{doc.specialist}</Badge>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onRemove(e); }}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--danger,#e74c3c)', fontSize:16, padding:4, flexShrink:0, lineHeight:1 }}
          title="Remove doctor">🗑</button>
      </div>

      <div style={{ display:'grid', gap:6, fontSize:13 }}>
        {doc.phone && <div style={{ color:'var(--text-muted,#6b8299)' }}>📞 {doc.phone}</div>}
        {doc.email && <div style={{ color:'var(--text-muted,#6b8299)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>✉️ {doc.email}</div>}
        {doc.fee   && <div style={{ color:'var(--text-muted,#6b8299)' }}>💰 Rs. {doc.fee} per consultation</div>}
        <div style={{ background: limit > 0 ? 'rgba(21,101,168,0.06)' : 'rgba(0,184,148,0.05)', border: `1px solid ${limit > 0 ? 'rgba(21,101,168,0.15)' : 'rgba(0,184,148,0.15)'}`, borderRadius: 8, padding: '7px 10px', marginTop: 2 }}>
          <TokenLimitEditor doc={doc} onSave={onUpdateTokenLimit} />
        </div>
        <ScheduleDisplay schedule={doc.schedule} />
      </div>

      <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border,#e4eaf1)', fontSize:12, color:'var(--text-light,#9ab0c4)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span>Added {doc.addedAt}</span>
        <span style={{ color: hovered ? '#1565a8' : 'var(--text-light,#9ab0c4)', fontWeight: hovered ? 600 : 400, fontSize:11, transition:'color 0.15s' }}>
          {hovered ? 'View details →' : `Login: ${doc.email}`}
        </span>
      </div>
    </div>
  );
}

/* ── Receptionist Management ──────────────────────────────────── */
function ReceptionistManagement({ receptionists, onAdd, onDelete }) {
  const [show, setShow] = useState(false);
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'' });
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function addRec() {
    if (!form.name || !form.email || !form.password) { setErr('Fill all required fields.'); return; }
    setBusy(true); setErr('');
    try {
      await onAdd({ role: 'receptionist', ...form });
      setForm({ name:'', email:'', phone:'', password:'' });
      setShow(false);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function removeRec(id) {
    if (!window.confirm('Remove this receptionist?')) return;
    try { await onDelete(id); }
    catch(e) { alert(e.message); }
  }

  return (
    <div>
      <SectionHeader title="Receptionists" subtitle={`${receptionists.length} receptionists registered`} action={<Btn onClick={() => setShow(true)}>+ Add Receptionist</Btn>} />
      {receptionists.length === 0 ? (
        <Empty icon="📋" title="No receptionists yet" desc="Add a receptionist to handle patient registration."
          action={<Btn onClick={() => setShow(true)}>+ Add Receptionist</Btn>} />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
          {receptionists.map((rec) => (
            <Card key={rec._id}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{ width:44,height:44,borderRadius:22,background:'var(--accent-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>📋</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{rec.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Receptionist</div>
                </div>
                <button onClick={() => removeRec(rec._id)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--danger)',fontSize:16,padding:4 }}>🗑</button>
              </div>
              <div style={{ fontSize:13, display:'grid', gap:4 }}>
                <div style={{ color:'var(--text-muted)' }}>✉️ {rec.email}</div>
                {rec.phone && <div style={{ color:'var(--text-muted)' }}>📞 {rec.phone}</div>}
              </div>
              <div style={{ marginTop:10, paddingTop:8, borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text-light)' }}>Added {rec.addedAt}</div>
            </Card>
          ))}
        </div>
      )}

      {show && (
        <Modal title="Add Receptionist" onClose={() => { setShow(false); setErr(''); }}>
          <div style={{ display:'grid', gap:14 }}>
            <Input label="Full Name *" value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="e.g. Ayesha Bibi" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Input label="Login Email *" type="email" value={form.email} onChange={(e) => f('email', e.target.value)} placeholder="rec@clinic.com" />
              <Input label="Password *" type="password" value={form.password} onChange={(e) => f('password', e.target.value)} placeholder="••••••" />
            </div>
            <Input label="Phone" value={form.phone} onChange={(e) => f('phone', e.target.value)} placeholder="03xx-xxxxxxx" />
            {err && <Alert type="error">{err}</Alert>}
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <Btn variant="ghost" onClick={() => { setShow(false); setErr(''); }}>Cancel</Btn>
              <Btn onClick={addRec} disabled={busy}>{busy ? 'Adding…' : 'Add Receptionist'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── All Patients ─────────────────────────────────────────────── */
export function AllPatients({ patients }) {
  const [search,     setSearch]     = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = patients.filter((p) => {
    const matchDate   = dateFilter === 'all' || p.date === todayStr;
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
        subtitle={`${patients.length} total patients`}
        action={
          <div style={{ display:'flex', gap:10 }}>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or token..." style={{ width:200 }} />
            <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ width:130 }}>
              <option value="today">Today</option>
              <option value="all">All Time</option>
            </Select>
          </div>
        }
      />
      <Card noPad>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--surface2)' }}>
                {['Token','Name','Age','Phone','Doctor','Symptoms','Paid Rs.','Dues Rs.','Payment','Date','Time','Status'].map((h) => (
                  <th key={h} style={{ padding:'12px 14px',textAlign:'left',fontWeight:600,color:'var(--text-muted)',whiteSpace:'nowrap',borderBottom:'1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12} style={{ padding:'3rem',textAlign:'center',color:'var(--text-muted)' }}>No patients found</td></tr>
              ) : filtered.map((p) => (
                <tr key={p._id} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'10px 14px' }}><TokenBadge token={p.token} size="sm" status={p.status} /></td>
                  <td style={{ padding:'10px 14px',fontWeight:500 }}>{p.name}</td>
                  <td style={{ padding:'10px 14px',color:'var(--text-muted)' }}>{p.age||'-'}</td>
                  <td style={{ padding:'10px 14px',color:'var(--text-muted)' }}>{p.phone||'-'}</td>
                  <td style={{ padding:'10px 14px',color:'var(--text-muted)' }}>{p.doctorName}</td>
                  <td style={{ padding:'10px 14px',color:'var(--text-muted)',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.symptoms}</td>
                  <td style={{ padding:'10px 14px',color:'var(--success)',fontWeight:500 }}>{p.paid||0}</td>
                  <td style={{ padding:'10px 14px',color:p.dues>0?'var(--danger)':'var(--text-muted)',fontWeight:p.dues>0?600:400 }}>{p.dues||0}</td>
                  <td style={{ padding:'10px 14px' }}><PaymentBadge method={p.paymentMethod} /></td>
                  <td style={{ padding:'10px 14px',color:'var(--text-muted)',whiteSpace:'nowrap' }}>{p.date}</td>
                  <td style={{ padding:'10px 14px',color:'var(--text-muted)',whiteSpace:'nowrap' }}>{p.time}</td>
                  <td style={{ padding:'10px 14px' }}><Badge color={p.status==='called'?'green':p.status==='done'?'gray':'blue'}>{p.status}</Badge></td>
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
function ClinicSettings({ clinic, onSave }) {
  const [form,  setForm]  = useState({ name:clinic.name, city:clinic.city||'', phone:clinic.phone||'', owner:clinic.owner });
  const [saved, setSaved] = useState(false);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState('');
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true); setErr('');
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth:520 }}>
      <SectionHeader title="Clinic Settings" />
      <Card>
        <div style={{ display:'grid', gap:14 }}>
          <Input label="Clinic Name" value={form.name}  onChange={(e) => f('name',  e.target.value)} />
          <Input label="Owner Name"  value={form.owner} onChange={(e) => f('owner', e.target.value)} />
          <Input label="Phone"       value={form.phone} onChange={(e) => f('phone', e.target.value)} />
          <Input label="City"        value={form.city}  onChange={(e) => f('city',  e.target.value)} />
          {saved && <Alert type="success">✓ Settings saved successfully!</Alert>}
          {err   && <Alert type="error">{err}</Alert>}
          <Btn onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</Btn>
        </div>
      </Card>

      <div style={{ marginTop:24 }}>
        <SectionHeader title="Subscription Plan" />
        <Card>
          {clinic.plan ? (
            <div style={{ display:'grid', gap:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:700, fontSize:15 }}>{clinic.plan==='pro' ? '⭐ Pro Plan' : '🏥 Basic Plan'}</span>
                <span style={{ background:'rgba(0,184,148,0.1)',color:'#00a878',borderRadius:20,padding:'2px 10px',fontSize:12,fontWeight:700 }}>● Active</span>
              </div>
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>Activated: {clinic.planActivatedAt}</div>
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>Renews: {clinic.planExpiresAt}</div>
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>Price: Rs. {clinic.plan==='pro' ? '2,999' : '999'} / month</div>
            </div>
          ) : (
            <div style={{ color:'var(--text-muted)', fontSize:14, lineHeight:1.6 }}>No active plan. Please choose a plan to access all features.</div>
          )}
        </Card>
      </div>
    </div>
  );
}