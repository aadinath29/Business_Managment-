import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';
import { formatCurrency } from '../../utils/currency';

export function LeadStatusModal({ isOpen, onClose, mode, teamLeaders, onSubmit }) {
  const [formData, setFormData] = useState({
    phaseLostAt: 'Qualification',
    dateLost: new Date().toISOString().split('T')[0],
    reason: '',
    rootCause: '',
    accountablePersonId: '',
    lostAmount: '',
    competitorName: '',
    successReason: '',
    revenueGenerated: '',
    profit: '',
    customerSatisfactionRating: '95',
    wouldRecommend: true
  });

  const [displayAmount, setDisplayAmount] = useState('');
  const [displayRevenue, setDisplayRevenue] = useState('');
  const [displayProfit, setDisplayProfit] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        phaseLostAt: 'Qualification',
        dateLost: new Date().toISOString().split('T')[0],
        reason: '',
        rootCause: '',
        accountablePersonId: teamLeaders[0]?.id || '',
        lostAmount: '',
        competitorName: '',
        successReason: '',
        revenueGenerated: '',
        profit: '',
        customerSatisfactionRating: '95',
        wouldRecommend: true
      });
      setDisplayAmount('');
      setDisplayRevenue('');
      setDisplayProfit('');
    }
  }, [isOpen, teamLeaders]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLostAmountChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, lostAmount: rawVal }));
    setDisplayAmount(rawVal);
  };

  const handleRevenueChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, revenueGenerated: rawVal }));
    setDisplayRevenue(rawVal);
  };

  const handleProfitChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, profit: rawVal }));
    setDisplayProfit(rawVal);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const resultDetails = mode === 'Lost' ? {
      phaseLostAt: formData.phaseLostAt,
      dateLost: formData.dateLost,
      reason: formData.reason,
      rootCause: formData.rootCause,
      accountablePersonId: formData.accountablePersonId,
      lostAmount: Number(formData.lostAmount) || 0,
      competitorName: formData.competitorName
    } : {
      successReason: formData.successReason,
      revenueGenerated: Number(formData.revenueGenerated) || 0,
      profit: Number(formData.profit) || 0,
      customerSatisfactionRating: Number(formData.customerSatisfactionRating) || 100,
      wouldRecommend: formData.wouldRecommend
    };
    onSubmit(resultDetails);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'Lost' ? 'Log Lead Loss Accountability' : 'Record Deal Success'}
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        
        {mode === 'Lost' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select 
                label="Phase Lost At"
                name="phaseLostAt"
                value={formData.phaseLostAt}
                onChange={handleChange}
                options={[
                  { label: 'Phase 1: Qualification', value: 'Qualification' },
                  { label: 'Phase 2: Discovery', value: 'Discovery' },
                  { label: 'Phase 3: Solution Proposal', value: 'Proposal' },
                  { label: 'Phase 4: Project Execution', value: 'Project' },
                  { label: 'Phase 5: Delivery Closure', value: 'Delivery' }
                ]}
              />
              <Input 
                label="Date Lost" 
                name="dateLost" 
                type="date"
                value={formData.dateLost} 
                onChange={handleChange}
                required
              />
              <Select 
                label="Accountable Team Leader"
                name="accountablePersonId"
                value={formData.accountablePersonId}
                onChange={handleChange}
                options={teamLeaders.map(tl => ({ label: tl.name, value: tl.id }))}
                required
              />
              <Input 
                label="Lost Estimated Deal Amount (₹)" 
                name="lostAmount" 
                value={displayAmount} 
                onChange={handleLostAmountChange}
                onFocus={() => setDisplayAmount(formData.lostAmount.toString())}
                onBlur={() => setDisplayAmount(formData.lostAmount ? formatCurrency(Number(formData.lostAmount)) : '')}
                placeholder="₹ 0" 
              />
              <Input 
                label="Competitor Name" 
                name="competitorName" 
                value={formData.competitorName} 
                onChange={handleChange}
                placeholder="e.g. Competitor Private Ltd" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Loss</label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="2"
                className="block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                placeholder="Client backed out because..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Root Cause Analysis</label>
              <textarea
                name="rootCause"
                value={formData.rootCause}
                onChange={handleChange}
                rows="2"
                className="block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                placeholder="What internal process gap caused this loss?"
                required
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Actual Revenue Generated (₹)" 
                name="revenueGenerated" 
                value={displayRevenue} 
                onChange={handleRevenueChange}
                onFocus={() => setDisplayRevenue(formData.revenueGenerated.toString())}
                onBlur={() => setDisplayRevenue(formData.revenueGenerated ? formatCurrency(Number(formData.revenueGenerated)) : '')}
                placeholder="₹ 0" 
                required
              />
              <Input 
                label="Estimated Project Profit (₹)" 
                name="profit" 
                value={displayProfit} 
                onChange={handleProfitChange}
                onFocus={() => setDisplayProfit(formData.profit.toString())}
                onBlur={() => setDisplayProfit(formData.profit ? formatCurrency(Number(formData.profit)) : '')}
                placeholder="₹ 0" 
              />
              <Input 
                label="Customer CSAT Score (0-100)" 
                name="customerSatisfactionRating" 
                type="number"
                min="0"
                max="100"
                value={formData.customerSatisfactionRating} 
                onChange={handleChange}
                placeholder="95" 
              />
              <div className="flex items-center pt-6">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="wouldRecommend"
                    checked={formData.wouldRecommend}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                  />
                  <span>Client Will Recommend Us</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Success Reasons & Core Highlights</label>
              <textarea
                name="successReason"
                value={formData.successReason}
                onChange={handleChange}
                rows="3"
                className="block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                placeholder="Key factors that closed this deal successfully..."
                required
              />
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Confirm Submission</Button>
        </div>
      </form>
    </Modal>
  );
}
