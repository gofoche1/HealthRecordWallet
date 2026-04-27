// src/App.js
// Root of the app. Sets up:
//  - WalletProvider (global wallet state via Context API)
//  - React Router (client-side navigation)
//  - Route definitions

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider, useWallet } from './context/WalletContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import PatientDashboard from './pages/PatientDashboard';
import ProviderDashboard from './pages/ProviderDashboard';

// ProtectedRoute: redirects to landing if wallet not connected
function ProtectedRoute({ children }) {
  const { isConnected } = useWallet();
  return isConnected ? children : <Navigate to="/" replace />;
}

// AppRoutes is a separate component so it can use useWallet (inside Provider)
function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public landing/login page */}
        <Route path="/" element={<Landing />} />

        {/* Patient portal — requires wallet connection */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Provider portal — requires wallet connection */}
        <Route
          path="/provider"
          element={
            <ProtectedRoute>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all — redirect unknown URLs to home */}
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
