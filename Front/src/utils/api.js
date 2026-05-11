// ── Curelex API Service ───────────────────────────────────────────────────────
// Matches backend routes exactly. Token stored in localStorage as cx_token.

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token / Session helpers ───────────────────────────────────────────────────
export function getToken()      { return localStorage.getItem('cx_token'); }
export function setToken(t)     { localStorage.setItem('cx_token', t); }
export function removeToken()   { localStorage.removeItem('cx_token'); }

export function getSession() {
  try { return JSON.parse(localStorage.getItem('cx_session') || 'null'); }
  catch { return null; }
}
export function setSession(s)   { localStorage.setItem('cx_session', JSON.stringify(s)); }
export function removeSession() { localStorage.removeItem('cx_session'); }

// ── Base fetch ────────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res  = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
// POST /api/auth/register
export async function apiRegister(form) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name:     form.clinicName,
      owner:    form.ownerName,
      email:    form.email,
      password: form.password,
      phone:    form.phone     || '',
      whatsapp: form.whatsapp  || '',
      address:  form.address   || '',
      city:     form.city      || '',
      district: form.district  || '',
      state:    form.state     || '',
    }),
  });
  setToken(data.token);
  setSession({ type: data.role, clinicId: String(data.clinicId), user: data.clinic || null });
  return data;
}

// POST /api/auth/login
export async function apiLogin(role, email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ role, email, password }),
  });
  setToken(data.token);
  const clinicId = data.clinicId ? String(data.clinicId) : null;
  setSession({ type: data.role, clinicId, user: data.clinic || data.user || null });
  return data;
}

export function apiLogout() {
  removeToken();
  removeSession();
}

// ── Clinic (admin's own) ──────────────────────────────────────────────────────
// GET  /api/clinics/me
export async function apiGetMyClinic() {
  return request('/clinics/me');
}

// PUT  /api/clinics/me
export async function apiUpdateMyClinic(updates) {
  return request('/clinics/me', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// POST /api/clinics/activate-plan
export async function apiActivatePlan(plan) {
  return request('/clinics/activate-plan', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

// ── Users (doctors / receptionists) ──────────────────────────────────────────
// GET  /api/users
export async function apiGetUsers() {
  return request('/users');
}

// GET  /api/users/me  — fetch own user record (doctor / receptionist)
export async function apiGetMe() {
  return request('/users/me');
}

// POST /api/users
export async function apiAddUser(userData) {
  return request('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

// DELETE /api/users/:id
export async function apiDeleteUser(userId) {
  return request(`/users/${userId}`, { method: 'DELETE' });
}

// PATCH /api/users/:id/token-limit  ← NEW
export async function apiUpdateTokenLimit(doctorId, limit) {
  return request(`/users/${doctorId}/token-limit`, {
    method: 'PATCH',
    body: JSON.stringify({ dailyTokenLimit: limit }),
  });
}

// ── Patients ──────────────────────────────────────────────────────────────────
// GET  /api/patients?date=today|all&search=...
export async function apiGetPatients(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/patients${qs ? '?' + qs : ''}`);
}

// POST /api/patients
export async function apiAddPatient(patientData) {
  return request('/patients', {
    method: 'POST',
    body: JSON.stringify(patientData),
  });
}

// PATCH /api/patients/:id/status
export async function apiUpdatePatientStatus(patientId, status) {
  return request(`/patients/${patientId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ── Super Admin ───────────────────────────────────────────────────────────────
// GET    /api/superadmin/clinics
export async function apiSuperGetClinics() {
  return request('/superadmin/clinics');
}

// GET    /api/superadmin/clinics/:id
export async function apiSuperGetClinic(clinicId) {
  return request(`/superadmin/clinics/${clinicId}`);
}

// DELETE /api/superadmin/clinics/:id
export async function apiSuperDeleteClinic(clinicId) {
  return request(`/superadmin/clinics/${clinicId}`, { method: 'DELETE' });
}

// PATCH  /api/superadmin/clinics/:id/plan
export async function apiSuperSetPlan(clinicId, plan) {
  return request(`/superadmin/clinics/${clinicId}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  });
}

// PATCH /api/patients/:id/followup  — set follow-up date + note
export async function apiUpdateFollowUp(patientId, followUpDate, followUpNote) {
  return request(`/patients/${patientId}/followup`, {
    method: 'PATCH',
    body: JSON.stringify({ followUpDate, followUpNote }),
  });
}