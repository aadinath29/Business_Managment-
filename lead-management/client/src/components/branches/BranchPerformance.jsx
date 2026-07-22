import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../UI/Card';
import { formatCurrency } from '../../utils/currency';
import { calculateAchievementPercentage } from '../../utils/branchCalculations';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import { dashboardApi } from '../../services/api/dashboardApi';
import { branchApi } from '../../services/api/branchApi';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { useAuth } from '../../context/AuthContext';
import { Edit2 } from 'lucide-react';

export function BranchPerformance({ branch }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingTargets, setSavingTargets] = useState(false);
  const [financialYear, setFinancialYear] = useState('');
  const [formData, setFormData] = useState({
    q1Target: 0,
    q2Target: 0,
    q3Target: 0,
    q4Target: 0,
    q1Achieved: null,
    q2Achieved: null,
    q3Achieved: null,
    q4Achieved: null
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { user, role, backendRole } = useAuth();
  const currentRole = backendRole || role || (user && user.role);
  const canEditTargets = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN' || currentRole === 'BRANCH_MANAGER';

  // Left card calculation
  const achievement = calculateAchievementPercentage(branch.achievedTarget, branch.assignedTarget);
  const remaining = Math.max(branch.assignedTarget - branch.achievedTarget, 0);

  const getTargetStatus = (pct) => {
    if (pct >= 90) return { label: 'Excellent Performance', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 70) return { label: 'Good Growth', style: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (pct >= 40) return { label: 'Average Pipeline', style: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Needs Improvement', style: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const status = getTargetStatus(achievement);

  const fetchData = async () => {
    if (!branch || !branch.id) return;
    try {
      setLoading(true);
      const res = await dashboardApi.getQuarterlyPerformance({ branchId: branch.id });
      setData(res);
      if (res.length > 0) {
        setFinancialYear(res[0].financialYear);
      }
    } catch (err) {
      console.error('Failed to load quarterly performance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branch]);

  const handleEditClick = async () => {
    if (!financialYear) return;
    try {
      const res = await branchApi.getQuarterlyTargets(branch.id, financialYear);
      if (res.success && res.data) {
        setFormData({
          q1Target: res.data.q1_target || 0,
          q2Target: res.data.q2_target || 0,
          q3Target: res.data.q3_target || 0,
          q4Target: res.data.q4_target || 0,
          q1Achieved: res.data.q1_achieved !== null ? res.data.q1_achieved : null,
          q2Achieved: res.data.q2_achieved !== null ? res.data.q2_achieved : null,
          q3Achieved: res.data.q3_achieved !== null ? res.data.q3_achieved : null,
          q4Achieved: res.data.q4_achieved !== null ? res.data.q4_achieved : null,
        });
      } else {
        // Defaults if no explicit targets exist yet
        const defaultQ = 0;
        setFormData({
          q1Target: defaultQ,
          q2Target: defaultQ,
          q3Target: defaultQ,
          q4Target: defaultQ,
          q1Achieved: null,
          q2Achieved: null,
          q3Achieved: null,
          q4Achieved: null
        });
      }
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch explicit targets', error);
      showToast('Failed to load targets', 'error');
    }
  };

  const handleSaveTargets = async (e) => {
    e.preventDefault();
    try {
      setSavingTargets(true);
      await branchApi.updateQuarterlyTargets(branch.id, {
        financialYear,
        ...formData
      });
      showToast('Targets updated successfully');
      setIsEditModalOpen(false);
      fetchData(); // Refresh the chart
    } catch (error) {
      console.error('Failed to update targets', error);
      showToast(error.response?.data?.message || 'Failed to update targets', 'error');
    } finally {
      setSavingTargets(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = Number(value);
    if (value === '') {
      finalValue = name.includes('Achieved') ? null : 0;
    }
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const getBarColor = (itemStatus) => {
    switch (itemStatus) {
      case 'Exceeded Target':
      case 'On Track': return '#10B981'; // Green
      case 'Needs Attention': return '#F59E0B'; // Orange
      case 'Below Target': return '#EF4444'; // Red
      default: return '#3B82F6'; // Default Blue
    }
  };

  const getStatusIndicator = (itemStatus) => {
    switch (itemStatus) {
      case 'Exceeded Target': return '🟢 Exceeded Target';
      case 'On Track': return '🟢 On Track';
      case 'Needs Attention': return '🟠 Needs Attention';
      case 'Below Target': return '🔴 Below Target';
      default: return '⚪ Unknown';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-xs">
          <p className="font-bold text-gray-800 mb-2 border-b pb-1">{label} ({dataPoint.financialYear})</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Target:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(dataPoint.target)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Achieved:</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(dataPoint.achieved)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Remaining:</span>
              <span className="font-semibold text-rose-600">{formatCurrency(dataPoint.remaining)}</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t mt-1">
              <span className="text-gray-500">Achievement:</span>
              <span className="font-bold">{dataPoint.achievementPercentage}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Growth:</span>
              <span className={`font-bold ${dataPoint.growthPercentage >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {dataPoint.growthPercentage !== null ? (dataPoint.growthPercentage > 0 ? '+' : '') + dataPoint.growthPercentage + '%' : '—'}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t mt-1">
              <span className="text-gray-500">Won Leads:</span>
              <span className="font-semibold text-gray-900">{dataPoint.wonLeads}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Lost Leads:</span>
              <span className="font-semibold text-gray-900">{dataPoint.lostLeads}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Target Progress Card */}
      <Card className="md:col-span-1">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex justify-between items-start">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target Accomplishment</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${status.style}`}>{status.label}</span>
            </div>
            
            {/* Circular Progress Widget using SVG */}
            <div className="flex justify-center py-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-gray-100 fill-transparent" 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="50" cy="50" r="40" 
                    className={`fill-transparent transition-all duration-700 ${
                      achievement >= 90 ? 'stroke-emerald-500' :
                      achievement >= 70 ? 'stroke-blue-500' :
                      achievement >= 40 ? 'stroke-amber-500' :
                      'stroke-rose-500'
                    }`} 
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * Math.min(achievement, 100)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-bold font-mono text-gray-900 block">{achievement}%</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Ratio</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs space-y-1.5 border-t border-gray-100 pt-3">
            <div className="flex justify-between text-gray-500">
              <span>Goal Target:</span>
              <span className="font-semibold text-gray-800 font-mono">{formatCurrency(branch.assignedTarget)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Achieved:</span>
              <span className="font-semibold text-gray-800 font-mono">{formatCurrency(branch.achievedTarget)}</span>
            </div>
            <div className="flex justify-between text-gray-500 border-t border-dashed pt-1.5">
              <span>Remaining:</span>
              <span className="font-semibold text-rose-600 font-mono">{formatCurrency(remaining)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Performance Overview */}
      <Card className="md:col-span-2 flex flex-col h-full">
        <CardContent className="p-4 flex flex-col h-full space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 shrink-0">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Quarterly Performance Overview
            </h4>
            <div className="flex items-center space-x-2">
              {data.length > 0 && (
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  {data[0].financialYear}
                </span>
              )}
              {canEditTargets && data.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 text-[10px] px-2 py-0"
                  onClick={handleEditClick}
                >
                  <Edit2 className="w-3 h-3 mr-1" /> Edit Targets
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : data.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-gray-500 italic">
                No quarterly performance available for this financial year.
              </div>
            ) : (
              <>
                <div className="h-44 w-full mb-4 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="quarter" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => {
                          const labels = { Q1: 'Q1 (Apr-Jun)', Q2: 'Q2 (Jul-Sep)', Q3: 'Q3 (Oct-Dec)', Q4: 'Q4 (Jan-Mar)' };
                          return labels[val] || val;
                        }}
                      />
                      <YAxis hide domain={[0, 'dataMax']} />
                      <RechartsTooltip 
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                      />
                      <Bar dataKey="target" name="Target" fill="#3B82F6" radius={[2, 2, 0, 0]} barSize={24} />
                      <Bar dataKey="achieved" name="Achieved" radius={[2, 2, 0, 0]} barSize={24}>
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg shrink-0">
                  <table className="w-full text-left text-[10px] text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2">Quarter</th>
                        <th className="px-3 py-2">Target</th>
                        <th className="px-3 py-2">Achieved</th>
                        <th className="px-3 py-2">Remaining</th>
                        <th className="px-3 py-2 text-center">Ach%</th>
                        <th className="px-3 py-2 text-center">Growth</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white font-medium">
                      {data.map((row) => (
                        <tr key={row.quarter} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 font-bold text-gray-900">{row.quarter}</td>
                          <td className="px-3 py-2 font-mono">{formatCurrency(row.target)}</td>
                          <td className="px-3 py-2 font-mono">{formatCurrency(row.achieved)}</td>
                          <td className="px-3 py-2 font-mono">{formatCurrency(row.remaining)}</td>
                          <td className="px-3 py-2 text-center">{row.achievementPercentage}%</td>
                          <td className={`px-3 py-2 text-center font-bold ${row.growthPercentage > 0 ? 'text-emerald-600' : row.growthPercentage < 0 ? 'text-rose-600' : 'text-gray-500'}`}>
                            {row.growthPercentage !== null ? (row.growthPercentage > 0 ? '+' : '') + row.growthPercentage + '%' : '—'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{getStatusIndicator(row.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Targets Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Quarterly Targets (${financialYear})`}
      >
        <form onSubmit={handleSaveTargets} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quarter 1 (Apr-Jun)</h5>
              <Input
                label="Target Amount"
                type="number"
                name="q1Target"
                value={formData.q1Target}
                onChange={handleChange}
                min="0"
                required
              />
              <Input
                label="Achieved Override (Optional)"
                type="number"
                name="q1Achieved"
                value={formData.q1Achieved === null ? '' : formData.q1Achieved}
                onChange={handleChange}
                min="0"
                placeholder="Auto calculated"
              />
            </div>
            
            <div className="space-y-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quarter 2 (Jul-Sep)</h5>
              <Input
                label="Target Amount"
                type="number"
                name="q2Target"
                value={formData.q2Target}
                onChange={handleChange}
                min="0"
                required
              />
              <Input
                label="Achieved Override (Optional)"
                type="number"
                name="q2Achieved"
                value={formData.q2Achieved === null ? '' : formData.q2Achieved}
                onChange={handleChange}
                min="0"
                placeholder="Auto calculated"
              />
            </div>
            
            <div className="space-y-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quarter 3 (Oct-Dec)</h5>
              <Input
                label="Target Amount"
                type="number"
                name="q3Target"
                value={formData.q3Target}
                onChange={handleChange}
                min="0"
                required
              />
              <Input
                label="Achieved Override (Optional)"
                type="number"
                name="q3Achieved"
                value={formData.q3Achieved === null ? '' : formData.q3Achieved}
                onChange={handleChange}
                min="0"
                placeholder="Auto calculated"
              />
            </div>
            
            <div className="space-y-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quarter 4 (Jan-Mar)</h5>
              <Input
                label="Target Amount"
                type="number"
                name="q4Target"
                value={formData.q4Target}
                onChange={handleChange}
                min="0"
                required
              />
              <Input
                label="Achieved Override (Optional)"
                type="number"
                name="q4Achieved"
                value={formData.q4Achieved === null ? '' : formData.q4Achieved}
                onChange={handleChange}
                min="0"
                placeholder="Auto calculated"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4">
            <span className="text-sm font-medium text-blue-800">Total Yearly Target</span>
            <span className="text-lg font-bold font-mono text-blue-900">
              {formatCurrency(formData.q1Target + formData.q2Target + formData.q3Target + formData.q4Target)}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={savingTargets}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={savingTargets}
            >
              {savingTargets ? 'Saving...' : 'Save Targets'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 px-6 py-3 rounded shadow-lg z-[9999] text-white flex items-center font-medium ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'} transition-opacity duration-300`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
