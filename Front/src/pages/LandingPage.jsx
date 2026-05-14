import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { apiRegister, apiLogin } from '../utils/api';
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

// ── Validation helpers ────────────────────────────────────────────────────────
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isValidPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
};

// ── India Post Pincode API ────────────────────────────────────────────────────
// Returns { state, district, subDistrict, city } or null
async function fetchPincodeData(pincode) {
  try {
    const res = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`
    );
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();
    if (!json || !json[0] || json[0].Status !== 'Success') return null;

    const postOffices = json[0].PostOffice;
    if (!postOffices || postOffices.length === 0) return null;

    // Use first post office for state & district; collect all for city options
    const first = postOffices[0];
    const cities = [...new Set(postOffices.map((p) => p.Name))];
    const subDistricts = [...new Set(postOffices.map((p) => p.Block).filter(Boolean))];

    return {
      state: first.State,
      district: first.District,
      subDistrict: subDistricts[0] || '',
      allSubDistricts: subDistricts,
      cities,
    };
  } catch {
    return null;
  }
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

const makeStyles = (mob) => ({
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(150deg, #e8f4fd 0%, #f0f8ff 35%, #e8f9f5 70%, #f5fffc 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: mob ? '12px 16px 20px' : '16px 20px',
    position: 'relative', overflowX: 'hidden', overflowY: 'auto',
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  wrap: { position: 'relative', zIndex: 2, width: '100%', maxWidth: mob ? '100%' : 480 },
  brand: { textAlign: 'center', marginBottom: mob ? 6 : 10, paddingTop: 0 },
  logoBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: mob ? 2 : 4 },
  logoIcon: {
    width: mob ? 250 : 270, height: mob ? 150 : 180,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0, background: 'transparent',
  },
  brandSub: { color: C.textMuted, fontSize: mob ? 11.5 : 12.5, fontWeight: 300, letterSpacing: 0.3, marginBottom: 0 },
  card: {
    background: C.white, borderRadius: mob ? 14 : 18,
    padding: mob ? '20px 18px 18px' : '28px 32px',
    boxShadow: '0 20px 60px rgba(10,61,98,0.12)',
    border: '1px solid rgba(10,61,98,0.08)',
    position: 'relative', overflow: 'hidden',
  },
  cardAccentBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    background: `linear-gradient(90deg, ${C.brand}, ${C.brandMid}, ${C.accent})`,
  },
  welcomeBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'linear-gradient(135deg, rgba(10,61,98,0.06), rgba(0,184,148,0.06))',
    border: '1px solid rgba(10,61,98,0.12)', borderRadius: 20,
    padding: '4px 12px', fontSize: mob ? 11 : 12, color: C.textMuted,
    fontWeight: 500, marginBottom: mob ? 8 : 10,
  },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', background: C.accent, display: 'inline-block' },
  welcomeTitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: mob ? 20 : 24, color: C.textDark,
    marginBottom: mob ? 4 : 6, lineHeight: 1.2, fontWeight: 700,
  },
  welcomeDesc: { color: C.textMuted, fontSize: mob ? 12.5 : 13.5, marginBottom: mob ? 14 : 18, lineHeight: 1.5 },
  dividerOr: {
    display: 'flex', alignItems: 'center', gap: 12,
    color: C.textLight, fontSize: 12, margin: `${mob ? 8 : 10}px 0`,
  },
  dividerLine: { flex: 1, height: 1, background: C.border },
  btnBase: {
    width: '100%', padding: mob ? '13px 20px' : '12px 20px',
    borderRadius: 10, fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    fontSize: 15, fontWeight: 500, cursor: 'pointer', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  },
  btnPrimary: {
    background: `linear-gradient(135deg, ${C.brand}, ${C.brandMid})`,
    color: C.white, boxShadow: '0 4px 14px rgba(10,61,98,0.3)',
  },
  btnOutline: { background: 'transparent', color: C.textDark, border: `1.5px solid ${C.border}` },
  btnAccent: {
    background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
    color: C.white, boxShadow: '0 4px 14px rgba(0,184,148,0.3)',
  },
  btnGhost: {
    background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted,
    fontSize: 13, padding: '6px 0', display: 'inline-flex', alignItems: 'center', gap: 4,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  },
  secHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginBottom: mob ? 14 : 18, paddingBottom: mob ? 12 : 16,
    borderBottom: '1px solid #f0f4f8',
  },
  secTitle: { fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: mob ? 19 : 22, color: C.textDark, fontWeight: 700 },
  field: { marginBottom: mob ? 10 : 12 },
  fieldLabel: { display: 'block', fontSize: 11.5, fontWeight: 600, color: C.textMuted, marginBottom: 6, letterSpacing: 0.3, textTransform: 'uppercase' },
  fieldInput: {
    width: '100%', padding: mob ? '13px 14px' : '12px 14px',
    border: `1.5px solid ${C.border}`, borderRadius: 8,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    fontSize: mob ? 16 : 14.5, color: C.textDark, background: C.white,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
    WebkitAppearance: 'none',
  },
  fieldRow: { display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 0 : 12 },
  alertError: {
    padding: '11px 14px', borderRadius: 8, background: C.errBg,
    border: `1px solid ${C.errBorder}`, color: C.errText, fontSize: 13.5,
    display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12, lineHeight: 1.4,
  },
  hintOk:  { fontSize: 11.5, color: '#00a878', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 },
  hintErr: { fontSize: 11.5, color: '#e74c3c', marginTop: 4 },
});

// ── SVG icons ─────────────────────────────────────────────────────────────────
function IcoArrowRight({ color = 'white' }) {
  return <svg width="16" height="16" fill={color} viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>;
}
function IcoArrowLeft() {
  return <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>;
}
function IcoAlert() {
  return <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>;
}
function IcoSpinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
function IcoCheck() {
  return <svg width="14" height="14" fill="none" stroke="#00b894" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>;
}
function IcoLocation() {
  return <svg width="14" height="14" fill="#00b894" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>;
}

// ── Validated text input ──────────────────────────────────────────────────────
function FieldInput({ label, type = 'text', value, onChange, placeholder, inputMode, S, disabled, suffix, hint, hintType }) {
  const [focused, setFocused] = useState(false);
  const borderColor = hintType === 'err' ? '#e74c3c' : hintType === 'ok' ? '#00b894' : focused ? '#1565a8' : '#d0dce8';
  const shadow     = hintType === 'err'
    ? '0 0 0 3px rgba(231,76,60,0.1)'
    : hintType === 'ok'
    ? '0 0 0 3px rgba(0,184,148,0.12)'
    : focused
    ? '0 0 0 3px rgba(21,101,168,0.1)'
    : 'none';

  return (
    <div style={S.field}>
      <label style={S.fieldLabel}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} inputMode={inputMode} value={value} onChange={onChange}
          placeholder={placeholder} disabled={disabled}
          autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
          style={{
            ...S.fieldInput,
            borderColor,
            boxShadow: shadow,
            opacity: disabled ? 0.6 : 1,
            paddingRight: suffix ? 36 : undefined,
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix && (
          <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
            {suffix}
          </span>
        )}
      </div>
      {hint && hintType === 'ok'  && <div style={S.hintOk}><IcoCheck /> {hint}</div>}
      {hint && hintType === 'err' && <div style={S.hintErr}>{hint}</div>}
    </div>
  );
}

// ── Searchable dropdown ───────────────────────────────────────────────────────
function SearchDropdown({ label, value, onChange, options, placeholder, S, disabled }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function select(opt) { onChange(opt); setQuery(''); setOpen(false); }

  return (
    <div style={S.field} ref={ref}>
      <label style={S.fieldLabel}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div
          onClick={() => { if (!disabled) { setOpen(o => !o); setQuery(''); } }}
          style={{
            ...S.fieldInput,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: disabled ? 'not-allowed' : 'pointer',
            borderColor: open ? '#1565a8' : '#d0dce8',
            boxShadow: open ? '0 0 0 3px rgba(21,101,168,0.1)' : 'none',
            opacity: disabled ? 0.6 : 1,
            userSelect: 'none', padding: '12px 14px',
          }}
        >
          <span style={{ color: value ? C.textDark : '#b8c8d8', fontSize: 14.5 }}>
            {value || placeholder}
          </span>
          <svg width="14" height="14" fill="#8fa8bc" viewBox="0 0 24 24"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </div>

        {open && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
            background: '#fff', border: '1.5px solid #d0dce8', borderRadius: 10,
            boxShadow: '0 10px 40px rgba(10,61,98,0.15)', marginTop: 4,
            maxHeight: 260, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #f0f4f8' }}>
              <input
                autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                style={{
                  width: '100%', padding: '8px 10px', border: '1.5px solid #d0dce8',
                  borderRadius: 7, fontSize: 13.5, outline: 'none', boxSizing: 'border-box',
                  fontFamily: "'DM Sans', sans-serif", color: '#0a3d62',
                }}
                onFocus={e => e.target.style.borderColor = '#1565a8'}
                onBlur={e => e.target.style.borderColor = '#d0dce8'}
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#8fa8bc', fontSize: 13 }}>No results found</div>
              ) : filtered.map(opt => (
                <div
                  key={opt} onClick={() => select(opt)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', fontSize: 14,
                    color: opt === value ? '#1565a8' : '#0a3d62',
                    fontWeight: opt === value ? 700 : 400,
                    background: opt === value ? 'rgba(21,101,168,0.07)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid #f7f9fc', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = '#f4f8fc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = opt === value ? 'rgba(21,101,168,0.07)' : 'transparent'; }}
                >
                  {opt}
                  {opt === value && <IcoCheck />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pincode field — uses India Post API ───────────────────────────────────────
function PincodeField({ value, onChange, onAutoFill, S, disabled }) {
  const [status, setStatus] = useState(null); // null | 'loading' | 'found' | 'not-found'

  async function handleChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange(val);
    setStatus(null);

    if (val.length === 6) {
      setStatus('loading');
      const data = await fetchPincodeData(val);
      if (data) {
        onAutoFill(data.state, data.district, data.cities, data.allSubDistricts);
        setStatus('found');
      } else {
        setStatus('not-found');
      }
    }
  }

  const borderColor = status === 'found' ? '#00b894' : status === 'not-found' ? '#e74c3c' : undefined;

  return (
    <div style={S.field}>
      <label style={S.fieldLabel}>Pincode</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text" inputMode="numeric" value={value} onChange={handleChange}
          placeholder="6-digit pincode" disabled={disabled} maxLength={6}
          style={{
            ...S.fieldInput,
            borderColor: borderColor || '#d0dce8',
            boxShadow: status === 'found' ? '0 0 0 3px rgba(0,184,148,0.12)' : 'none',
            paddingRight: 36,
          }}
          onFocus={e => { if (!borderColor) e.target.style.borderColor = '#1565a8'; }}
          onBlur={e  => { if (!borderColor) e.target.style.borderColor = '#d0dce8'; }}
        />
        <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', lineHeight:1 }}>
          {status === 'loading'   && <IcoSpinner />}
          {status === 'found'     && <IcoLocation />}
          {status === 'not-found' && <span style={{ fontSize:16 }}>❓</span>}
        </span>
      </div>
      {status === 'found' && (
        <div style={S.hintOk}><IcoCheck /> State, District &amp; City auto-filled!</div>
      )}
      {status === 'not-found' && (
        <div style={S.hintErr}>Pincode not found — please fill state &amp; district manually.</div>
      )}
    </div>
  );
}

// ── Phone field (exactly 10 digits) ──────────────────────────────────────────
function PhoneField({ label, value, onChange, S, disabled, placeholder }) {
  const digits  = value.replace(/\D/g, '');
  const touched = value.length > 0;
  const isOk    = digits.length === 10;
  const hint    = touched && !isOk ? `${digits.length}/10 digits — must be exactly 10 digits` : null;

  function handleChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(raw);
  }

  return (
    <FieldInput
      S={S} label={label} type="tel" inputMode="numeric"
      value={value} onChange={handleChange}
      placeholder={placeholder || '10-digit mobile number'} disabled={disabled}
      hintType={touched ? (isOk ? 'ok' : 'err') : undefined}
      hint={isOk && touched ? '10 digits ✓' : hint}
    />
  );
}

// ── Email field with format validation ────────────────────────────────────────
function EmailField({ label, value, onChange, S, disabled, placeholder }) {
  const [touched, setTouched] = useState(false);
  const valid = isValidEmail(value);

  return (
    <div style={S.field}>
      <label style={S.fieldLabel}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="email" inputMode="email" value={value}
          onChange={e => { onChange(e); }}
          onBlur={() => setTouched(true)}
          placeholder={placeholder || 'admin@clinic.com'} disabled={disabled}
          autoComplete="email"
          style={{
            ...S.fieldInput,
            borderColor: touched && value ? (valid ? '#00b894' : '#e74c3c') : '#d0dce8',
            boxShadow: touched && value
              ? valid
                ? '0 0 0 3px rgba(0,184,148,0.12)'
                : '0 0 0 3px rgba(231,76,60,0.1)'
              : 'none',
            opacity: disabled ? 0.6 : 1,
          }}
          onFocus={e => { if (!touched) e.target.style.borderColor = '#1565a8'; }}
        />
      </div>
      {touched && value && !valid && (
        <div style={S.hintErr}>Enter a valid email address (e.g. name@domain.com)</div>
      )}
      {touched && value && valid && (
        <div style={S.hintOk}><IcoCheck /> Valid email</div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { login } = useApp();
  const mob = useIsMobile();
  const S   = makeStyles(mob);

  const [mode,    setMode]    = useState(null);
  const [role,    setRole]    = useState('superadmin');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  // Dynamic city options returned from the API
  const [apiCities, setApiCities] = useState([]);

  const [form, setForm] = useState({
    clinicName: '', ownerName: '', email: '',
    phone: '', whatsapp: '', address: '',
    pincode: '', city: '', district: '', state: '',
    subDistrict: '', password: '',
  });

  const f      = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const goBack = () => { setMode(null); setErr(''); };

  function handlePincodeAutoFill(state, district, cities, subDistricts) {
    setApiCities(cities || []);
    setForm(p => ({
      ...p,
      state,
      district,
      city: cities && cities.length === 1 ? cities[0] : '',
      subDistrict: subDistricts && subDistricts.length > 0 ? subDistricts[0] : '',
    }));
  }

  // ── Register ──────────────────────────────────────────────────────────────
  async function handleRegister() {
    setErr('');

    if (!form.clinicName || !form.ownerName || !form.email || !form.password) {
      setErr('Please fill in all required fields (Clinic Name, Owner Name, Email, Password).'); return;
    }
    if (!isValidEmail(form.email)) {
      setErr('Please enter a valid email address.'); return;
    }
    if (form.phone && !isValidPhone(form.phone)) {
      setErr('Phone number must be exactly 10 digits.'); return;
    }
    if (form.whatsapp && !isValidPhone(form.whatsapp)) {
      setErr('WhatsApp number must be exactly 10 digits.'); return;
    }
    if (form.password.length < 6) {
      setErr('Password must be at least 6 characters.'); return;
    }

    setLoading(true);
    try {
      const data = await apiRegister(form);
      login({ type: 'admin', clinicId: data.clinicId, user: data.clinic });
    } catch (e) {
      setErr(e.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function handleLogin() {
    setErr('');
    if (!form.email || !form.password) {
      setErr('Please enter your email and password.'); return;
    }
    if (!isValidEmail(form.email)) {
      setErr('Please enter a valid email address.'); return;
    }
    setLoading(true);
    try {
      const data = await apiLogin(role, form.email, form.password);
      login({ type: data.role, clinicId: data.clinicId, user: data.clinic || data.user || null });
    } catch (e) {
      setErr(e.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  const roles = [
    { key: 'superadmin',   label: '⭐  Super Admin'  },
    { key: 'admin',        label: '🔐  Clinic Admin'  },
    { key: 'receptionist', label: '📋  Receptionist'  },
    { key: 'doctor',       label: '👨‍⚕️  Doctor'        },
  ];

  return (
    <div style={{ ...S.page, ...(mode === null ? { height: '100vh', overflowY: 'hidden' } : {}) }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        @keyframes drift {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(20px,15px) scale(1.08); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #b8c8d8 !important; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        button, select, input { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* Decorative orbs */}
      {!mob && (
        <>
          <div style={{ position:'fixed', width:500, height:500, borderRadius:'50%', background:'#1565a8', filter:'blur(120px)', opacity:0.07, top:'-150px', right:'-150px', pointerEvents:'none', animation:'drift 8s ease-in-out 0s infinite alternate' }} />
          <div style={{ position:'fixed', width:400, height:400, borderRadius:'50%', background:'#00b894', filter:'blur(120px)', opacity:0.08, bottom:'-100px', left:'-100px', pointerEvents:'none', animation:'drift 11s ease-in-out 3s infinite alternate' }} />
        </>
      )}
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(10,61,98,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(10,61,98,0.04) 1px,transparent 1px)', backgroundSize:'50px 50px', pointerEvents:'none' }} />

      <div style={S.wrap}>
        {/* Brand header */}
        <div style={S.brand}>
          <div style={S.logoBox}>
            <div style={S.logoIcon}>
              <img src={curelexLogo} alt="Curelex Logo" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
            </div>
          </div>
          <div style={{ ...S.brandSub, marginBottom: mob ? 6 : 10 }}>Intelligent Patient Flow for Modern Clinics</div>
        </div>

        {/* ══════════ HOME ══════════ */}
        {!mode && (
          <div style={S.card}>
            <div style={S.cardAccentBar} />
            <div style={{ textAlign: 'center', marginBottom: mob ? 14 : 18 }}>
              <span style={S.welcomeBadge}><span style={S.badgeDot} /> Trusted by 500+ Clinics</span>
              <div style={S.welcomeTitle}>Welcome to Curelex</div>
              <div style={S.welcomeDesc}>Streamline patient queues, reduce wait times, and deliver a seamless clinic experience.</div>
            </div>
            <button style={{ ...S.btnBase, ...S.btnPrimary }} onClick={() => { setMode('register'); setErr(''); }}>
              Register Your Clinic <IcoArrowRight />
            </button>
            <div style={S.dividerOr}><div style={S.dividerLine} /> or <div style={S.dividerLine} /></div>
            <button style={{ ...S.btnBase, ...S.btnOutline }} onClick={() => { setMode('login'); setErr(''); }}>
              Sign in to Dashboard <IcoArrowRight color="#0a3d62" />
            </button>
          </div>
        )}

        {/* ══════════ REGISTER ══════════ */}
        {mode === 'register' && (
          <div style={S.card}>
            <div style={S.cardAccentBar} />
            <div style={S.secHeader}>
              <button style={S.btnGhost} onClick={goBack} disabled={loading}><IcoArrowLeft /> Back</button>
              <div style={S.secTitle}>Register Clinic</div>
            </div>

            <FieldInput S={S} label="Clinic Name *" value={form.clinicName} onChange={e => f('clinicName', e.target.value)} placeholder="e.g. City Medical Centre" disabled={loading} />
            <FieldInput S={S} label="Owner / Admin Name *" value={form.ownerName} onChange={e => f('ownerName', e.target.value)} placeholder="Full name" disabled={loading} />

            {/* Email + Phone side by side */}
            <div style={S.fieldRow}>
              <EmailField
                S={S} label="Email Address *"
                value={form.email}
                onChange={e => f('email', e.target.value)}
                placeholder="admin@clinic.com"
                disabled={loading}
              />
              <PhoneField
                S={S} label="Phone (10 digits)"
                value={form.phone}
                onChange={v => f('phone', v)}
                disabled={loading}
              />
            </div>

            {/* WhatsApp */}
            <div style={S.field}>
              <label style={S.fieldLabel}>WhatsApp Number (10 digits)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, lineHeight:1, pointerEvents:'none' }}>💬</span>
                <input
                  type="tel" inputMode="numeric"
                  value={form.whatsapp}
                  onChange={e => f('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit WhatsApp number" disabled={loading}
                  style={{
                    ...S.fieldInput, paddingLeft: 36,
                    borderColor: form.whatsapp
                      ? isValidPhone(form.whatsapp) ? '#00b894' : '#e74c3c'
                      : '#d0dce8',
                    boxShadow: form.whatsapp && isValidPhone(form.whatsapp)
                      ? '0 0 0 3px rgba(0,184,148,0.12)' : 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor='#1565a8'; e.target.style.boxShadow='0 0 0 3px rgba(21,101,168,0.1)'; }}
                  onBlur={e  => {
                    const d = form.whatsapp.replace(/\D/g, '');
                    e.target.style.borderColor = form.whatsapp ? (d.length === 10 ? '#00b894' : '#e74c3c') : '#d0dce8';
                    e.target.style.boxShadow   = form.whatsapp && d.length === 10 ? '0 0 0 3px rgba(0,184,148,0.12)' : 'none';
                  }}
                />
              </div>
              {form.whatsapp && !isValidPhone(form.whatsapp) && (
                <div style={S.hintErr}>{form.whatsapp.replace(/\D/g,'').length}/10 digits — must be exactly 10 digits</div>
              )}
            </div>

            <FieldInput S={S} label="Address" value={form.address} onChange={e => f('address', e.target.value)} placeholder="Street / Area / Sector" disabled={loading} />

            {/* ── Pincode → India Post API auto-fill ── */}
            <PincodeField
              value={form.pincode}
              onChange={v => f('pincode', v)}
              onAutoFill={handlePincodeAutoFill}
              S={S}
              disabled={loading}
            />

            {/* ── State (auto-filled, editable as text) ── */}
            <FieldInput
              S={S} label="State / Province"
              value={form.state}
              onChange={e => f('state', e.target.value)}
              placeholder="Auto-filled from pincode"
              disabled={loading}
            />

            {/* ── District (auto-filled, editable as text) ── */}
            <FieldInput
              S={S} label="District"
              value={form.district}
              onChange={e => f('district', e.target.value)}
              placeholder="Auto-filled from pincode"
              disabled={loading}
            />

            {/* ── Sub-District (auto-filled, editable) ── */}
            <FieldInput
              S={S} label="Sub-District / Block"
              value={form.subDistrict}
              onChange={e => f('subDistrict', e.target.value)}
              placeholder="Auto-filled from pincode"
              disabled={loading}
            />

            {/* ── City — dropdown if API returned multiple options, else plain text ── */}
            {apiCities.length > 1 ? (
              <SearchDropdown
                label="City / Town / Post Office"
                value={form.city}
                onChange={v => f('city', v)}
                options={apiCities}
                placeholder="Select city / post office…"
                S={S}
                disabled={loading}
              />
            ) : (
              <FieldInput
                S={S} label="City / Town"
                value={form.city}
                onChange={e => f('city', e.target.value)}
                placeholder="Auto-filled or type manually"
                disabled={loading}
              />
            )}

            {/* Password */}
            <FieldInput S={S} label="Password *" type="password" value={form.password} onChange={e => f('password', e.target.value)} placeholder="Min. 6 characters" disabled={loading} />

            {err && <div style={S.alertError}><IcoAlert /> <span>{err}</span></div>}

            <button style={{ ...S.btnBase, ...S.btnAccent }} onClick={handleRegister} disabled={loading}>
              {loading ? <><IcoSpinner /> Creating Account…</> : <>Create Clinic Account <IcoArrowRight /></>}
            </button>

            <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:'#8fa8bc' }}>
              By registering, you agree to our Terms of Service
            </div>
          </div>
        )}

        {/* ══════════ LOGIN ══════════ */}
        {mode === 'login' && (
          <div style={S.card}>
            <div style={S.cardAccentBar} />
            <div style={S.secHeader}>
              <button style={S.btnGhost} onClick={goBack} disabled={loading}><IcoArrowLeft /> Back</button>
              <div style={S.secTitle}>Sign In</div>
            </div>

            <div style={S.field}>
              <label style={S.fieldLabel}>Login As</label>
              <select value={role} onChange={e => { setRole(e.target.value); setErr(''); }} disabled={loading}
                style={{
                  ...S.fieldInput, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24'%3E%3Cpath fill='%234a6278' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 40,
                }}>
                {roles.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>

            <EmailField
              S={S} label="Email Address"
              value={form.email}
              onChange={e => f('email', e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
            />
            <FieldInput S={S} label="Password" type="password" value={form.password} onChange={e => f('password', e.target.value)} placeholder="Your password" disabled={loading} />

            {err && <div style={S.alertError}><IcoAlert /> <span>{err}</span></div>}

            <button style={{ ...S.btnBase, ...S.btnPrimary }} onClick={handleLogin} disabled={loading}>
              {loading ? <><IcoSpinner /> Signing In…</> : <>Sign In to Dashboard <IcoArrowRight /></>}
            </button>

            <div style={{ textAlign:'center', marginTop:14, fontSize:13 }}>
              <span style={{ color:'#8fa8bc' }}>New clinic?</span>{' '}
              <button style={{ ...S.btnGhost, color:'#1565a8', fontWeight:500, fontSize:13 }} onClick={() => { setMode('register'); setErr(''); }} disabled={loading}>
                Register here
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}