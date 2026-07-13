import React, { createContext, useContext, useState, useEffect } from 'react';
import { branchApi } from '../services/api/branchApi';
import { useAuth } from './AuthContext';

const BranchContext = createContext(undefined);

export function BranchProvider({ children }) {
  const { role, branch: authBranch } = useAuth();
  const [branches, setBranches] = useState([]);
  
  // If TL or BM, ignore local storage and force their branch
  const [currentBranchId, setCurrentBranchIdState] = useState(() => {
    if (role === 'team_leader' || role === 'branch_manager') return authBranch;
    return localStorage.getItem('kosqu_current_branch_id') || 'all';
  });
  const [loading, setLoading] = useState(true);

  // Sync branch if role changes
  useEffect(() => {
    if (role === 'team_leader' || role === 'branch_manager') {
      setCurrentBranchIdState(authBranch);
    }
  }, [role, authBranch]);

  useEffect(() => {
    let active = true;
    // Fetch all active branches for selection lists (we set page limit high to get all)
    branchApi.getBranches({ limit: 100 }).then((res) => {
      if (active && res.success) {
        setBranches(res.data);
        setLoading(false);
      }
    }).catch(err => {
      console.error('BranchProvider: Error loading dropdown branches', err);
      if (active) setLoading(false);
    });
    
    return () => {
      active = false;
    };
  }, []);

  const setCurrentBranchId = (id) => {
    if (role === 'team_leader' || role === 'branch_manager') return; // TL and BM cannot change branch
    setCurrentBranchIdState(id);
    localStorage.setItem('kosqu_current_branch_id', id);
  };

  const refreshBranches = async () => {
    try {
      const res = await branchApi.getBranches({ limit: 100 });
      if (res.success) {
        setBranches(res.data);
      }
    } catch (err) {
      console.error('BranchProvider: Error refreshing branches list', err);
    }
  };

  const currentBranch = currentBranchId === 'all'
    ? { id: 'all', name: 'All Branches' }
    : branches.find(b => b.id === currentBranchId) || { id: 'all', name: 'All Branches' };

  return (
    <BranchContext.Provider
      value={{
        currentBranchId,
        setCurrentBranchId,
        branches,
        currentBranch,
        loading,
        refreshBranches
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
