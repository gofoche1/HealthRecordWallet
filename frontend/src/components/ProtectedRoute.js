// src/components/ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isConnected, role } = useWallet();

  if (!isConnected) return <Navigate to="/" replace />;
  if (role !== requiredRole) return <Navigate to="/" replace />;

  return children;
}