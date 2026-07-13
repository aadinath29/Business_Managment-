import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Calculator } from 'lucide-react';
import { leadsApi } from '../../services/api/leadsApi';
import { usePageBranch } from '../../hooks/usePageBranch';
import { PageBranchSelector } from '../../components/UI/PageBranchSelector';

export function AccountingDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const { currentBranchId, setCurrentBranchId, branches, currentBranch } = usePageBranch('accounting');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const data = await leadsApi.getAccountingDashboard(
          currentBranchId !== 'all' ? { branchId: currentBranchId } : undefined
        );
        let activeLeads = data || [];
        // Filtering locally in case backend doesn't support the param
        if (currentBranchId !== 'all') {
          activeLeads = activeLeads.filter(l => l.branchId === currentBranchId);
        }
        setLeads(activeLeads);
      } catch (err) {
        console.error('Failed to fetch leads for accounting dashboard:', err);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [currentBranchId]);

  const getStageBadgeVariant = (stage) => {
    switch (stage) {
      case 'Paid': return 'success';
      case 'Unpaid': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calculator className="w-6 h-6 mr-3 text-blue-600" />
            Lead Accounting
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track accounting records for your leads.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <PageBranchSelector 
            currentBranchId={currentBranchId}
            setCurrentBranchId={setCurrentBranchId}
            branches={branches}
            currentBranch={currentBranch}
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="3" className="px-6 py-12 text-center text-gray-500">Loading leads...</td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-12 text-center text-gray-500">No leads found.</td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/accounting/${lead.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.branchName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStageBadgeVariant(lead.status)}>{lead.status}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{lead.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{lead.remainingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.dueDate !== '-' ? new Date(lead.dueDate).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Mobile Card View (For responsiveness like LeadsPage) */}
      <div className="block md:hidden space-y-4">
        {loading ? (
           <Card className="p-6 text-center text-gray-500">Loading leads...</Card>
        ) : leads.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">No leads found.</Card>
        ) : (
          leads.map((lead) => (
            <Card key={lead.id} className="p-4 hover:shadow-md transition-shadow relative space-y-3 border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <Link to={`/accounting/${lead.id}`} className="text-base font-semibold text-blue-600 hover:underline">
                    {lead.name}
                  </Link>
                  <p className="text-sm text-gray-500 mt-0.5">{lead.branchName || '-'}</p>
                </div>
                <Badge variant={getStageBadgeVariant(lead.status)}>{lead.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-50">
                <div>
                  <span className="text-gray-500 block text-xs">Total Amount</span>
                  <span className="font-medium">₹{lead.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Remaining Amount</span>
                  <span className="font-medium text-blue-600">₹{lead.remainingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block text-xs">Due Date</span>
                  <span className="font-medium text-gray-700">{lead.dueDate !== '-' ? new Date(lead.dueDate).toLocaleDateString() : '-'}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
