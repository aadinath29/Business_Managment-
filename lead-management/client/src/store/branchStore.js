import { branchApi } from '../services/api/branchApi';

let state = {
  branches: [],
  selectedBranchId: '',
  loading: false,
  error: null,
  filters: {
    search: ''
  },
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

const listeners = new Set();
let searchTimeout = null;

export const branchStore = {
  getState: () => state,
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setState: (updater) => {
    const nextState = typeof updater === 'function' ? updater(state) : updater;
    state = { ...state, ...nextState };
    listeners.forEach(l => l(state));
  },
  
  // Actions
  selectBranch: (id) => {
    branchStore.setState({ selectedBranchId: id });
  },

  setSearch: (search) => {
    branchStore.setState(prev => ({
      filters: { ...prev.filters, search },
      page: 1 // Reset to first page on search
    }));

    // Debounced search triggers fetchBranches
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      branchStore.fetchBranches();
    }, 350);
  },

  fetchBranches: async () => {
    branchStore.setState({ loading: true, error: null });
    try {
      const { filters, page, limit } = state;
      const queryParams = {
        page,
        limit,
        search: filters.search || undefined,
        sortBy: 'created_at',
        sortOrder: 'DESC'
      };

      const res = await branchApi.getBranches(queryParams);

      branchStore.setState(prev => {
        const activeList = res.data.filter(b => b.status !== 'Archived');
        const defaultId = activeList.length > 0 ? activeList[0].id : '';
        const prevSelectedExists = prev.selectedBranchId && activeList.some(b => b.id === prev.selectedBranchId);
        
        return {
          branches: res.data,
          total: res.pagination?.total || res.data.length,
          totalPages: res.pagination?.totalPages || 1,
          selectedBranchId: prevSelectedExists ? prev.selectedBranchId : defaultId,
          loading: false
        };
      });
    } catch (err) {
      console.error('branchStore: Error fetching branches', err);
      const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to fetch branches';
      branchStore.setState({ error: errorMsg, loading: false });
    }
  },
  
  createBranch: async (branchData) => {
    branchStore.setState({ loading: true, error: null });
    try {
      const response = await branchApi.createBranch(branchData);
      const newBranch = response.data;
      
      // Refetch branches to get updated list and pagination
      await branchStore.fetchBranches();
      
      // Auto-select the newly created branch
      branchStore.setState({ selectedBranchId: newBranch.id });
      return newBranch;
    } catch (err) {
      console.error('branchStore: Error creating branch', err);
      const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to create branch';
      branchStore.setState({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  updateBranch: async (id, branchData) => {
    branchStore.setState({ loading: true, error: null });
    try {
      const response = await branchApi.updateBranch(id, branchData);
      const updated = response.data;
      
      await branchStore.fetchBranches();
      
      // Preserve selection
      branchStore.setState({ selectedBranchId: id });
      return updated;
    } catch (err) {
      console.error('branchStore: Error updating branch', err);
      const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to update branch';
      branchStore.setState({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  deleteBranch: async (id) => {
    branchStore.setState({ loading: true, error: null });
    try {
      await branchApi.deleteBranch(id);
      
      await branchStore.fetchBranches();
    } catch (err) {
      console.error('branchStore: Error deleting branch', err);
      const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to delete branch';
      branchStore.setState({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  }
};
