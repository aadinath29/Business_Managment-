import { useState, useEffect, useMemo } from 'react';
import { branchStore } from '../store/branchStore';

export function useBranches() {
  const [state, setState] = useState(branchStore.getState());

  useEffect(() => {
    const unsubscribe = branchStore.subscribe((newState) => {
      setState(newState);
    });
    
    // Initial fetch if list is empty
    if (state.branches.length === 0 && !state.loading) {
      branchStore.fetchBranches();
    }
    
    return unsubscribe;
  }, []);

  // Filter out any Archived branches (defensive)
  const activeBranches = useMemo(() => {
    return state.branches.filter(b => {
      if (!b || typeof b !== 'object' || !b.id) {
        return false;
      }
      return b.status !== 'Archived';
    });
  }, [state.branches]);

  const selectedBranch = useMemo(() => {
    return activeBranches.find(b => b.id === state.selectedBranchId) || null;
  }, [activeBranches, state.selectedBranchId]);

  return {
    branches: activeBranches, // Already filtered/searched by the backend
    selectedBranchId: state.selectedBranchId,
    selectedBranch,
    allRawBranches: activeBranches,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    selectBranch: branchStore.selectBranch,
    setSearch: branchStore.setSearch, // Re-route to store search action with debounce
    createBranch: branchStore.createBranch,
    updateBranch: branchStore.updateBranch,
    deleteBranch: branchStore.deleteBranch,
    refreshBranches: branchStore.fetchBranches
  };
}
