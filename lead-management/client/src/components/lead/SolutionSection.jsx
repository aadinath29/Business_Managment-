import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../UI/Card';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';
import { formatCurrency } from '../../utils/currency';

export function SolutionSection({ proposal, onUpdate }) {
  const [formData, setFormData] = useState({
    businessAnalysis: '',
    technicalAnalysis: '',
    riskAnalysis: '',
    feasibility: '',
    scope: '',
    timeline: '',
    estHours: '',
    estCost: '',
    resourcePlan: '',
    proposalNumber: '',
    proposalVersion: '',
    proposalDate: '',
    quotationAmount: '',
    discount: '',
    finalCost: '',
    negotiationStatus: 'Pending',
    clientSuggestion: '',
    finalPrice: '',
    proposalApproved: false,
    contractSigned: false,
    advanceReceived: false,
    advanceAmount: ''
  });

  const [displayQuotation, setDisplayQuotation] = useState('');
  const [displayDiscount, setDisplayDiscount] = useState('');
  const [displayFinalCost, setDisplayFinalCost] = useState('');
  const [displayAdvance, setDisplayAdvance] = useState('');

  useEffect(() => {
    if (proposal) {
      setFormData({
        businessAnalysis: proposal.businessAnalysis || '',
        technicalAnalysis: proposal.technicalAnalysis || '',
        riskAnalysis: proposal.riskAnalysis || '',
        feasibility: proposal.feasibility || '',
        scope: proposal.scope || '',
        timeline: proposal.timeline || '',
        estHours: proposal.estHours || '',
        estCost: proposal.estCost || '',
        resourcePlan: proposal.resourcePlan || '',
        proposalNumber: proposal.proposalNumber || '',
        proposalVersion: proposal.proposalVersion || '',
        proposalDate: proposal.proposalDate || '',
        quotationAmount: proposal.quotationAmount || '',
        discount: proposal.discount || '',
        finalCost: proposal.finalCost || '',
        negotiationStatus: proposal.negotiationStatus || 'Pending',
        clientSuggestion: proposal.clientSuggestion || '',
        finalPrice: proposal.finalPrice || '',
        proposalApproved: !!proposal.proposalApproved,
        contractSigned: !!proposal.contractSigned,
        advanceReceived: !!proposal.advanceReceived,
        advanceAmount: proposal.advanceAmount || ''
      });
      setDisplayQuotation(proposal.quotationAmount ? formatCurrency(proposal.quotationAmount) : '');
      setDisplayDiscount(proposal.discount ? formatCurrency(proposal.discount) : '');
      setDisplayFinalCost(proposal.finalCost ? formatCurrency(proposal.finalCost) : '');
      setDisplayAdvance(proposal.advanceAmount ? formatCurrency(proposal.advanceAmount) : '');
    }
  }, [proposal]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleQuotationChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const numVal = Number(rawVal) || 0;
    const finalVal = numVal - (Number(formData.discount) || 0);
    setFormData(prev => ({ 
      ...prev, 
      quotationAmount: rawVal,
      finalCost: finalVal.toString()
    }));
    setDisplayQuotation(rawVal);
    setDisplayFinalCost(finalVal ? finalVal.toString() : '');
  };

  const handleDiscountChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const finalVal = (Number(formData.quotationAmount) || 0) - (Number(rawVal) || 0);
    setFormData(prev => ({ 
      ...prev, 
      discount: rawVal,
      finalCost: finalVal.toString()
    }));
    setDisplayDiscount(rawVal);
    setDisplayFinalCost(finalVal ? finalVal.toString() : '');
  };

  const handleAdvanceChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, advanceAmount: rawVal }));
    setDisplayAdvance(rawVal);
  };

  const handleSave = (e) => {
    e.preventDefault();
    onUpdate({
      ...formData,
      estHours: Number(formData.estHours) || 0,
      estCost: Number(formData.estCost) || 0,
      quotationAmount: Number(formData.quotationAmount) || 0,
      discount: Number(formData.discount) || 0,
      finalCost: Number(formData.finalCost) || 0,
      finalPrice: Number(formData.finalPrice) || null,
      advanceAmount: Number(formData.advanceAmount) || 0
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
            
            {/* Scopes and Analysis */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Solution Analysis & Architectural Feasibility</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Business Analysis</label>
                  <textarea
                    name="businessAnalysis"
                    value={formData.businessAnalysis}
                    onChange={handleChange}
                    rows="3"
                    className="block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    placeholder="Analyze ROI metrics..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Technical Architecture Analysis</label>
                  <textarea
                    name="technicalAnalysis"
                    value={formData.technicalAnalysis}
                    onChange={handleChange}
                    rows="3"
                    className="block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    placeholder="Technology choice justification..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Risk Assessment</label>
                  <textarea
                    name="riskAnalysis"
                    value={formData.riskAnalysis}
                    onChange={handleChange}
                    rows="3"
                    className="block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    placeholder="Scope creep, architectural bottlenecks..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Detailed Solution Scope</label>
                  <textarea
                    name="scope"
                    value={formData.scope}
                    onChange={handleChange}
                    rows="3"
                    className="block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    placeholder="Inclusions and exclusions..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  label="Architectural Feasibility" 
                  name="feasibility" 
                  value={formData.feasibility} 
                  onChange={handleChange}
                  placeholder="e.g. Highly feasible" 
                />
                <Input 
                  label="Project Timeline Duration" 
                  name="timeline" 
                  value={formData.timeline} 
                  onChange={handleChange}
                  placeholder="e.g. 8 Weeks" 
                />
                <Input 
                  label="Resource Allocation Plan" 
                  name="resourcePlan" 
                  value={formData.resourcePlan} 
                  onChange={handleChange}
                  placeholder="e.g. 1 TL, 2 Developers" 
                />
              </div>
            </div>

            {/* Proposal Quotation */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quotation & Commercial Negotiations</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input 
                  label="Proposal Reference No." 
                  name="proposalNumber" 
                  value={formData.proposalNumber} 
                  onChange={handleChange}
                  placeholder="e.g. PROP-2026-01" 
                />
                <Input 
                  label="Version" 
                  name="proposalVersion" 
                  value={formData.proposalVersion} 
                  onChange={handleChange}
                  placeholder="e.g. v1.0" 
                />
                <Input 
                  label="Proposal Date" 
                  name="proposalDate" 
                  type="date"
                  value={formData.proposalDate} 
                  onChange={handleChange}
                />
                <Select 
                  label="Negotiation Status"
                  name="negotiationStatus"
                  value={formData.negotiationStatus}
                  onChange={handleChange}
                  options={[
                    { label: 'Pending Review', value: 'Pending' },
                    { label: 'Under Negotiation', value: 'Negotiating' },
                    { label: 'Approved & Signed', value: 'Approved' },
                    { label: 'Rejected', value: 'Rejected' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  label="Initial Quotation Amount (₹)" 
                  name="quotationAmount" 
                  value={displayQuotation} 
                  onChange={handleQuotationChange}
                  onFocus={() => setDisplayQuotation(formData.quotationAmount.toString())}
                  onBlur={() => setDisplayQuotation(formData.quotationAmount ? formatCurrency(Number(formData.quotationAmount)) : '')}
                  placeholder="₹ 0" 
                />
                <Input 
                  label="Applied Discount (₹)" 
                  name="discount" 
                  value={displayDiscount} 
                  onChange={handleDiscountChange}
                  onFocus={() => setDisplayDiscount(formData.discount.toString())}
                  onBlur={() => setDisplayDiscount(formData.discount ? formatCurrency(Number(formData.discount)) : '')}
                  placeholder="₹ 0" 
                />
                <Input 
                  label="Final Cost (₹)" 
                  name="finalCost" 
                  value={displayFinalCost} 
                  readOnly
                  onFocus={() => setDisplayFinalCost(formData.finalCost.toString())}
                  onBlur={() => setDisplayFinalCost(formData.finalCost ? formatCurrency(Number(formData.finalCost)) : '')}
                  placeholder="₹ 0" 
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Client Suggestion / Feedback</label>
                <textarea
                  name="clientSuggestion"
                  value={formData.clientSuggestion}
                  onChange={handleChange}
                  rows="2"
                  className="block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  placeholder="Quoted rate concessions requested..."
                />
              </div>
            </div>

            {/* Contract Sign off checklists */}
            <div className="space-y-4 pt-4 border-t border-gray-100 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Proposal Sign-off Checkpoints</h3>
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8">
                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="proposalApproved"
                    checked={formData.proposalApproved}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                  />
                  <span>Proposal Formally Approved</span>
                </label>

                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="contractSigned"
                    checked={formData.contractSigned}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                  />
                  <span>Contract Agreement Signed</span>
                </label>

                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="advanceReceived"
                    checked={formData.advanceReceived}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                  />
                  <span>Advance Payment Received</span>
                </label>
              </div>

              {formData.advanceReceived && (
                <div className="w-64 pt-2">
                  <Input 
                    label="Advance Amount (₹)" 
                    name="advanceAmount" 
                    value={displayAdvance} 
                    onChange={handleAdvanceChange}
                    onFocus={() => setDisplayAdvance(formData.advanceAmount.toString())}
                    onBlur={() => setDisplayAdvance(formData.advanceAmount ? formatCurrency(Number(formData.advanceAmount)) : '')}
                    placeholder="₹ 0" 
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" className="cursor-pointer">Save Solution Proposal</Button>
            </div>

    </form>
  );
}
