import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBranches } from '../../hooks/useBranches';
import { BranchStats } from '../../components/branches/BranchStats';
import { BranchSidebar } from '../../components/branches/BranchSidebar';
import { BranchDetails } from '../../components/branches/BranchDetails';
import { BranchFormDrawer } from '../../components/branches/BranchFormDrawer';
import { DeleteBranchDialog } from '../../components/branches/DeleteBranchDialog';
import { Button } from '../../components/UI/Button';
import { Plus } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';

export function BranchesPage() {
  const {
    branches,
    selectedBranchId,
    selectedBranch,
    allRawBranches,
    loading,
    error,
    filters,
    selectBranch,
    setSearch,
    createBranch,
    updateBranch,
    deleteBranch,
    refreshBranches
  } = useBranches();

  const { role, branch: userBranch } = useAuth();
  const { branchId } = useParams();
  const navigate = useNavigate();

  // Security Interception & State Sync (URL parameter -> Store selected branch)
  useEffect(() => {
    if (role === 'team_leader' || role === 'branch_manager') {
      if (branchId !== userBranch) {
        // Prevent manual URL traversal or missing branchId
        navigate(`/branches/${userBranch}`, { replace: true });
      } else if (selectedBranchId !== userBranch) {
        // Auto-select assigned branch
        selectBranch(userBranch);
      }
    } else if (role === 'admin') {
      if (!branchId) {
        const activeList = branches.filter(b => b.status !== 'Archived');
        const defaultId = activeList.length > 0 ? activeList[0].id : 'kosqu';
        navigate(`/branches/${defaultId}`, { replace: true });
      } else if (branchId !== selectedBranchId) {
        selectBranch(branchId);
      }
    }
  }, [role, branchId, userBranch, selectedBranchId, selectBranch, navigate, branches]);

  const { refreshBranches: refreshGlobalContextBranches } = useBranch();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleCreateTrigger = () => {
    setEditingBranch(null);
    setIsDrawerOpen(true);
  };

  const handleEditTrigger = (branch) => {
    setEditingBranch(branch);
    setIsDrawerOpen(true);
  };

  const handleDeleteTrigger = (branch) => {
    setBranchToDelete(branch);
    setIsDeleteOpen(true);
  };

  const handleDrawerSubmit = async (data) => {
    if (editingBranch) {
      await updateBranch(editingBranch.id, data);
    } else {
      const newBranch = await createBranch(data);
      if (newBranch && newBranch.id) {
        navigate(`/branches/${newBranch.id}`, { replace: true });
      }
    }
    setIsDrawerOpen(false);
    refreshGlobalContextBranches(); // Sync top global bar selector dropdown
  };

  const handleDeleteConfirm = async () => {
    if (branchToDelete) {
      await deleteBranch(branchToDelete.id);
      setIsDeleteOpen(false);
      refreshGlobalContextBranches();

      const activeList = branches.filter(b => b.id !== branchToDelete.id && b.status !== 'Archived');
      const defaultId = activeList.length > 0 ? activeList[0].id : '';
      navigate(`/branches/${defaultId}`, { replace: true });
    }
  };

  return (
    <div className="space-y-5 flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{role === 'team_leader' ? 'My Branch' : 'Branches Workspace'}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {role === 'team_leader' ? 'View and manage your assigned branch details.' : 'Manage all company branches, managers, targets and performance indicators.'}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {role === 'admin' && (
            <Button
              variant="outline"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex-1 sm:flex-none justify-center text-xs"
            >
              Select Branch
            </Button>
          )}
          {role === 'admin' && (
            <Button
              onClick={handleCreateTrigger}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 cursor-pointer shrink-0 shadow-sm flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Create Branch
            </Button>
          )}
        </div>
      </div>

      {/* 2. Stats Grid Summary (Admin Only) */}
      {role === 'admin' && (
        <div className="shrink-0">
          <BranchStats branches={allRawBranches} />
        </div>
      )}

      {/* 3. Split View Workspace (Gmail/Outlook style) */}
      <div className="flex-1 flex gap-6 overflow-hidden items-stretch min-h-0 relative">
        {/* Left Side Backdrop for mobile */}
        {mobileSidebarOpen && role === 'admin' && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Left Side: Branch selector list (Admin Only) */}
        {role === 'admin' && (
          <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0 bg-white shadow-2xl p-4 w-72' : '-translate-x-full'
            } lg:flex lg:p-0 lg:w-auto shrink-0 lg:bg-transparent lg:shadow-none`}>
            <BranchSidebar
              branches={branches}
              selectedBranchId={selectedBranchId}
              onSelectBranch={(id) => {
                setMobileSidebarOpen(false); // Close mobile drawer
                if (id !== branchId) {
                  navigate(`/branches/${id}`, { replace: true });
                }
              }}
              searchQuery={filters.search}
              onSearchChange={setSearch}
            />
          </div>
        )}

        {/* Right Side: Dynamically loaded details */}
        <div className="flex-1 overflow-y-auto">
          <BranchDetails
            branch={selectedBranch}
            onEdit={handleEditTrigger}
            onDelete={handleDeleteTrigger}
          />
        </div>
      </div>

      {/* Side Slide-in Drawer Form for Add/Edit */}
      <BranchFormDrawer
        branch={editingBranch}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleDrawerSubmit}
      />

      {/* Soft-delete confirmation warnings */}
      <DeleteBranchDialog
        isOpen={isDeleteOpen}
        branch={branchToDelete}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

    </div>
  );
}
