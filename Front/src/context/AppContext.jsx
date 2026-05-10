import React, { createContext, useContext, useState, useCallback } from 'react';
import { loadClinics, saveClinics, getClinic, updateClinic } from '../utils/helpers';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null); // { type, clinicId, user }

  const login = useCallback((sess) => setSession(sess), []);
  const logout = useCallback(() => setSession(null), []);

  // Always read fresh clinic data
  const refreshClinic = useCallback(
    () => (session?.clinicId ? getClinic(session.clinicId) : null),
    [session]
  );

  // Save updated clinic and return it
  const saveClinic = useCallback((updatedClinic) => {
    updateClinic(updatedClinic);
    return updatedClinic;
  }, []);

  // Save a new clinic (super admin)
  const addClinic = useCallback((clinic) => {
    const all = loadClinics();
    all.push(clinic);
    saveClinics(all);
  }, []);

  return (
    <AppContext.Provider
      value={{ session, login, logout, refreshClinic, saveClinic, addClinic }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}