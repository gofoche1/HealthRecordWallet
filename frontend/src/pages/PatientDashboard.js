import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';


const MOCK_RECORDS = [
  {
    id: 'rec_001',
    name: 'Blood Panel Report',
    type: 'Lab Result',
    date: '2025-04-01',
    provider: 'Dr. Reynolds',
    cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    hash: '0x3a4f...b91c',
    encrypted: true,
    accessGranted: false,
  },
  {
    id: 'rec_002',
    name: 'Chest X-Ray',
    type: 'Imaging',
    date: '2025-03-22',
    provider: 'City Medical Center',
    cid: 'QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o',
    hash: '0x7d2a...e45f',
    encrypted: true,
    accessGranted: true,
    accessExpiry: '2025-05-01',
    grantedTo: '0xAbCd...1234',
  },
  {
    id: 'rec_003',
    name: 'Cardiology Consultation Notes',
    type: 'Clinical Note',
    date: '2025-02-14',
    provider: 'Dr. Osei-Bonsu',
    cid: 'QmRfW6Jze4WMBaFg93J8t2k3PZXy5NhGV7dHRg4WdXtCA',
    hash: '0x9e1b...c72d',
    encrypted: true,
    accessGranted: false,
  },
];

// Mock access requests from providers
const MOCK_REQUESTS = [
  {
    id: 'req_001',
    provider: 'Dr. Angela Kim',
    providerAddress: '0xDef0...5678',
    recordName: 'Blood Panel Report',
    recordId: 'rec_001',
    requestedAt: '2025-04-10',
    status: 'pending',
  },
];


function shortenAddress(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function PatientDashboard() {
  const { account, isConnected, signer, grantAccess, revokeAccess } = useWallet();
  const navigate = useNavigate();

  const [records, setRecords]     = useState(MOCK_RECORDS);
  const [requests, setRequests]   = useState(MOCK_REQUESTS);
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'requests' | 'history'
  const [txStatus, setTxStatus]   = useState(null);      // feedback for blockchain tx

  // Guard: redirect to landing if wallet disconnected
  useEffect(() => {
    if (!isConnected) navigate('/');
  }, [isConnected, navigate]);

  
 const handleGrant = async (recordId, requestId, providerAddress) => {
  setTxStatus({ type: 'loading', msg: 'Sending transaction to blockchain…' });
  try {
    // recordId doubles as docId for demo (0, 1, 2...)
    const docId = records.findIndex(r => r.id === recordId);
    await grantAccess(docId, providerAddress);  // ← real contract call

    setRequests(prev =>
      prev.map(req => req.id === requestId ? { ...req, status: 'approved' } : req)
    );
    setTxStatus({ type: 'success', msg: '✓ Access granted on-chain. Transaction confirmed.' });
  } catch (err) {
    setTxStatus({ type: 'error', msg: `Transaction failed: ${err.message}` });
  }
  setTimeout(() => setTxStatus(null), 4000);
};

  const handleRevoke = async (recordId, providerAddress) => {
  setTxStatus({ type: 'loading', msg: 'Revoking access on blockchain…' });
  try {
    const docId = records.findIndex(r => r.id === recordId);
    await revokeAccess(docId, providerAddress);  // ← real contract call

    setRecords(prev =>
      prev.map(r => r.id === recordId
        ? { ...r, accessGranted: false, grantedTo: null }
        : r
      )
    );
    setTxStatus({ type: 'success', msg: '✓ Access revoked. Transaction confirmed.' });
  } catch (err) {
    setTxStatus({ type: 'error', msg: `Failed: ${err.message}` });
  }
  setTimeout(() => setTxStatus(null), 4000);
};

  return (
    <div className="dashboard-wrapper">
      <div className="bg-grid" />
      <div className="bg-orb bg-orb-cyan" style={{ opacity: 0.5 }} />

      <div className="dashboard-content">
        {/* Page header */}
        <div className="dash-header fade-up">
          <div>
            <h2 className="dash-title">Patient Portal</h2>
            <p className="dash-sub mono">
              {shortenAddress(account)} · {records.length} records
            </p>
          </div>
          {/* Stats row */}
          <div className="stats-row">
            <Stat label="Records"        value={records.length}                            color="cyan"  />
            <Stat label="Access Granted" value={records.filter(r => r.accessGranted).length} color="green" />
            <Stat label="Pending"        value={requests.filter(r => r.status === 'pending').length} color="amber" />
          </div>
        </div>

        {/* Transaction status banner */}
        {txStatus && (
          <div className={`tx-banner tx-${txStatus.type} fade-up`}>
            {txStatus.type === 'loading' && <span className="spinner" />}
            {txStatus.msg}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs fade-up delay-1">
          {[
            { key: 'records',  label: 'My Records' },
            { key: 'requests', label: `Access Requests ${requests.filter(r=>r.status==='pending').length > 0 ? `(${requests.filter(r=>r.status==='pending').length})` : ''}` },
            { key: 'history',  label: 'Consent History' },
          ].map(t => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Records */}
        {activeTab === 'records' && (
          <div className="records-grid fade-up delay-2">
            {records.map(record => (
              <div key={record.id} className="record-card">
                <div className="record-card-top">
                  <div className="record-type-badge">{record.type}</div>
                  {record.accessGranted
                    ? <span className="status-pill status-green">Access Granted</span>
                    : <span className="status-pill status-dim">Private</span>
                  }
                </div>

                <h3 className="record-name">{record.name}</h3>

                <div className="record-meta">
                  <MetaRow icon="👤" label={record.provider} />
                  <MetaRow icon="📅" label={record.date} />
                  <MetaRow icon="📦" label={`CID: ${record.cid.slice(0, 18)}…`} mono />
                  <MetaRow icon="🔗" label={`Hash: ${record.hash}`} mono />
                  {record.accessGranted && record.grantedTo && (
                    <MetaRow icon="🔓" label={`Granted to: ${record.grantedTo}`} mono />
                  )}
                  {record.accessGranted && record.accessExpiry && (
                    <MetaRow icon="⏳" label={`Expires: ${record.accessExpiry}`} />
                  )}
                </div>

                <div className="record-actions">
                  {record.accessGranted ? (
                    <button
                      className="btn-action btn-danger"
                      onClick={() => handleRevoke(record.id)}
                    >
                      Revoke Access
                    </button>
                  ) : (
                    <button className="btn-action btn-ghost" disabled>
                      No Active Access
                    </button>
                  )}
                  <button className="btn-action btn-outline"
                          onClick ={() => window.open(`https://ipfs.io/ipfs/${record.cid}`, '_blank')}
                  >
                    View on IPFS
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Access Requests */}
        {activeTab === 'requests' && (
          <div className="requests-list fade-up delay-2">
            {requests.length === 0 ? (
              <EmptyState msg="No pending access requests" />
            ) : (
              requests.map(req => (
                <div key={req.id} className={`request-card status-border-${req.status}`}>
                  <div className="request-info">
                    <div className="request-provider">
                      <span className="req-icon">🏥</span>
                      <div>
                        <p className="req-name">{req.provider}</p>
                        <p className="mono req-address">{req.providerAddress}</p>
                      </div>
                    </div>
                    <div className="request-detail">
                      Requesting access to: <strong>{req.recordName}</strong>
                    </div>
                    <div className="request-date mono">Requested: {req.requestedAt}</div>
                  </div>

                  <div className="request-actions">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          className="btn-action btn-primary"
                          onClick={() => handleGrant(req.recordId, req.id)}
                        >
                          Approve & Grant Access
                        </button>
                        <button className="btn-action btn-danger">
                          Deny
                        </button>
                      </>
                    ) : (
                      <span className={`status-pill ${req.status === 'approved' ? 'status-green' : 'status-red'}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: History */}
        {activeTab === 'history' && (
          <div className="history-table-wrapper fade-up delay-2">
            <table className="history-table mono">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Record</th>
                  <th>Party</th>
                  <th>Date</th>
                  <th>Tx Hash</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <HistoryRow action="GRANTED"  record="Chest X-Ray" party="0xAbCd...1234" date="2025-03-22" tx="0xf3a2...99cc" status="confirmed" />
                <HistoryRow action="REVOKED"  record="MRI Scan"    party="0x12Ab...ef56" date="2025-02-01" tx="0x8b1d...3300" status="confirmed" />
                <HistoryRow action="GRANTED"  record="Blood Panel" party="0xDef0...5678" date="2025-01-15" tx="0xa9c4...7711" status="confirmed" />
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Small helper components ----

function Stat({ label, value, color }) {
  return (
    <div className={`stat-box stat-${color}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function MetaRow({ icon, label, mono }) {
  return (
    <div className="meta-row">
      <span className="meta-icon">{icon}</span>
      <span className={`meta-label ${mono ? 'mono' : ''}`}>{label}</span>
    </div>
  );
}

function HistoryRow({ action, record, party, date, tx, status }) {
  return (
    <tr>
      <td>
        <span className={`action-badge action-${action.toLowerCase()}`}>{action}</span>
      </td>
      <td>{record}</td>
      <td>{party}</td>
      <td>{date}</td>
      <td className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tx}</td>
      <td><span className="status-pill status-green" style={{ fontSize: '0.72rem' }}>{status}</span></td>
    </tr>
  );
}

function EmptyState({ msg }) {
  return (
    <div className="empty-state">
      <span style={{ fontSize: '2rem' }}>📭</span>
      <p>{msg}</p>
    </div>
  );
}
