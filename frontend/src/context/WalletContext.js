import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import ABI from '../contracts/HealthWalletABI.json';
const  CONTRACT_ADDRESS = "0xe9d9739a3797C747761610345840859B0C0e8ff2";
const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount]   = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner]     = useState(null);
  const [network, setNetwork]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [role, setRole]         = useState(null);

  // Shared access state — both dashboards read this
  const [accessMap, setAccessMap] = useState({});
  // accessMap looks like: { "0": { "0xProviderAddr": true }, "1": { "0xProviderAddr": false } }

  // Get contract instance (needs signer for write, provider for read)
  const getContract = useCallback((signerOrProvider) => {
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
  }, []);

  // Check access for a specific doc + provider, update shared state
  const refreshAccess = useCallback(async (docId, providerAddress, ethProvider) => {
    try {
      const contract = getContract(ethProvider);
      const hasAccess = await contract.checkAccess(docId, providerAddress);
      setAccessMap(prev => ({
        ...prev,
        [docId]: { ...(prev[docId] || {}), [providerAddress]: hasAccess }
      }));
      return hasAccess;
    } catch (err) {
      console.error('checkAccess failed:', err);
      return false;
    }
  }, [getContract]);

  // Grant access — called from Patient dashboard
 const grantAccess = async (docId, provider) => {
  const tx = await contract.grantAccess(docId, provider);
  await tx.wait();
};

  // Revoke access — called from Patient dashboard
  const revokeAccess = async (docId, provider) => {
  const tx = await contract.revokeAccess(docId, provider);
  await tx.wait();
};

  const connectWallet = useCallback(async (selectedRole) => {
    setError(null);
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error('MetaMask not found. Please install it.');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const ethSigner   = await ethProvider.getSigner();
      const net         = await ethProvider.getNetwork();
      setAccount(accounts[0]);
      setProvider(ethProvider);
      setSigner(ethSigner);
      setNetwork(net);
      setRole(selectedRole);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null); setProvider(null); setSigner(null);
    setNetwork(null); setRole(null); setError(null);
    setAccessMap({});
  }, []);

  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) disconnectWallet();
      else setAccount(accounts[0]);
    });
  }



  const addDocument = useCallback(async (patientAddress, cid) => {
  if (!signer) throw new Error("Wallet not connected");

  const contract = getContract(signer);

  const currentCount = await contract.documentCount();
  const tx = await contract.addDocument(patientAddress, cid);
  await tx.wait();

  return Number(currentCount);
}, [signer, getContract]);


    const value = {
    account,
    provider,
    signer,
    network,
    loading,
    error,
    role,
    accessMap,
    grantAccess,
    revokeAccess,
    refreshAccess,
    addDocument,
    connectWallet,
    disconnectWallet,
    isConnected: !!account,
  };

 /* return Number(currentCount);
}, [signer, getContract]);
*/
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}