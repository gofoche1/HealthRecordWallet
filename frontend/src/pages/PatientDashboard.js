import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';


function shortenAddress(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function PatientDashboard() {
  const { account, isConnected, grantAccess } = useWallet();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("records");
  const [txStatus, setTxStatus] = useState(null);
  const [history, setHistory] = useState([]);
  
  const API_BASE_URL = "http://localhost:5050";
  const PATIENT_ID = account?.toLowerCase();

  useEffect(() => {
    if (!isConnected) navigate("/");
  }, [isConnected, navigate]);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/consent/requests/${PATIENT_ID}`);
        const data = await res.json();

        const mappedRequests = data.requests.map(req => ({
          id: req._id,
          provider: "Provider",
          providerAddress: req.granteeId,
          recordName: req.recordId?.title || "Health Record",
          recordId: req.recordId?._id || req.recordId,
          requestedAt: new Date(req.createdAt).toISOString().split("T")[0],
          status: req.status,
        }));

        setRequests(mappedRequests);
      } catch (err) {
        console.error("Failed to fetch requests", err);
      }
    }

    fetchRequests();
  }, []);
useEffect(() => {
  async function fetchRecords() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/records/${PATIENT_ID}`);
      const data = await res.json();

      const mappedRecords = data.records.map(record => ({
      id: record._id,
      docId: record.docId,
      name: record.title,
      type: record.recordType,
      date: new Date(record.createdAt).toISOString().split("T")[0],
      provider: "Provider",
      cid: record.encryptedFileCid,
      hash: record.encryptedFileCid.slice(0, 16) + "...",
      encrypted: true,
      accessGranted: false,
    }));

      setRecords(mappedRecords);
    } catch (err) {
      console.error("Failed to fetch records", err);
    }
  }

  fetchRecords();
}, []);
useEffect(() => {
  async function fetchHistory() {
    const res = await fetch(`${API_BASE_URL}/api/consent/history/${PATIENT_ID}`);
    const data = await res.json();

    const mappedHistory = data.history.map(item => ({
      id: item._id,
      status: item.status,
      recordName: item.recordId?.title || "Health Record",
      providerAddress: item.granteeId,
      date: new Date(item.updatedAt).toISOString().split("T")[0],
    }));

    setHistory(mappedHistory);
  }

  fetchHistory();
}, []);

 const handleGrant = async (recordId, requestId, providerAddress) => {
  setTxStatus({ type: "loading", msg: "Approving access request…" });

  try {
    // 1. Backend approval
    const res = await fetch(`${API_BASE_URL}/api/consent/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentId: requestId }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.details || data.error || "Approval failed");
    }

    // 2. Blockchain approval
    const record = records.find(r => r.id === recordId);

    if (record?.docId !== undefined && providerAddress) {
      await grantAccess(record.docId, providerAddress);
    } else {
      console.warn("Missing blockchain docId or providerAddress", {
        record,
        providerAddress,
      });
    }

    // 3. Update UI
    setRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status: "granted" } : req
      )
    );

    setTxStatus({ type: "success", msg: "✓ Access approved successfully." });
  } catch (err) {
    setTxStatus({ type: "error", msg: `Approval failed: ${err.message}` });
  }

  setTimeout(() => setTxStatus(null), 4000);
};

  const handleDeny = async (requestId) => {
  setTxStatus({ type: "loading", msg: "Denying access request…" });

  try {
    const res = await fetch(`${API_BASE_URL}/api/consent/deny`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentId: requestId }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.details || data.error || "Deny failed");
    }

    setRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status: "revoked" } : req
      )
    );

    setTxStatus({ type: "success", msg: "Access request denied." });
  } catch (err) {
    setTxStatus({ type: "error", msg: `Deny failed: ${err.message}` });
  }

  setTimeout(() => setTxStatus(null), 4000);
};
  /*const handleRevoke = async (recordId, providerAddress) => {
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
*/
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
                          onClick={() => handleGrant(req.recordId, req.id, req.providerAddress)}
                        >
                          Approve & Grant Access
                        </button>
                          <button
                      className="btn-action btn-danger"
                        onClick={() => handleDeny(req.id)}>
                
                          Deny
                        </button>
                      </>
                    ) : (
                      <span className={`status-pill ${req.status === 'granted' ? 'status-green' : 'status-red'}`}>
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
              {history.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "1rem" }}>
                    No consent history yet
                  </td>
                </tr>
              ) : (
                history.map(req => (
                  <HistoryRow
                    key={req.id}
                    action={req.status === "granted" ? "GRANTED" : req.status.toUpperCase()}
                    record={req.recordName}
                    party={req.providerAddress}
                    date={req.date}
                    tx="Backend"
                    status={req.status}
                  />
                ))
              )}
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
