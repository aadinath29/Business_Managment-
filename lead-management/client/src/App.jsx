import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { LeadsPage } from './pages/LeadsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { TeamsPage } from './pages/TeamsPage';
import { TeamsIndex } from './pages/TeamsIndex';
import { TeamLeaderDetails } from './pages/TeamLeaderDetails';
import { LeadWorkspace } from './pages/LeadWorkspace';
import { DeveloperWorkspace } from './pages/DeveloperWorkspace';
import { ReportsPage } from './pages/ReportsPage';
import { BranchesPage } from './pages/Branches/BranchesPage';
import { AccountingDashboard } from './pages/Accounting/AccountingDashboard';
import { AccountingLeadDetail } from './pages/Accounting/AccountingLeadDetail';
import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { BranchProvider } from './context/BranchContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import { RoleBasedRoute } from './components/Layout/RoleBasedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="/" element={<ProtectedRoute><BranchProvider><AppLayout /></BranchProvider></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="leads" element={<LeadsPage />} />

            <Route path="teams">
              <Route index element={
                <RoleBasedRoute allowedRoles={['admin', 'branch_manager', 'team_leader']}>
                  <TeamsIndex />
                </RoleBasedRoute>
              } />
              <Route path=":teamLeaderId" element={
                <RoleBasedRoute allowedRoles={['admin', 'branch_manager', 'team_leader']}>
                  <TeamLeaderDetails />
                </RoleBasedRoute>
              } />
              <Route path=":teamLeaderId/leads/:leadId" element={
                <RoleBasedRoute allowedRoles={['admin', 'branch_manager', 'team_leader']}>
                  <LeadWorkspace />
                </RoleBasedRoute>
              } />
              <Route path=":teamLeaderId/leads/:leadId/developers/:developerId" element={
                <RoleBasedRoute allowedRoles={['admin', 'branch_manager', 'team_leader']}>
                  <DeveloperWorkspace />
                </RoleBasedRoute>
              } />
            </Route>

            <Route path="reports" element={<ReportsPage />} />
            <Route path="branches/:branchId?" element={<BranchesPage />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />

            {/* Accounting Routes */}
            <Route path="accounting">
              <Route index element={<AccountingDashboard />} />
              <Route path=":id" element={<AccountingLeadDetail />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
