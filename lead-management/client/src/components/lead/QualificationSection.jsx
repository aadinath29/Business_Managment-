import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../UI/Card';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';
import { formatCurrency } from '../../utils/currency';

export function QualificationSection({ lead, onUpdate }) {
  const [formData, setFormData] = useState({
    budget: '',
    decisionMaker: '',
    expectedStartDate: '',
    businessNeed: '',
    projectType: '',
    priority: '',
    expectedRevenue: '',
    status: ''
  });

  const [displayBudget, setDisplayBudget] = useState('');
  const [displayRevenue, setDisplayRevenue] = useState('');

  useEffect(() => {
    if (lead) {
      setFormData({
        budget: lead.budget || '',
        decisionMaker: lead.decisionMaker || '',
        expectedStartDate: lead.expectedStartDate || '',
        businessNeed: lead.businessNeed || '',
        projectType: lead.projectType || '',
        priority: lead.priority || '',
        expectedRevenue: lead.expectedRevenue || '',
        status: lead.status || ''
      });
      setDisplayBudget(lead.budget ? formatCurrency(lead.budget) : '');
      setDisplayRevenue(lead.expectedRevenue ? formatCurrency(lead.expectedRevenue) : '');
    }
  }, [lead]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBudgetChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, budget: rawVal }));
    setDisplayBudget(rawVal);
  };

  const handleRevenueChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, expectedRevenue: rawVal }));
    setDisplayRevenue(rawVal);
  };

  const handleSave = (e) => {
    e.preventDefault();
    onUpdate({
      ...formData,
      budget: Number(formData.budget) || 0,
      expectedRevenue: Number(formData.expectedRevenue) || 0
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
            
            {/* Read-only lead metadata */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Core Lead Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block">Lead ID</span>
                  <span className="font-bold text-gray-800">{lead.id}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Company Name</span>
                  <span className="font-bold text-gray-800">{lead.name || lead.companyName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Contact Person</span>
                  <span className="font-bold text-gray-800">{lead.contactPerson || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Mobile</span>
                  <span className="font-bold text-gray-800">{lead.mobile || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Email</span>
                  <span className="font-bold text-gray-800">{lead.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Branch</span>
                  <span className="font-bold text-gray-800 capitalize">{lead.branchName || lead.branchId}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Lead Source</span>
                  <span className="font-bold text-gray-800">{lead.leadSource || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Campaign</span>
                  <span className="font-bold text-gray-800">{lead.campaign || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Editable metrics */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Qualification Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <Input 
                  label="Estimated Budget (₹)" 
                  name="budget" 
                  value={displayBudget} 
                  onChange={handleBudgetChange}
                  onFocus={() => setDisplayBudget(formData.budget.toString())}
                  onBlur={() => setDisplayBudget(formData.budget ? formatCurrency(Number(formData.budget)) : '')}
                  placeholder="₹ 0" 
                />

                <Input 
                  label="Expected Revenue (₹)" 
                  name="expectedRevenue" 
                  value={displayRevenue} 
                  onChange={handleRevenueChange}
                  onFocus={() => setDisplayRevenue(formData.expectedRevenue.toString())}
                  onBlur={() => setDisplayRevenue(formData.expectedRevenue ? formatCurrency(Number(formData.expectedRevenue)) : '')}
                  placeholder="₹ 0" 
                />

                <Input 
                  label="Decision Maker" 
                  name="decisionMaker" 
                  value={formData.decisionMaker} 
                  onChange={handleChange}
                  placeholder="e.g. Priya Singh" 
                />

                <Input 
                  label="Expected Start Date" 
                  name="expectedStartDate" 
                  type="date"
                  value={formData.expectedStartDate} 
                  onChange={handleChange}
                />

                <Select 
                  label="Project Type"
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  options={[
                    { label: 'Website Development', value: 'Website Development' },
                    { label: 'CRM Customization', value: 'CRM Customization' },
                    { label: 'eCommerce Revamp', value: 'eCommerce Revamp' },
                    { label: 'Mobile App', value: 'Mobile App' },
                    { label: 'Cloud Infrastructure', value: 'Cloud Infrastructure' }
                  ]}
                />

                <Select
                  label="Priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  options={[
                    { label: 'Low', value: 'Low' },
                    { label: 'Medium', value: 'Medium' },
                    { label: 'High', value: 'High' }
                  ]}
                />

                <Select 
                  label="Lead Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={[
                    { label: 'New', value: 'New' },
                    { label: 'Contacted', value: 'Contacted' },
                    { label: 'Qualified', value: 'Qualified' },
                    { label: 'Unqualified', value: 'Unqualified' },
                    { label: 'On Hold', value: 'On Hold' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Business Need Description</label>
                <textarea
                  name="businessNeed"
                  value={formData.businessNeed}
                  onChange={handleChange}
                  rows="3"
                  className="block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white"
                  placeholder="Describe the client's business problems and scope goals..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" className="cursor-pointer">Save Qualification Info</Button>
            </div>

    </form>
  );
}
