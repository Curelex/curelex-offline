import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  apiLogout,
  getSession,
  setSession as persistSession,
  apiGetMyClinic,
  apiUpdateMyClinic,
  apiGetUsers,
  apiAddUser,
  apiDeleteUser,
  apiGetPatients,
  apiAddPatient,
  apiUpdatePatientStatus,
  apiUpdateFollowUp,
  apiUpdateTokenLimit,
  apiGetMe,
} from '../utils/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSessionState] = useState(() => getSession());

  const setSession = useCallback((sess) => {
    setSessionState(sess);
    if (sess) persistSession(sess);
    else apiLogout();
  }, []);

  const login  = useCallback((sess) => setSession(sess), [setSession]);
  const logout = useCallback(() => setSession(null),     [setSession]);

  // ── Clinic ──────────────────────────────────────────────────────
  const refreshClinic = useCallback(() => apiGetMyClinic(), []);
  const saveClinic    = useCallback((updates) => apiUpdateMyClinic(updates), []);

  // ── Users ────────────────────────────────────────────────────────
  const getUsers   = useCallback(() => apiGetUsers(), []);
  const addUser    = useCallback((data) => apiAddUser(data), []);
  const deleteUser = useCallback((userId) => apiDeleteUser(userId), []);
  const getMe      = useCallback(() => apiGetMe(), []);

  // ── Token Limit ──────────────────────────────────────────────────
  const updateTokenLimit = useCallback(
    (doctorId, limit) => apiUpdateTokenLimit(doctorId, limit),
    []
  );

  // ── Patients ─────────────────────────────────────────────────────
  const getPatients         = useCallback(() => apiGetPatients(), []);
  const addPatient          = useCallback((data) => apiAddPatient(data), []);
  const updatePatientStatus = useCallback(
    (patientId, status) => apiUpdatePatientStatus(patientId, status),
    []
  );
  const updateFollowUp      = useCallback(
    (patientId, followUpDate, followUpNote) => apiUpdateFollowUp(patientId, followUpDate, followUpNote),
    []
  );

  return (
    <AppContext.Provider value={{
      session, login, logout,
      refreshClinic, saveClinic,
      getUsers, addUser, deleteUser, getMe,
      updateTokenLimit,
      getPatients, addPatient, updatePatientStatus, updateFollowUp,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}