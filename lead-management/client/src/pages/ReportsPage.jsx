import React, { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import {
  Download, AlertCircle, Building2, TrendingUp,
  Users, Target, XCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../services/api/reportsApi';
import { formatCurrency } from '../utils/currency';

export function ReportsPage() {
  const { backendRole } = useAuth();
  const [snapshotData, setSnapshotData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsApi.getBranchSnapshot();
      setSnapshotData(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (backendRole === 'SUPER_ADMIN') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [backendRole]);

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      await reportsApi.downloadBranchSnapshotExcel();
    } catch (err) {
      alert('Failed to download Excel report: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  if (backendRole !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-100 mt-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">The reports module is restricted to Super Administrators.</p>
      </div>
    );
  }

  // Compute summary totals
  const totals = snapshotData.reduce(
    (acc, row) => ({
      totalLeads: acc.totalLeads + (row.total_leads || 0),
      wonLeads: acc.wonLeads + (row.won_leads || 0),
      lostLeads: acc.lostLeads + (row.lost_leads || 0),
      wonRevenue: acc.wonRevenue + parseFloat(row.won_revenue || 0),
    }),
    { totalLeads: 0, wonLeads: 0, lostLeads: 0, wonRevenue: 0 }
  );

  const overallConversion = totals.totalLeads > 0
    ? ((totals.wonLeads / totals.totalLeads) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Snapshot Report</h1>
          <p className="text-sm text-gray-500 mt-1">Live management overview of all branch metrics.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleDownloadExcel}
            disabled={downloading || snapshotData.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all ${
              downloading || snapshotData.length === 0
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>{downloading ? 'Exporting...' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-red-800 font-medium">Error loading report</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && snapshotData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{totals.totalLeads}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Won Revenue</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(totals.wonRevenue)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Closed Lost</p>
                <p className="text-2xl font-bold text-red-600">{totals.lostLeads}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{overallConversion}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Desktop Table View */}
      <Card className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Branch</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Manager</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Leads</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Closed Won</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Closed Lost</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Conversion %</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Won Revenue</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Teams (Devs)</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">Loading branch data...</p>
                  </div>
                </td>
              </tr>
            ) : snapshotData.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                  No branch data available.
                </td>
              </tr>
            ) : (
              snapshotData.map((row) => {
                const conversion = row.total_leads > 0
                  ? ((row.won_leads / row.total_leads) * 100).toFixed(1)
                  : '0.0';
                return (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{row.branch_name}</div>
                          {(row.city || row.state) && (
                            <div className="text-xs text-gray-500">{[row.city, row.state].filter(Boolean).join(', ')}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {row.manager_name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {row.total_leads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 text-right">
                      {row.won_leads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-500 text-right">
                      {row.lost_leads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-bold ${parseFloat(conversion) >= 50 ? 'text-emerald-600' : parseFloat(conversion) >= 25 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {conversion}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-right">
                      {formatCurrency(row.won_revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        {row.teams_count} ({row.developers_count})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={row.status === 'Active' ? 'success' : 'secondary'}>
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {loading ? (
          <Card className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Loading branch data...</p>
            </div>
          </Card>
        ) : snapshotData.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">No branch data available.</Card>
        ) : (
          snapshotData.map((row) => {
            const conversion = row.total_leads > 0
              ? ((row.won_leads / row.total_leads) * 100).toFixed(1)
              : '0.0';
            return (
              <Card key={row.id} className="p-4 space-y-3 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{row.branch_name}</h3>
                      <p className="text-xs text-gray-500">{row.manager_name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <Badge variant={row.status === 'Active' ? 'success' : 'secondary'}>
                    {row.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-gray-100 pt-3">
                  <div className="flex flex-col">
                    <span className="text-gray-500">Total Leads</span>
                    <span className="font-bold text-gray-900 text-base">{row.total_leads}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-gray-500">Conversion</span>
                    <span className="font-bold text-purple-600 text-base">{conversion}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">Closed Won</span>
                    <span className="font-semibold text-emerald-600">{row.won_leads}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-gray-500">Closed Lost</span>
                    <span className="font-semibold text-red-500">{row.lost_leads}</span>
                  </div>
                  <div className="flex flex-col col-span-2 border-t border-gray-100 pt-2">
                    <span className="text-gray-500">Won Revenue</span>
                    <span className="font-bold text-emerald-600 text-base">{formatCurrency(row.won_revenue)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">Teams (Devs)</span>
                    <span className="font-semibold text-gray-700">{row.teams_count} ({row.developers_count})</span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
