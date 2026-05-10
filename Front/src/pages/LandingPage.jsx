import React, { useState, useEffect } from 'react';
import { genId, today, loadClinics, saveClinics, SUPER_ADMIN } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import curelexLogo from '../assets/image.png';

// ── Mobile detection hook ─────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 480);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  brand:       '#0a3d62',
  brandMid:    '#1565a8',
  accent:      '#00b894',
  accentLight: '#00cec9',
  textDark:    '#0a3d62',
  textMuted:   '#4a6278',
  textLight:   '#8fa8bc',
  border:      '#d0dce8',
  white:       '#ffffff',
  errBg:       '#fef2f2',
  errBorder:   '#fecaca',
  errText:     '#c0392b',
};

// ── Styles factory (mobile-aware) ─────────────────────────────────────────────
const makeStyles = (mob) => ({
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(150deg, #e8f4fd 0%, #f0f8ff 35%, #e8f9f5 70%, #f5fffc 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: mob ? '12px 16px 20px' : '16px 20px',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto',
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  wrap: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: mob ? '100%' : 480,
  },

  // ── Brand ──
  brand: {
    textAlign: 'center',
    marginBottom: mob ? 6 : 10,
    paddingTop: 0,
  },
  logoBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: mob ? 2 : 4,
  },
  logoIcon: {
    width: mob ? 250 : 270,
    height: mob ? 150 : 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    background: 'transparent',
  },
  brandName: { display: 'none' },
  brandTagline: { display: 'none' },
  brandSub: {
    color: C.textMuted,
    fontSize: mob ? 11.5 : 12.5,
    fontWeight: 300,
    letterSpacing: 0.3,
    marginBottom: 0,
  },

  // ── Card ──
  card: {
    background: C.white,
    borderRadius: mob ? 14 : 18,
    padding: mob ? '20px 18px 18px' : '28px 32px',
    boxShadow: '0 20px 60px rgba(10,61,98,0.12)',
    border: '1px solid rgba(10,61,98,0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccentBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    background: `linear-gradient(90deg, ${C.brand}, ${C.brandMid}, ${C.accent})`,
  },

  // ── Welcome screen ──
  welcomeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'linear-gradient(135deg, rgba(10,61,98,0.06), rgba(0,184,148,0.06))',
    border: '1px solid rgba(10,61,98,0.12)',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: mob ? 11 : 12,
    color: C.textMuted,
    fontWeight: 500,
    marginBottom: mob ? 8 : 10,
  },
  badgeDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: C.accent, display: 'inline-block',
  },
  welcomeTitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: mob ? 20 : 24,
    color: C.textDark,
    marginBottom: mob ? 4 : 6,
    lineHeight: 1.2,
    fontWeight: 700,
  },
  welcomeDesc: {
    color: C.textMuted,
    fontSize: mob ? 12.5 : 13.5,
    marginBottom: mob ? 14 : 18,
    lineHeight: 1.5,
  },

  // ── Divider ──
  dividerOr: {
    display: 'flex', alignItems: 'center', gap: 12,
    color: C.textLight, fontSize: 12,
    margin: `${mob ? 8 : 10}px 0`,
  },
  dividerLine: { flex: 1, height: 1, background: C.border },

  // ── Buttons — bigger touch targets on mobile ──
  btnBase: {
    width: '100%',
    padding: mob ? '13px 20px' : '12px 20px',
    borderRadius: 10,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  },
  btnPrimary: {
    background: `linear-gradient(135deg, ${C.brand}, ${C.brandMid})`,
    color: C.white,
    boxShadow: '0 4px 14px rgba(10,61,98,0.3)',
  },
  btnOutline: {
    background: 'transparent',
    color: C.textDark,
    border: `1.5px solid ${C.border}`,
  },
  btnAccent: {
    background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
    color: C.white,
    boxShadow: '0 4px 14px rgba(0,184,148,0.3)',
  },
  btnGhost: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: C.textMuted,
    fontSize: 13,
    padding: '6px 0',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  },

  // ── Section header ──
  secHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: mob ? 14 : 18,
    paddingBottom: mob ? 12 : 16,
    borderBottom: '1px solid #f0f4f8',
  },
  secTitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: mob ? 19 : 22,
    color: C.textDark,
    fontWeight: 700,
  },

  // ── Fields ──
  field: { marginBottom: mob ? 10 : 12 },
  fieldLabel: {
    display: 'block',
    fontSize: 11.5,
    fontWeight: 500,
    color: C.textMuted,
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  fieldInput: {
    width: '100%',
    padding: mob ? '13px 14px' : '12px 14px',
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    fontSize: mob ? 16 : 14.5,
    color: C.textDark,
    background: C.white,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    WebkitAppearance: 'none',
  },
  // Two-col on desktop, single-col on mobile
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: mob ? '1fr' : '1fr 1fr',
    gap: mob ? 0 : 12,
  },

  // ── Role dropdown ──
  roleSelect: {
    width: '100%',
    padding: mob ? '13px 40px 13px 14px' : '12px 40px 12px 14px',
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    fontSize: mob ? 16 : 14.5,
    color: C.textDark,
    background: C.white,
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24'%3E%3Cpath fill='%234a6278' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
  },

  // ── Alert ──
  alertError: {
    padding: '11px 14px',
    borderRadius: 8,
    background: C.errBg,
    border: `1px solid ${C.errBorder}`,
    color: C.errText,
    fontSize: 13.5,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    lineHeight: 1.4,
  },

  // ── Bottom strip ──
  features: {
    display: 'flex',
    justifyContent: 'center',
    gap: mob ? 14 : 20,
    marginTop: mob ? 16 : 20,
    flexWrap: 'wrap',
  },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: 5,
    color: C.textMuted,
    fontSize: mob ? 11 : 12,
  },
  featureDot: {
    width: 5, height: 5, borderRadius: '50%',
    background: C.accent, flexShrink: 0,
  },
  trustRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: mob ? 12 : 16,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  trustItem: {
    display: 'flex', alignItems: 'center', gap: 4,
    color: C.textLight,
    fontSize: mob ? 10 : 11,
  },
});

// ── SVG icons ─────────────────────────────────────────────────────────────────
function IcoArrowRight({ color = 'white' }) {
  return (
    <svg width="16" height="16" fill={color} viewBox="0 0 24 24">
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
    </svg>
  );
}
function IcoArrowLeft() {
  return (
    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}
function IcoAlert() {
  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"
      style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  );
}

// ── FieldInput ────────────────────────────────────────────────────────────────
function FieldInput({ label, type = 'text', value, onChange, placeholder, inputMode, S }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={S.field}>
      <label style={S.fieldLabel}>{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={
          type === 'password' ? 'current-password'
          : type === 'email'  ? 'email'
          : 'off'
        }
        style={{
          ...S.fieldInput,
          borderColor: focused ? '#1565a8' : '#d0dce8',
          boxShadow:   focused ? '0 0 0 3px rgba(21,101,168,0.1)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { login } = useApp();
  const mob = useIsMobile();
  const S   = makeStyles(mob);

  const [mode, setMode] = useState(null); // null | 'register' | 'login'
  const [role, setRole] = useState('superadmin');
  const [form, setForm] = useState({
    clinicName: '', ownerName: '', email: '',
    phone: '', whatsapp: '', address: '', city: '', district: '', state: '', password: '',
  });
  const [err, setErr] = useState('');

  const f      = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const goBack = () => { setMode(null); setErr(''); };

  // ── Register ──────────────────────────────────────────────────────────────
  function handleRegister() {
    if (!form.clinicName || !form.ownerName || !form.email || !form.password) {
      setErr('Please fill in all required fields.'); return;
    }
    if (form.password.length < 6) {
      setErr('Password must be at least 6 characters.'); return;
    }
    const all = loadClinics();
    if (all.find((c) => c.email === form.email)) {
      setErr('An account with this email already exists.'); return;
    }
    const clinic = {
      id: genId(),
      name:     form.clinicName,
      owner:    form.ownerName,
      email:    form.email,
      phone:    form.phone,
      whatsapp: form.whatsapp,
      address:  form.address,
      city:     form.city,
      district: form.district,
      state:    form.state,
      password: form.password,
      doctors: [], receptionists: [], patients: [],
      createdAt: today(),
    };
    all.push(clinic);
    saveClinics(all);
    login({ type: 'admin', clinicId: clinic.id });
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  function handleLogin() {
    setErr('');
    const all = loadClinics();

    if (role === 'superadmin') {
      if (form.email === SUPER_ADMIN.email && form.password === SUPER_ADMIN.password) {
        login({ type: 'superadmin', clinicId: null });
      } else {
        setErr('Invalid super admin credentials.');
      }
      return;
    }
    if (role === 'admin') {
      const clinic = all.find(
        (c) => c.email === form.email && c.password === form.password
      );
      if (!clinic) { setErr('Invalid admin credentials.'); return; }
      login({ type: 'admin', clinicId: clinic.id });
      return;
    }
    if (role === 'receptionist') {
      for (const c of all) {
        const rec = (c.receptionists || []).find(
          (r) => r.email === form.email && r.password === form.password
        );
        if (rec) { login({ type: 'receptionist', clinicId: c.id, user: rec }); return; }
      }
      setErr('Invalid receptionist credentials.'); return;
    }
    if (role === 'doctor') {
      for (const c of all) {
        const doc = (c.doctors || []).find(
          (d) => d.email === form.email && d.password === form.password
        );
        if (doc) { login({ type: 'doctor', clinicId: c.id, user: doc }); return; }
      }
      setErr('Invalid doctor credentials.'); return;
    }
  }

  const roles = [
    { key: 'superadmin',   label: '⭐  Super Admin'  },
    { key: 'admin',        label: '🔐  Clinic Admin'  },
    { key: 'receptionist', label: '📋  Receptionist'  },
    { key: 'doctor',       label: '👨‍⚕️  Doctor'        },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ ...S.page, ...(mode === null ? { height: '100vh', overflowY: 'hidden' } : {}) }}>
      {/* Global CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        @keyframes drift {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(20px,15px) scale(1.08); }
        }
        input::placeholder { color: #b8c8d8 !important; }
        select:focus {
          border-color: #1565a8 !important;
          box-shadow: 0 0 0 3px rgba(21,101,168,0.1) !important;
          outline: none !important;
        }
        button, select, input { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* Decorative orbs */}
      {!mob && (
        <>
          <div style={{
            position:'fixed', width:500, height:500, borderRadius:'50%',
            background:'#1565a8', filter:'blur(120px)', opacity:0.07,
            top:'-150px', right:'-150px', pointerEvents:'none',
            animation:'drift 8s ease-in-out 0s infinite alternate'
          }} />
          <div style={{
            position:'fixed', width:400, height:400, borderRadius:'50%',
            background:'#00b894', filter:'blur(120px)', opacity:0.08,
            bottom:'-100px', left:'-100px', pointerEvents:'none',
            animation:'drift 11s ease-in-out 3s infinite alternate'
          }} />
          <div style={{
            position:'fixed', width:250, height:250, borderRadius:'50%',
            background:'#0d5c8e', filter:'blur(100px)', opacity:0.06,
            top:'40%', left:'10%', pointerEvents:'none',
            animation:'drift 9.5s ease-in-out 1.5s infinite alternate'
          }} />
        </>
      )}

      {/* Subtle grid pattern */}
      <div style={{
        position:'fixed', inset:0,
        backgroundImage:'linear-gradient(rgba(10,61,98,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(10,61,98,0.04) 1px,transparent 1px)',
        backgroundSize:'50px 50px', pointerEvents:'none'
      }} />

      <div style={S.wrap}>

        {/* ── Brand header ── */}
        <div style={S.brand}>
          <div style={S.logoBox}>
            <div style={S.logoIcon}>
              <img
                src={curelexLogo}
                alt="Curelex Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          </div>
          <div style={{ ...S.brandSub, marginBottom: mob ? 6 : 10 }}>Intelligent Patient Flow for Modern Clinics</div>
        </div>

        {/* ══════════ HOME ══════════ */}
        {!mode && (
          <div style={S.card}>
            <div style={S.cardAccentBar} />
            <div style={{ textAlign: 'center', marginBottom: mob ? 14 : 18 }}>
              <span style={S.welcomeBadge}>
                <span style={S.badgeDot} />
                Trusted by 500+ Clinics
              </span>
              <div style={S.welcomeTitle}>Welcome to Curelex</div>
              <div style={S.welcomeDesc}>
                Streamline patient queues, reduce wait times, and deliver a seamless clinic experience.
              </div>
            </div>

            <button
              style={{ ...S.btnBase, ...S.btnPrimary }}
              onClick={() => { setMode('register'); setErr(''); }}
            >
              Register Your Clinic <IcoArrowRight />
            </button>

            <div style={S.dividerOr}>
              <div style={S.dividerLine} /> or <div style={S.dividerLine} />
            </div>

            <button
              style={{ ...S.btnBase, ...S.btnOutline }}
              onClick={() => { setMode('login'); setErr(''); }}
            >
              Sign in to Dashboard <IcoArrowRight color="#0a3d62" />
            </button>
          </div>
        )}

        {/* ══════════ REGISTER ══════════ */}
        {mode === 'register' && (
          <div style={S.card}>
            <div style={S.cardAccentBar} />
            <div style={S.secHeader}>
              <button style={S.btnGhost} onClick={goBack}>
                <IcoArrowLeft /> Back
              </button>
              <div style={S.secTitle}>Register Clinic</div>
            </div>

            {/* Clinic Name */}
            <FieldInput S={S} label="Clinic Name"
              value={form.clinicName} onChange={(e) => f('clinicName', e.target.value)}
              placeholder="e.g. City Medical Centre" />

            {/* Owner Name */}
            <FieldInput S={S} label="Owner / Admin Name"
              value={form.ownerName} onChange={(e) => f('ownerName', e.target.value)}
              placeholder="Full name" />

            {/* Email + Phone — 2 col desktop, 1 col mobile */}
            <div style={S.fieldRow}>
              <FieldInput S={S} label="Email Address" type="email" inputMode="email"
                value={form.email} onChange={(e) => f('email', e.target.value)}
                placeholder="admin@clinic.com" />
              <FieldInput S={S} label="Phone" type="tel" inputMode="tel"
                value={form.phone} onChange={(e) => f('phone', e.target.value)}
                placeholder="03xx-xxxxxxx" />
            </div>

            {/* WhatsApp — full width with icon hint */}
            <div style={S.field}>
              <label style={S.fieldLabel}>WhatsApp Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 16, lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
                }}>💬</span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.whatsapp}
                  onChange={(e) => f('whatsapp', e.target.value)}
                  placeholder="03xx-xxxxxxx (for patient communication)"
                  autoComplete="off"
                  style={{
                    ...S.fieldInput,
                    paddingLeft: 36,
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#1565a8'; e.target.style.boxShadow = '0 0 0 3px rgba(21,101,168,0.1)'; }}
                  onBlur={(e)  => { e.target.style.borderColor = '#d0dce8'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Address — full width */}
            <FieldInput S={S} label="Address"
              value={form.address} onChange={(e) => f('address', e.target.value)}
              placeholder="Street / Area / Sector" />

            {/* City + District — 2 col desktop, 1 col mobile */}
            <div style={S.fieldRow}>
              <FieldInput S={S} label="City"
                value={form.city} onChange={(e) => f('city', e.target.value)}
                placeholder="e.g. Lahore" />
              <FieldInput S={S} label="District"
                value={form.district} onChange={(e) => f('district', e.target.value)}
                placeholder="e.g. Gulberg" />
            </div>

            {/* State + Password — 2 col desktop, 1 col mobile */}
            <div style={S.fieldRow}>
              <FieldInput S={S} label="State / Province"
                value={form.state} onChange={(e) => f('state', e.target.value)}
                placeholder="e.g. Punjab" />
              <FieldInput S={S} label="Password" type="password"
                value={form.password} onChange={(e) => f('password', e.target.value)}
                placeholder="Min. 6 characters" />
            </div>

            {err && (
              <div style={S.alertError}>
                <IcoAlert /> <span>{err}</span>
              </div>
            )}

            <button style={{ ...S.btnBase, ...S.btnAccent }} onClick={handleRegister}>
              Create Clinic Account <IcoArrowRight />
            </button>

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#8fa8bc' }}>
              By registering, you agree to our Terms of Service
            </div>
          </div>
        )}

        {/* ══════════ LOGIN ══════════ */}
        {mode === 'login' && (
          <div style={S.card}>
            <div style={S.cardAccentBar} />
            <div style={S.secHeader}>
              <button style={S.btnGhost} onClick={goBack}>
                <IcoArrowLeft /> Back
              </button>
              <div style={S.secTitle}>Sign In</div>
            </div>

            {/* Role dropdown */}
            <div style={S.field}>
              <label style={S.fieldLabel}>Login As</label>
              <select
                value={role}
                onChange={(e) => { setRole(e.target.value); setErr(''); }}
                style={S.roleSelect}
              >
                {roles.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>

            <FieldInput S={S} label="Email Address" type="email" inputMode="email"
              value={form.email} onChange={(e) => f('email', e.target.value)}
              placeholder="your@email.com" />

            <FieldInput S={S} label="Password" type="password"
              value={form.password} onChange={(e) => f('password', e.target.value)}
              placeholder="Your password" />

            {err && (
              <div style={S.alertError}>
                <IcoAlert /> <span>{err}</span>
              </div>
            )}

            <button style={{ ...S.btnBase, ...S.btnPrimary }} onClick={handleLogin}>
              Sign In to Dashboard <IcoArrowRight />
            </button>

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
              <span style={{ color: '#8fa8bc' }}>New clinic?</span>{' '}
              <button
                style={{ ...S.btnGhost, color: '#1565a8', fontWeight: 500, fontSize: 13 }}
                onClick={() => { setMode('register'); setErr(''); }}
              >
                Register here
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}