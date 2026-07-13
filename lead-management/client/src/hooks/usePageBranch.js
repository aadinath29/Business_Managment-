import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';

export function usePageBranch(pageKey) {
  const { role, branch: authBranch } = useAuth();
  const { branches } = useBranch();

  const [currentBranchId, setCurrentBranchIdState] = useState(() => {
    if (role === 'team_leader' || role === 'branch_manager') return authBranch;
    const saved = sessionStorage.getItem(`branch_${pageKey}`);
    return saved || 'all';
  });

  useEffect(() => {
    if (role === 'team_leader' || role === 'branch_manager') {
      setCurrentBranchIdState(authBranch);
    }
  }, [role, authBranch]);

  const setCurrentBranchId = (id) => {
    if (role === 'team_leader' || role === 'branch_manager') return;
    setCurrentBranchIdState(id);
    sessionStorage.setItem(`branch_${pageKey}`, id);
  };

  const currentBranch = currentBranchId === 'all'
    ? { id: 'all', name: 'All Branches' }
    : branches.find(b => b.id === currentBranchId) || { id: 'all', name: 'All Branches' };

  return {
    currentBranchId,
    setCurrentBranchId,
    branches,
    currentBranch
  };
}

