// src/pages/Landing.js
// The first screen users see. They choose Patient or Provider,
// then connect their MetaMask wallet.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import './Landing.css';

export default function Landing() {
  const { connectWallet, isConnected, loading, error, account } = useWallet();
  const [role, setRole] = useState(null); // 'patient' or 'provider'
  const navigate = useNavigate();

  // After wallet connects, route to the selected portal
  const handleConnect = async () => {
    if (!role) return;
    await connectWallet();
    // connectWallet sets account; navigate after a tick
  };

  // Watch for successful connection then redirect
  React.useEffect(() => {
    if (isConnected && role) {
      navigate(`/${role}`);
    }
  }, [isConnected, role, navigate]);

  return (
    <div className="landing-wrapper">
      {/* Decorative background */}
      <div className="bg-grid" />
      <div className="bg-orb bg-orb-cyan" />
      <div className="bg-orb bg-orb-green" />

      <div className="landing-container">
        {/* Header */}
        <div className="landing-header fade-up">
          <div className="landing-logo">⬡</div>
          <h1 className="landing-title">CypherCare</h1>
          <p className="landing-subtitle">
            Decentralized Health Record Management<br />
            <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Powered by Ethereum · IPFS · AES-256
            </span>
          </p>
        </div>

        {/* Role selection card */}
        <div className="login-card fade-up delay-2">
          <p className="card-label">Select your role to continue</p>

          <div className="role-grid">
            {/* Patient role */}
            <button
              className={`role-btn ${role === 'patient' ? 'selected' : ''}`}
              onClick={() => setRole('patient')}
            >
              <span className="role-icon">🧑‍⚕️</span>
              <span className="role-title">Patient</span>
              <span className="role-desc">View records &amp; manage access</span>
              {role === 'patient' && <span className="role-check">✓</span>}
            </button>

            {/* Provider role */}
            <button
              className={`role-btn ${role === 'provider' ? 'selected' : ''}`}
              onClick={() => setRole('provider')}
            >
              <span className="role-icon">🏥</span>
              <span className="role-title">Provider</span>
              <span className="role-desc">Upload records &amp; request access</span>
              {role === 'provider' && <span className="role-check">✓</span>}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="error-banner">
              ⚠ {error}
            </div>
          )}

          {/* Connect button */}
          <button
            className="btn-connect-main"
            onClick={handleConnect}
            disabled={!role || loading}
          >
            {loading
              ? 'Waiting for MetaMask…'
              : role
                ? `Connect as ${role.charAt(0).toUpperCase() + role.slice(1)}`
                : 'Select a role above'
            }
          </button>

          {/* MetaMask hint */}
          <p className="metamask-hint">
            Requires MetaMask browser extension ·{' '}
            <a href="https://metamask.io" target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)' }}>
              Install here
            </a>
          </p>
        </div>

        {/* Feature strip */}
        <div className="feature-strip fade-up delay-4">
          {[
            { icon: '🔐', label: 'End-to-end Encrypted' },
            { icon: '⛓',  label: 'On-chain Consent'     },
            { icon: '📦', label: 'IPFS Storage'          },
            { icon: '👁',  label: 'Audit Trail'           },
          ].map(f => (
            <div key={f.label} className="feature-pill">
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
