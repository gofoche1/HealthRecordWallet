// src/components/Navbar.js
// Shared top navigation bar. Shows wallet address + network when connected.

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import './Navbar.css';

// Shortens 0x1234...abcd for display
function shortenAddress(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function Navbar() {
  const { account, network, connectWallet, disconnectWallet, isConnected, loading } = useWallet();
  const location = useLocation();

  // Determine which portal we're on for nav highlighting
  const isPatient  = location.pathname.startsWith('/patient');
  const isProvider = location.pathname.startsWith('/provider');

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">⬡</span>
        <span className="brand-name">CypherCare</span>
      </Link>

      {/* Portal links — only shown when connected */}
      {isConnected && (
        <div className="navbar-links">
          <Link to="/patient"  className={`nav-link ${isPatient  ? 'active' : ''}`}>Patient Portal</Link>
          <Link to="/provider" className={`nav-link ${isProvider ? 'active' : ''}`}>Provider Portal</Link>
        </div>
      )}

      {/* Wallet status */}
      <div className="navbar-wallet">
        {isConnected ? (
          <div className="wallet-info">
            {/* Network badge */}
            {network && (
              <span className="network-badge mono">
                <span className="pulse-dot" style={{ marginRight: 6 }}></span>
                {network.name || `Chain ${network.chainId}`}
              </span>
            )}
            {/* Address */}
            <span className="wallet-address mono">{shortenAddress(account)}</span>
            {/* Disconnect */}
            <button className="btn-disconnect" onClick={disconnectWallet}>
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="btn-connect"
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? 'Connecting…' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </nav>
  );
}
