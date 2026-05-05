import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function shortenAddress(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function ProviderDashboard() {
  //const { account, isConnected, accessMap, refreshAccess, provider } = useWallet();
  const { account, isConnected, provider, signer, addDocument } = useWallet();
  const navigate = useNavigate();

  const [uploads, setUploads] = useState([]);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'records' | 'access'
  const [txStatus, setTxStatus] = useState(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [patientAddr, setPatientAddr] = useState('');
  const [docType, setDocType] = useState('Lab Result');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  

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

  useEffect(() => {
    if (!provider || uploads.length === 0) return;
    // temp: on load, check access for all uploads and update state
    /* uploads.forEach((upload, index) => {
      refreshAccess(index, account, provider);
    });*/
  }, [provider, uploads]);

  // Guard
  useEffect(() => {
    if (!isConnected) navigate('/');
  }, [isConnected, navigate]);

  useEffect(() => {
    async function fetchUploads() {
      try {
        const API_BASE_URL = "http://localhost:5050";
       const userId = patientAddr;

        const res = await fetch(`${API_BASE_URL}/api/records/${userId}`);
        const data = await res.json();

        const mapped = data.records.map(record => ({
          id: record._id,
          name: record.title,
          patientAddress: record.userId,
          date: new Date(record.createdAt).toISOString().split("T")[0],
          cid: record.encryptedFileCid,
          hash: record.encryptedFileCid.slice(0, 16) + "...",
          size: (record.fileSize / 1024 / 1024).toFixed(2) + " MB",
          accessStatus: "pending",
        }));

        setUploads(mapped);
      } catch (err) {
        console.error("Failed to fetch uploads", err);
      }
    }

    fetchUploads();
  }, []);

  const handleUpload = async (e) => {
  e.preventDefault();
  if (!uploadFile || !patientAddr) return;

  setUploading(true);
  setUploadProgress(0);

  try {
    const API_BASE_URL = "http://localhost:5050";

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("userId", patientAddr); 
    formData.append("title", uploadFile.name);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Upload failed");
    }

    setUploadProgress(100);

    // 🔥 ADD BLOCKCHAIN CALL HERE
    let blockchainDocId = null;

    try {
    blockchainDocId = await addDocument(
    patientAddr,
    data.record.encryptedFileCid
);
 
    } catch (chainErr) {
      console.error("Blockchain addDocument failed:", chainErr);
    }

    // 🔥 THEN CREATE newUpload USING docId
    const newUpload = {
      id: data.record._id,
      docId: blockchainDocId,   // <-- saved here
      name: data.record.title,
      patientAddress: data.record.userId,
      date: new Date(data.record.createdAt).toISOString().split("T")[0],
      cid: data.record.encryptedFileCid,
      hash: data.record.encryptedFileCid.slice(0, 16) + "...",
      size: (data.record.fileSize / 1024 / 1024).toFixed(2) + " MB",
      accessStatus: "pending",
    };

    // 🔥 UPDATE UI
    setUploads(prev => [newUpload, ...prev]);

    setTxStatus({ type: "success", msg: "✓ File uploaded + stored on blockchain." });
    setUploadFile(null);
    setPatientAddr("");
    setActiveTab("records");

  } catch (err) {
    setTxStatus({ type: "error", msg: `Upload failed: ${err.message}` });
  } finally {
    setUploading(false);
    setUploadProgress(0);
    setTimeout(() => setTxStatus(null), 5000);
  }
};

 const handleRequestAccess = async (uploadId, patientId) => {
  setTxStatus({ type: "loading", msg: "Sending access request…" });

  try {
    const res = await fetch("http://localhost:5050/api/consent/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: patientId.toLowerCase(),
        granteeId: account.toLowerCase(),
        recordId: uploadId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.details || data.error || "Request failed");
    }

    setTxStatus({ type: "success", msg: "✓ Access request sent to patient." });
  } catch (err) {
    setTxStatus({ type: "error", msg: `Request failed: ${err.message}` });
  }

  setTimeout(() => setTxStatus(null), 4000);
};

const refreshBackendAccessStatus = async () => {
  try {
    const providerWallet = account.toLowerCase();
    
    const updatedUploads = await Promise.all(
      uploads.map(async (up) => {
        const res = await fetch(
          `http://localhost:5050/api/consent/check?granteeId=${providerWallet}&recordId=${up.id}`
        );

        const data = await res.json();

        return {
          ...up,
          accessStatus: data.hasAccess ? "granted" : "pending",
        };
      })
    );

    setUploads(updatedUploads);
  } catch (err) {
    console.error("Failed to refresh access status", err);
  }
};

useEffect(() => {
  if (!account || uploads.length === 0) return;

  refreshBackendAccessStatus();
}, [account, uploads.length]);
    const getStatusLabel = (status) => {
    if (status === "granted") return "Granted";
    if (status === "pending") return "Pending";
    if (status === "revoked") return "Revoked";
    return status;
  };

  const getStatusClass = (status) => {
    if (status === "granted") return "status-green";
    if (status === "pending") return "status-amber";
    if (status === "revoked") return "status-red";
    return "status-amber";
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
            <Stat label="Uploads" value={uploads.length} color="green" />
            <Stat label="Granted" value={uploads.filter(u => u.accessStatus === 'granted').length} color="cyan" />
            <Stat label="Pending" value={uploads.filter(u => u.accessStatus === 'pending').length} color="amber" />
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
            { key: 'upload', label: 'Upload Document' },
            { key: 'records', label: 'My Uploads' },
            { key: 'access', label: 'Access Status' },
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
                  { step: '1', label: 'AES-256 Encrypt', icon: '🔐' },
                  { step: '2', label: 'Upload to IPFS', icon: '📦' },
                  { step: '3', label: 'Store Hash On-Chain', icon: '⛓' },
                  { step: '4', label: 'Patient Notified', icon: '🔔' },
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
            {uploads.map((up, index) => (
              <div key={up.id} className="record-card">
                <div className="record-card-top">
                  <span className="record-type-badge">Upload</span>
                 <span className={`status-pill ${up.accessStatus === "granted" ? "status-green" : "status-amber"}`}>
                 {up.accessStatus === "granted" ? "Granted" : "Pending"}
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
                  {up.accessStatus !== 'granted' && (
                    <button
                      className="btn-action btn-primary-green"
                      onClick={() => handleRequestAccess(up.id, up.patientAddress)}
                    >
                      Request Access
                    </button>
                  )}
                  <button className="btn-action btn-outline"
                    onClick={() => window.open(`https://ipfs.io/ipfs/${up.cid}`, '_blank')}
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
            <button
              className="btn-action btn-primary-green"
              onClick={refreshBackendAccessStatus}
              style={{ marginBottom: "1rem" }}
            >
              Refresh Access Status
            </button>

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
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {u.cid.slice(0, 18)}…
                    </td>
                    <td>{u.date}</td>
                    <td>
                      <span className={`status-pill ${u.accessStatus === 'granted' ? 'status-green' : 'status-amber'}`}>
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
       