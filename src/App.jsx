import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LandingPage from './pages/LandingPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

function Router() {
  const { session } = useApp();

  if (!session) return <LandingPage />;

  switch (session.type) {
    case 'superadmin':    return <SuperAdminDashboard />;
    case 'admin':         return <AdminDashboard />;
    case 'receptionist':  return <ReceptionistDashboard />;
    case 'doctor':        return <DoctorDashboard />;
    default:              return <LandingPage />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}