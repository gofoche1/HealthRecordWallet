// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider, useWallet } from './context/WalletContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import PatientDashboard from './pages/PatientDashboard';
import ProviderDashboard from './pages/ProviderDashboard';

// ProtectedRoute: checks connection AND role
function ProtectedRoute({ children, requiredRole }) {
  const { isConnected, role } = useWallet();

  if (!isConnected) return <Navigate to="/" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;

  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Patient portal — requires patient role */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute requiredRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Provider portal — requires provider role */}
        <Route
          path="/provider"
          element={
            <ProtectedRoute requiredRole="provider">
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </WalletProvider>
  );
}