import React, { useState, useEffect } from 'react';
import {
  DashboardLayout, Card, Stat, Btn, Badge, Input, Select,
  Modal, Alert, SectionHeader, Empty,
} from '../components/UI';
import { loadClinics, saveClinics, genId, today } from '../utils/helpers';
import { useApp } from '../context/AppContext';

export default function SuperAdminDashboard() {
  const { logout } = useApp();
  const [tab, setTab] = useState('overview');
  const [clinics, setClinics] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null); // for clinic detail modal

  function reload() {
    setClinics(loadClinics());
  }

  useEffect(() => { reload(); }, [tab]);

  const totalDoctors = clinics.reduce((s, c) => s + (c.doctors?.length || 0), 0);
  const totalPatients = clinics.reduce((s, c) => s + (c.patients?.length || 0), 0);
  const todayStr = today();
  const todayPatients = clinics.reduce(
    (s, c) => s + (c.patients || []).filter((p) => p.date === todayStr).length, 0
  );

  const navItems = [
    { icon: '📊', label: 'Overview', active: tab === 'overview', onClick: () => setTab('overview') },
    { icon: '🏥', label: 'All Clinics', active: tab === 'clinics', onClick: () => setTab('clinics'), badge: clinics.length },
    { icon: '👥', label: 'All Patients', active: tab === 'patients', onClick: () => setTab('patients') },
    { icon: '📈', label: 'Reports', active: tab === 'reports', onClick: () => setTab('reports') },
  ];

  return (
    <DashboardLayout
      title="Super Admin Panel"
      subtitle="ClinicFlow — All Clinics Management"
      navItems={navItems}
      onLogout={logout}
      clinicName="ClinicFlow HQ"
      userRole="Super Admin"
      accent="#1e293b"
    >
      {tab === 'overview' && <OverviewTab clinics={clinics} today={todayStr} totalDoctors={totalDoctors} totalPatients={totalPatients} todayPatients={todayPatients} onViewClinic={(c) => { setSelectedClinic(c); setTab('clinics'); }} />}
      {tab === 'clinics' && <ClinicsTab clinics={clinics} reload={reload} showAdd={showAdd} setShowAdd={setShowAdd} />}
      {tab === 'patients' && <AllPatientsTab clinics={clinics} />}
      {tab === 'reports' && <ReportsTab clinics={clinics} />}
    </DashboardLayout>
  );
}

/* ── Overview ───────────────────────────────────────────────── */
function OverviewTab({ clinics, today, totalDoctors, totalPatients, todayPatients }) {
  return (
    <div>
      <SectionHeader title="Platform Overview" subtitle="All clinics at a glance" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        <Stat label="Total Clinics" value={clinics.length} icon="🏥" color="#1e293b" />
        <Stat label="Total Doctors" value={totalDoctors} icon="👨‍⚕️" color="var(--accent)" />
        <Stat label="Total Patients" value={totalPatients} icon="👥" color="var(--primary)" />
        <Stat label="Today's Tokens" value={todayPatients} icon="🎫" color="var(--success)" />
      </div>

      {/* Clinic cards */}
      <h3 style={{ fontSize: 17, marginBottom: 14 }}>Registered Clinics</h3>
      {clinics.length === 0 ? (
        <Empty icon="🏥" title="No clinics yet" desc="Clinics register themselves from the landing page." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {clinics.map((c) => {
            const todayCount = (c.patients || []).filter((p) => p.date === today).length;
            return (
              <Card key={c.id}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f2fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏥</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.city || 'No city'} · Registered {c.createdAt}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[{ l: 'Doctors', v: c.doctors?.length || 0 }, { l: 'Receptionists', v: c.receptionists?.length || 0 }, { l: "Today's Tokens", v: todayCount }].map((s) => (
                    <div key={s.l} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>👤 Admin: {c.owner} · {c.email}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Clinics Tab ─────────────────────────────────────────────── */
function ClinicsTab({ clinics, reload }) {
  const [selected, setSelected] = useState(null);

  function deleteClinic(id) {
    if (!window.confirm('Delete this clinic and ALL its data?')) return;
    const all = loadClinics().filter((c) => c.id !== id);
    saveClinics(all);
    reload();
  }

  return (
    <div>
      <SectionHeader
        title="All Clinics"
        subtitle={`${clinics.length} clinics registered on the platform`}
      />

      {clinics.length === 0 ? (
        <Empty icon="🏥" title="No clinics registered" desc="Clinics self-register from the landing page." />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {clinics.map((c) => (
            <Card key={c.id} noPad>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', flexWrap: 'wrap' }}>
                {/* Info */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f2fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏥</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    {c.city} · {c.email} · Admin: {c.owner}
                  </div>
                </div>
                {/* Stats */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Badge color="blue">👨‍⚕️ {c.doctors?.length || 0} Doctors</Badge>
                  <Badge color="teal">📋 {c.receptionists?.length || 0} Receptionists</Badge>
                  <Badge color="green">👥 {c.patients?.length || 0} Patients</Badge>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Btn size="sm" variant="outline" onClick={() => setSelected(c)}>View Details</Btn>
                  <Btn size="sm" variant="danger" onClick={() => deleteClinic(c.id)}>Delete</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <ClinicDetailModal clinic={selected} onClose={() => { setSelected(null); reload(); }} />
      )}
    </div>
  );
}

/* ── Clinic Detail Modal (super admin can see all staff) ────── */
function ClinicDetailModal({ clinic, onClose }) {
  const [c, setC] = useState(clinic);

  function reload() {
    const fresh = loadClinics().find((x) => x.id === clinic.id);
    if (fresh) setC(fresh);
  }

  const todayStr = today();
  const todayQ = (c.patients || []).filter((p) => p.date === todayStr);

  return (
    <Modal title={`${c.name} — Details`} onClose={onClose} width={700}>
      <div style={{ display: 'grid', gap: 20 }}>
        {/* Doctors */}
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>👨‍⚕️ Doctors ({c.doctors?.length || 0})</h3>
          {(c.doctors || []).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No doctors added.</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {c.doctors.map((d) => (
                <div key={d.id} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{d.specialist}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Login: <strong>{d.email}</strong> / <strong>{d.password}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Receptionists */}
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>📋 Receptionists ({c.receptionists?.length || 0})</h3>
          {(c.receptionists || []).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No receptionists added.</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {c.receptionists.map((r) => (
                <div key={r.id} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</span>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Login: <strong>{r.email}</strong> / <strong>{r.password}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's queue */}
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>🎫 Today's Tokens ({todayQ.length})</h3>
          {todayQ.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No patients registered today.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {['Token', 'Patient', 'Doctor', 'Paid', 'Dues', 'Status'].map((h) => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {todayQ.sort((a, b) => a.token - b.token).map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 12px' }}><span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>#{p.token}</span></td>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{p.doctorName}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--success)' }}>Rs.{p.paid || 0}</td>
                      <td style={{ padding: '8px 12px', color: p.dues > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>Rs.{p.dues || 0}</td>
                      <td style={{ padding: '8px 12px' }}><Badge color={p.status === 'done' ? 'gray' : p.status === 'called' ? 'yellow' : 'blue'}>{p.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ── All Patients Tab ────────────────────────────────────────── */
function AllPatientsTab({ clinics }) {
  const [search, setSearch] = useState('');
  const allPatients = clinics.flatMap((c) =>
    (c.patients || []).map((p) => ({ ...p, clinicName: c.name }))
  );
  const filtered = allPatients.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.clinicName.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.token - a.token;
  });

  return (
    <div>
      <SectionHeader
        title="All Patients"
        subtitle={`${allPatients.length} total patients across all clinics`}
        action={
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or clinic..." style={{ width: 240 }} />
        }
      />
      <Card noPad>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Token', 'Patient', 'Clinic', 'Doctor', 'Paid Rs.', 'Dues Rs.', 'Date', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No patients found</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px' }}><span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>#{p.token}</span></td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{p.clinicName}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{p.doctorName}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--success)', fontWeight: 500 }}>Rs.{p.paid || 0}</td>
                  <td style={{ padding: '10px 14px', color: p.dues > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: p.dues > 0 ? 600 : 400 }}>Rs.{p.dues || 0}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.date}</td>
                  <td style={{ padding: '10px 14px' }}><Badge color={p.status === 'done' ? 'gray' : p.status === 'called' ? 'yellow' : 'blue'}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ── Reports Tab ─────────────────────────────────────────────── */
function ReportsTab({ clinics }) {
  const todayStr = today();
  return (
    <div>
      <SectionHeader title="Platform Reports" subtitle="Summary across all clinics" />
      <div style={{ display: 'grid', gap: 16 }}>
        {clinics.map((c) => {
          const todayP = (c.patients || []).filter((p) => p.date === todayStr);
          const totalRev = todayP.reduce((s, p) => s + (p.paid || 0), 0);
          const totalDues = todayP.reduce((s, p) => s + (p.dues || 0), 0);
          return (
            <Card key={c.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.city} · {c.owner}</div>
                </div>
                <Badge color="blue">Since {c.createdAt}</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
                {[
                  { l: "Today's Patients", v: todayP.length, col: 'var(--primary)' },
                  { l: "Today's Revenue", v: `Rs.${totalRev.toLocaleString()}`, col: 'var(--success)' },
                  { l: "Today's Dues", v: `Rs.${totalDues.toLocaleString()}`, col: 'var(--danger)' },
                  { l: 'Total All-time', v: c.patients?.length || 0, col: '#7c3aed' },
                  { l: 'Doctors', v: c.doctors?.length || 0, col: 'var(--accent)' },
                ].map((s) => (
                  <div key={s.l} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{s.l}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.col }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}