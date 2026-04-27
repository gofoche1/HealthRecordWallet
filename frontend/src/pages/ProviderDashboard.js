
import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const MOCK_MY_UPLOADS = [
  {
    id: 'up_001',
    name: 'Patient Lab Report — J. Harris',
    patientAddress: '0x8f4a...9d23',
    date: '2025-04-05',
    cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    hash: '0x3a4f...b91c',
    size: '1.2 MB',
    accessStatus: 'pending',
  },
  {
    id: 'up_002',
    name: 'Radiology: Chest CT Scan',
    patientAddress: '0x2c1b...7e44',
    date: '2025-03-30',
    cid: 'QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o',
    hash: '0x7d2a...e45f',
    size: '8.7 MB',
    accessStatus: 'approved',
  },
];

function shortenAddress(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function ProviderDashboard() {
  const { account, isConnected, accessMap, refreshAccess, provider } = useWallet();
  const navigate = useNavigate();

  const [uploads, setUploads]         = useState(MOCK_MY_UPLOADS);
  const [activeTab, setActiveTab]     = useState('upload'); // 'upload' | 'records' | 'access'
  const [txStatus, setTxStatus]       = useState(null);

  // Upload form state
  const [uploadFile, setUploadFile]   = useState(null);
  const [patientAddr, setPatientAddr] = useState('');
  const [docType, setDocType]         = useState('Lab Result');
  const [uploading, setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  
  useEffect(() => {
  if (!provider || uploads.length === 0) return;

  uploads.forEach((upload, index) => {
    refreshAccess(index, account, provider);
  });
}, [provider, uploads]);

  // Guard
  useEffect(() => {
    if (!isConnected) navigate('/');
  }, [isConnected, navigate]);

  
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !patientAddr) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // ============================================================
      // WEEK 2 — Replace simulation with real API call:
      //
      // const formData = new FormData();
      // formData.append('file', uploadFile);
      // formData.append('patientAddress', patientAddr);
      // formData.append('docType', docType);
      //
      // const response = await fetch('http://localhost:3001/upload', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const { cid, hash } = await response.json();
      //
      // Then store hash on-chain (Week 3):
      // const tx = await contract.storeDocumentHash(hash, patientAddr);
      // await tx.wait();
      //
      // ============================================================

      // Simulated progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(r => setTimeout(r, 200));
        setUploadProgress(i);
      }

      const newUpload = {
        id: `up_${Date.now()}`,
        name: uploadFile.name,
        patientAddress: patientAddr,
        date: new Date().toISOString().split('T')[0],
        cid: 'QmSimulated' + Math.random().toString(36).slice(2, 14),
        hash: '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6),
        size: (uploadFile.size / 1024 / 1024).toFixed(2) + ' MB',
        accessStatus: 'pending',
      };
      setUploads(prev => [newUpload, ...prev]);

      setTxStatus({ type: 'success', msg: '✓ File encrypted, uploaded to IPFS, hash stored on-chain.' });
      setUploadFile(null);
      setPatientAddr('');
      setActiveTab('records');

    } catch (err) {
      setTxStatus({ type: 'error', msg: `Upload failed: ${err.message}` });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setTimeout(() => setTxStatus(null), 5000);
    }
  };

  // Request access from patient
  const handleRequestAccess = async (uploadId, patientAddress) => {
    setTxStatus({ type: 'loading', msg: 'Sending access request…' });
    try {
      // WEEK 3: POST /request-access
      await new Promise(r => setTimeout(r, 1200));
      setTxStatus({ type: 'success', msg: '✓ Access request sent to patient.' });
    } catch (err) {
      setTxStatus({ type: 'error', msg: err.message });
    }
    setTimeout(() => setTxStatus(null), 4000);
  };

  return (
    <div className="dashboard-wrapper">
      <div className="bg-grid" />
      <div className="bg-orb bg-orb-green" style={{ opacity: 0.5 }} />

      <div className="dashboard-content">
        {/* Header */}
        <div className="dash-header fade-up">
          <div>
            <h2 className="dash-title" style={{ color: 'var(--green)' }}>Provider Portal</h2>
            <p className="dash-sub mono">
              {shortenAddress(account)} · {uploads.length} uploads
            </p>
          </div>
          <div className="stats-row">
            <Stat label="Uploads"  value={uploads.length} color="green" />
            <Stat label="Approved" value={uploads.filter(u=>u.accessStatus==='approved').length} color="cyan" />
            <Stat label="Pending"  value={uploads.filter(u=>u.accessStatus==='pending').length}  color="amber" />
          </div>
        </div>

        {/* Transaction status */}
        {txStatus && (
          <div className={`tx-banner tx-${txStatus.type} fade-up`}>
            {txStatus.type === 'loading' && <span className="spinner" />}
            {txStatus.msg}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs fade-up delay-1">
          {[
            { key: 'upload',  label: 'Upload Document' },
            { key: 'records', label: 'My Uploads' },
            { key: 'access',  label: 'Access Status' },
          ].map(t => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              style={activeTab === t.key ? { borderColor: 'var(--green)', color: 'var(--green)', background: 'var(--green-dim)' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Upload */}
        {activeTab === 'upload' && (
          <div className="upload-panel fade-up delay-2">
            <div className="upload-card">
              <h3 className="upload-card-title">Upload Patient Document</h3>
              <p className="upload-card-sub">
                Files are encrypted with AES-256 before upload to IPFS.
                The document hash is stored on the blockchain for integrity verification.
              </p>

              <form onSubmit={handleUpload} className="upload-form">
                {/* File drop zone */}
                <div
                  className="file-dropzone"
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={e => setUploadFile(e.target.files[0])}
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                  />
                  {uploadFile ? (
                    <div className="file-selected">
                      <span style={{ fontSize: '2rem' }}>📄</span>
                      <p className="file-name">{uploadFile.name}</p>
                      <p className="file-size">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="file-placeholder">
                      <span style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}>⬆</span>
                      <p>Click to select file</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PDF, JPEG, PNG, DOCX</p>
                    </div>
                  )}
                </div>

                {/* Patient address */}
                <div className="form-group">
                  <label className="form-label">Patient Wallet Address</label>
                  <input
                    className="form-input mono"
                    type="text"
                    placeholder="0x..."
                    value={patientAddr}
                    onChange={e => setPatientAddr(e.target.value)}
                    required
                  />
                </div>

                {/* Doc type */}
                <div className="form-group">
                  <label className="form-label">Document Type</label>
                  <select
                    className="form-input"
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                  >
                    <option>Lab Result</option>
                    <option>Imaging</option>
                    <option>Clinical Note</option>
                    <option>Prescription</option>
                    <option>Discharge Summary</option>
                  </select>
                </div>

                {/* Progress bar */}
                {uploading && (
                  <div className="progress-bar-wrap">
                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
                    <span className="progress-label">{uploadProgress}%</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-upload"
                  disabled={uploading || !uploadFile || !patientAddr}
                >
                  {uploading ? 'Encrypting & Uploading…' : '🔒 Encrypt & Upload to IPFS'}
                </button>
              </form>

              {/* Pipeline explainer */}
              <div className="pipeline-steps">
                {[
                  { step: '1', label: 'AES-256 Encrypt',   icon: '🔐' },
                  { step: '2', label: 'Upload to IPFS',    icon: '📦' },
                  { step: '3', label: 'Store Hash On-Chain',icon: '⛓' },
                  { step: '4', label: 'Patient Notified',  icon: '🔔' },
                ].map((s, i) => (
                  <React.Fragment key={s.step}>
                    <div className="pipe-step">
                      <div className="pipe-icon">{s.icon}</div>
                      <div className="pipe-label">{s.label}</div>
                    </div>
                    {i < 3 && <div className="pipe-arrow">→</div>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Uploads */}
        {activeTab === 'records' && (
          <div className="records-grid fade-up delay-2">
            {uploads.map(up => (
              <div key={up.id} className="record-card">
                <div className="record-card-top">
                  <span className="record-type-badge">Upload</span>
                  <span className={`status-pill ${accessMap[index]?.[account] === true ? 'status-green' : 'status-amber'}`}>
                    {up.accessStatus === 'approved' ? 'Access Approved' : 'Pending Approval'}
                  </span>
                </div>
                <h3 className="record-name">{up.name}</h3>
                <div className="record-meta">
                  <MetaRow icon="👤" label={`Patient: ${up.patientAddress}`} mono />
                  <MetaRow icon="📅" label={up.date} />
                  <MetaRow icon="📦" label={`CID: ${up.cid.slice(0, 20)}…`} mono />
                  <MetaRow icon="🔗" label={`Hash: ${up.hash}`} mono />
                  <MetaRow icon="💾" label={`Size: ${up.size}`} />
                </div>
                <div className="record-actions">
                  {up.accessStatus !== 'approved' && (
                    <button
                      className="btn-action btn-primary-green"
                      onClick={() => handleRequestAccess(up.id, up.patientAddress)}
                    >
                      Request Access
                    </button>
                  )}
                  <button className="btn-action btn-outline"
                            onClick={() => window.open(`https://ipfs.io/ipfs/${record.cid}`, '_blank')}
                  >
                    View on IPFS
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Access status */}
        {activeTab === 'access' && (
          <div className="history-table-wrapper fade-up delay-2">
            <table className="history-table mono">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Patient</th>
                  <th>CID</th>
                  <th>Requested</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.patientAddress}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.cid.slice(0, 18)}…</td>
                    <td>{u.date}</td>
                    <td>
                      <span className={`status-pill ${u.accessStatus === 'approved' ? 'status-green' : 'status-amber'}`}>
                        {u.accessStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Helpers ----
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
