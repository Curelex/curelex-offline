import React, { useState, useEffect } from 'react';
import {
  DashboardLayout, Card, Stat, Btn, Badge,
  SectionHeader, Empty, TokenBadge,
} from '../components/UI';
import { getClinic, updateClinic, today } from '../utils/helpers';
import { useApp } from '../context/AppContext';

/* ── Greeting helper ─────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DoctorDashboard() {
  const { session, logout } = useApp();
  const [tab, setTab] = useState('queue');
  const [clinic, setClinic] = useState(() => getClinic(session.clinicId));

  function reload() {
    const fresh = getClinic(session.clinicId);
    if (fresh) setClinic(fresh);
  }

  // Auto-refresh every 3 seconds
  useEffect(() => {
    reload();
    const id = setInterval(reload, 3000);
    return () => clearInterval(id);
  }, []);

  if (!clinic) return <div style={{ padding: 32 }}>Clinic not found.</div>;

  const todayStr = today();
  const myId = session.user?.id;

  const myPatients = (clinic.patients || [])
    .filter((p) => p.doctorId === myId && p.date === todayStr)
    .sort((a, b) => a.token - b.token);

  const waiting = myPatients.filter((p) => p.status === 'waiting');
  const called  = myPatients.filter((p) => p.status === 'called');
  const done    = myPatients.filter((p) => p.status === 'done');

  const currentPatient = called[0] || waiting[0] || null;

  // Dynamic greeting as subtitle
  const greeting = `${getGreeting()}, Dr. ${session.user?.name || ''} · ${session.user?.specialist || ''}`;

  const navItems = [
    {
      icon: '🩺',
      label: 'My Queue',
      active: tab === 'queue',
      onClick: () => setTab('queue'),
      badge: waiting.length || undefined,
    },
    { icon: '📊', label: 'My Stats', active: tab === 'stats', onClick: () => setTab('stats') },
  ];

  function updateStatus(pid, status) {
    const fresh = getClinic(session.clinicId);
    fresh.patients = fresh.patients.map((p) => (p.id === pid ? { ...p, status } : p));
    updateClinic(fresh);
    reload();
  }

  return (
    <>
      {/* Mobile-responsive global styles */}
      <style>{`
        @media (max-width: 640px) {
          .doctor-queue-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .doctor-queue-header .done-badge-row {
            align-self: flex-start;
          }
          .doctor-stat-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .doctor-current-inner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 14px !important;
          }
          .doctor-current-action {
            width: 100% !important;
          }
          .doctor-current-action button {
            width: 100% !important;
          }
          .doctor-token-row {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }
          .doctor-token-row .token-actions {
            width: 100% !important;
            justify-content: flex-end !important;
          }
          .stats-table-wrap {
            font-size: 12px !important;
          }
          .stats-table-wrap th,
          .stats-table-wrap td {
            padding: 8px 10px !important;
          }
          .stats-stat-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 400px) {
          .doctor-stat-grid {
            grid-template-columns: 1fr !important;
          }
          .stats-stat-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <DashboardLayout
        title={greeting}
        subtitle=""
        navItems={navItems}
        onLogout={logout}
        clinicName={clinic.name}
        userRole="Doctor"
        accent="#7c3aed"
      >
        {tab === 'queue' && (
          <QueueTab
            myPatients={myPatients}
            waiting={waiting}
            called={called}
            done={done}
            currentPatient={currentPatient}
            updateStatus={updateStatus}
          />
        )}
        {tab === 'stats' && (
          <StatsTab myPatients={myPatients} waiting={waiting} called={called} done={done} />
        )}
      </DashboardLayout>
    </>
  );
}

/* ── Queue Tab ────────────────────────────────────────────────── */
function QueueTab({ myPatients, waiting, called, done, currentPatient, updateStatus }) {
  return (
    <div>
      {/* Header row — only show "Done" badge, remove Waiting & Called */}
      <div
        className="doctor-queue-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>My Patient Queue</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Today · Auto-refreshes every 3 seconds</p>
        </div>
        {/* Only the Done badge remains */}
        <div className="done-badge-row">
          <Badge color="green">✓ {done.length} Done</Badge>
        </div>
      </div>

      {/* Quick stats — only Total Today + Completed */}
      <div
        className="doctor-stat-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <Stat label="Total Today" value={myPatients.length} icon="🎫" color="#7c3aed" />
        <Stat label="Completed" value={done.length} icon="✅" color="var(--success)" />
      </div>

      {/* Current patient spotlight */}
      {currentPatient && (
        <CurrentPatientCard patient={currentPatient} onUpdateStatus={updateStatus} />
      )}

      {/* Full token list */}
      {myPatients.length === 0 ? (
        <Empty
          icon="🩺"
          title="No patients in queue yet"
          desc="Patients will appear here as soon as the receptionist registers them."
        />
      ) : (
        <Card noPad>
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface2)',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <h3 style={{ fontSize: 15 }}>All My Tokens Today</h3>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{myPatients.length} patients total</span>
          </div>
          <div>
            {myPatients.map((p, i) => (
              <TokenRow
                key={p.id}
                patient={p}
                isLast={i === myPatients.length - 1}
                isCurrent={currentPatient?.id === p.id}
                onUpdateStatus={updateStatus}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ── Current Patient Spotlight Card ──────────────────────────── */
function CurrentPatientCard({ patient: p, onUpdateStatus }) {
  return (
    <div
      style={{
        marginBottom: 24,
        borderRadius: 'var(--radius)',
        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
        padding: '1.5rem',
        boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
      }}
    >
      <div
        style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 12,
        }}
      >
        {p.status === 'called' ? '📢 Currently Attending' : '⏭ Next Patient'}
      </div>

      <div className="doctor-current-inner" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {/* Token number */}
        <div
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: 16,
            padding: '12px 24px',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 1 }}>TOKEN NO.</div>
          <div
            style={{
              color: '#fff',
              fontSize: 52,
              fontWeight: 800,
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1,
            }}
          >
            {p.token}
          </div>
        </div>

        {/* Patient info */}
        <div style={{ flex: 1, color: '#fff', minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, wordBreak: 'break-word' }}>{p.name}</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 4 }}>
            🩺 <em>{p.symptoms}</em>
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            {p.gender === 'female' ? '♀' : '♂'} {p.age ? `${p.age} yrs ·` : ''} 🕐 Registered at {p.time}
          </div>
          {p.dues > 0 && (
            <div
              style={{
                marginTop: 8,
                display: 'inline-block',
                background: 'rgba(255,80,80,0.25)',
                border: '1px solid rgba(255,80,80,0.4)',
                borderRadius: 20,
                padding: '3px 12px',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              ⚠️ Dues: Rs. {p.dues}
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="doctor-current-action" style={{ flexShrink: 0 }}>
          {p.status === 'waiting' && (
            <button
              onClick={() => onUpdateStatus(p.id, 'called')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.4)',
                borderRadius: 10,
                color: '#fff',
                padding: '12px 22px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 15,
                fontFamily: 'inherit',
                width: '100%',
              }}
            >
              📢 Call Patient
            </button>
          )}
          {p.status === 'called' && (
            <button
              onClick={() => onUpdateStatus(p.id, 'done')}
              style={{
                background: 'rgba(0,200,100,0.3)',
                border: '2px solid rgba(0,200,100,0.5)',
                borderRadius: 10,
                color: '#fff',
                padding: '12px 22px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 15,
                fontFamily: 'inherit',
                width: '100%',
              }}
            >
              ✓ Mark as Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Token Row ────────────────────────────────────────────────── */
function TokenRow({ patient: p, isLast, isCurrent, onUpdateStatus }) {
  const bgMap = { waiting: 'var(--surface)', called: '#fefce8', done: 'var(--surface2)' };
  return (
    <div
      className="doctor-token-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        background: bgMap[p.status],
        outline: isCurrent ? '2px solid #7c3aed' : 'none',
        outlineOffset: -2,
      }}
    >
      {/* Token badge */}
      <TokenBadge token={p.token} size="md" status={p.status} />

      {/* Patient details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: p.status === 'done' ? 'var(--text-muted)' : 'var(--text)',
            textDecoration: p.status === 'done' ? 'line-through' : 'none',
            marginBottom: 3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {p.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.symptoms?.substring(0, 60)}{p.symptoms?.length > 60 ? '…' : ''}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 3 }}>
          {p.gender === 'female' ? '♀' : '♂'} {p.age ? `${p.age} yrs · ` : ''}🕐 {p.time}
          {p.dues > 0 && <span style={{ color: 'var(--danger)', marginLeft: 8 }}>⚠️ Due Rs.{p.dues}</span>}
        </div>
      </div>

      {/* Status + action */}
      <div
        className="token-actions"
        style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
      >
        <Badge color={p.status === 'called' ? 'yellow' : p.status === 'done' ? 'gray' : 'blue'}>
          {p.status === 'waiting' ? '⏳ Waiting' : p.status === 'called' ? '📢 Called' : '✓ Done'}
        </Badge>
        {p.status === 'waiting' && (
          <Btn size="sm" variant="outline" onClick={() => onUpdateStatus(p.id, 'called')}>
            Call
          </Btn>
        )}
        {p.status === 'called' && (
          <Btn size="sm" variant="success" onClick={() => onUpdateStatus(p.id, 'done')}>
            Done
          </Btn>
        )}
      </div>
    </div>
  );
}

/* ── Stats Tab ────────────────────────────────────────────────── */
function StatsTab({ myPatients, waiting, called, done }) {
  const totalRev  = myPatients.reduce((s, p) => s + (p.paid || 0), 0);
  const totalDues = myPatients.reduce((s, p) => s + (p.dues || 0), 0);

  return (
    <div>
      <SectionHeader title="My Statistics" subtitle={`Today, ${today()}`} />
      <div
        className="stats-stat-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Stat label="Total Patients Today" value={myPatients.length} icon="👥" color="#7c3aed" />
        <Stat label="Completed"            value={done.length}        icon="✅" color="var(--success)" />
        <Stat label="Still Waiting"        value={waiting.length}     icon="⏳" color="var(--primary)" />
        <Stat label="Revenue Collected Rs." value={totalRev.toLocaleString()} icon="💰" color="var(--success)" />
        <Stat label="Total Dues Rs."       value={totalDues.toLocaleString()} icon="⚠️" color="var(--danger)" />
      </div>

      {myPatients.length > 0 && (
        <Card noPad>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
            <h3 style={{ fontSize: 15 }}>Patient Breakdown</h3>
          </div>
          <div className="stats-table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['Token', 'Name', 'Age', 'Symptoms', 'Fee Rs.', 'Paid Rs.', 'Dues Rs.', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myPatients.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <TokenBadge token={p.token} size="sm" status={p.status} />
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{p.age || '-'}</td>
                    <td
                      style={{
                        padding: '10px 14px',
                        color: 'var(--text-muted)',
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.symptoms}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{p.totalFee || 0}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--success)', fontWeight: 500 }}>{p.paid || 0}</td>
                    <td
                      style={{
                        padding: '10px 14px',
                        color: p.dues > 0 ? 'var(--danger)' : 'var(--text-muted)',
                        fontWeight: p.dues > 0 ? 600 : 400,
                      }}
                    >
                      {p.dues || 0}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge color={p.status === 'called' ? 'yellow' : p.status === 'done' ? 'gray' : 'blue'}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}