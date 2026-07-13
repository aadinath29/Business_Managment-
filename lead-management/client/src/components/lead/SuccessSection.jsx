import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../UI/Card';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';
import { formatCurrency } from '../../utils/currency';

export function SuccessSection({ customerSuccess, onUpdate }) {
  const [formData, setFormData] = useState({
    supportStart: '',
    supportEnd: '',
    renewalDate: '',
    renewalStatus: 'Pending',
    totalSupportTickets: 0,
    ticketsResolved: 0,
    overallRating: 5,
    communicationRating: 5,
    developerRating: 5,
    leaderRating: 5,
    deliveryRating: 5,
    qualityRating: 5,
    supportRating: 5,
    upsellOpportunity: false,
    crossSellOpportunity: false,
    referralReceived: false,
    repeatProject: false,
    lifetimeValue: 0,
    relationshipStatus: 'Good'
  });

  const [displayLTV, setDisplayLTV] = useState('');

  useEffect(() => {
    if (customerSuccess) {
      setFormData({
        supportStart: customerSuccess.supportStart || '',
        supportEnd: customerSuccess.supportEnd || '',
        renewalDate: customerSuccess.renewalDate || '',
        renewalStatus: customerSuccess.renewalStatus || 'Pending',
        totalSupportTickets: customerSuccess.totalSupportTickets || 0,
        ticketsResolved: customerSuccess.ticketsResolved || 0,
        overallRating: customerSuccess.overallRating || 5,
        communicationRating: customerSuccess.communicationRating || 5,
        developerRating: customerSuccess.developerRating || 5,
        leaderRating: customerSuccess.leaderRating || 5,
        deliveryRating: customerSuccess.deliveryRating || 5,
        qualityRating: customerSuccess.qualityRating || 5,
        supportRating: customerSuccess.supportRating || 5,
        upsellOpportunity: !!customerSuccess.upsellOpportunity,
        crossSellOpportunity: !!customerSuccess.crossSellOpportunity,
        referralReceived: !!customerSuccess.referralReceived,
        repeatProject: !!customerSuccess.repeatProject,
        lifetimeValue: customerSuccess.lifetimeValue || 0,
        relationshipStatus: customerSuccess.relationshipStatus || 'Good'
      });
      setDisplayLTV(customerSuccess.lifetimeValue ? formatCurrency(customerSuccess.lifetimeValue) : '');
    }
  }, [customerSuccess]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLTVChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, lifetimeValue: rawVal }));
    setDisplayLTV(rawVal);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      ...formData,
      totalSupportTickets: Number(formData.totalSupportTickets) || 0,
      ticketsResolved: Number(formData.ticketsResolved) || 0,
      overallRating: Number(formData.overallRating) || 5,
      communicationRating: Number(formData.communicationRating) || 5,
      developerRating: Number(formData.developerRating) || 5,
      leaderRating: Number(formData.leaderRating) || 5,
      deliveryRating: Number(formData.deliveryRating) || 5,
      qualityRating: Number(formData.qualityRating) || 5,
      supportRating: Number(formData.supportRating) || 5,
      lifetimeValue: Number(formData.lifetimeValue) || 0
    });
  };

  const getRatingOptions = () => [
    { label: '5 (Excellent)', value: '5' },
    { label: '4 (Good)', value: '4' },
    { label: '3 (Fair)', value: '3' },
    { label: '2 (Poor)', value: '2' },
    { label: '1 (Critical)', value: '1' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Support Contract dates */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Support Contracts & Maintenance (AMC)</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input 
                  label="Support Contract Start" 
                  name="supportStart" 
                  type="date"
                  value={formData.supportStart} 
                  onChange={handleChange}
                />
                <Input 
                  label="Support Contract End" 
                  name="supportEnd" 
                  type="date"
                  value={formData.supportEnd} 
                  onChange={handleChange}
                />
                <Input 
                  label="AMC Renewal Date" 
                  name="renewalDate" 
                  type="date"
                  value={formData.renewalDate} 
                  onChange={handleChange}
                />
                <Select 
                  label="AMC Renewal Status"
                  name="renewalStatus"
                  value={formData.renewalStatus}
                  onChange={handleChange}
                  options={[
                    { label: 'Pending Payment', value: 'Pending' },
                    { label: 'Renewed & Completed', value: 'Completed' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  label="Total Support Tickets" 
                  name="totalSupportTickets" 
                  type="number"
                  value={formData.totalSupportTickets} 
                  onChange={handleChange}
                />
                <Input 
                  label="Tickets Resolved" 
                  name="ticketsResolved" 
                  type="number"
                  value={formData.ticketsResolved} 
                  onChange={handleChange}
                />
                <Input 
                  label="Project Lifetime Value (LTV)" 
                  name="lifetimeValue" 
                  value={displayLTV} 
                  onChange={handleLTVChange}
                  onFocus={() => setDisplayLTV(formData.lifetimeValue.toString())}
                  onBlur={() => setDisplayLTV(formData.lifetimeValue ? formatCurrency(Number(formData.lifetimeValue)) : '')}
                  placeholder="₹ 0" 
                />
              </div>
            </div>

            {/* Satisfaction details selects */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Experience Ratings</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select 
                  label="Overall Rating" 
                  name="overallRating" 
                  value={formData.overallRating.toString()} 
                  onChange={handleChange}
                  options={getRatingOptions()}
                />
                <Select 
                  label="Communication Quality" 
                  name="communicationRating" 
                  value={formData.communicationRating.toString()} 
                  onChange={handleChange}
                  options={getRatingOptions()}
                />
                <Select 
                  label="Developer Delivery" 
                  name="developerRating" 
                  value={formData.developerRating.toString()} 
                  onChange={handleChange}
                  options={getRatingOptions()}
                />
                <Select 
                  label="Lead Management" 
                  name="leaderRating" 
                  value={formData.leaderRating.toString()} 
                  onChange={handleChange}
                  options={getRatingOptions()}
                />
                <Select 
                  label="Project Quality" 
                  name="qualityRating" 
                  value={formData.qualityRating.toString()} 
                  onChange={handleChange}
                  options={getRatingOptions()}
                />
                <Select 
                  label="Support Responsiveness" 
                  name="supportRating" 
                  value={formData.supportRating.toString()} 
                  onChange={handleChange}
                  options={getRatingOptions()}
                />
                <Select 
                  label="Relationship Status" 
                  name="relationshipStatus" 
                  value={formData.relationshipStatus} 
                  onChange={handleChange}
                  options={[
                    { label: 'Excellent / Great', value: 'Excellent' },
                    { label: 'Good Relationship', value: 'Good' },
                    { label: 'Fair / Neutral', value: 'Fair' },
                    { label: 'Poor / At Risk', value: 'Poor' }
                  ]}
                />
              </div>
            </div>

            {/* Expansion opportunities checks */}
            <div className="space-y-4 pt-4 border-t border-gray-100 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Business Expansion Opportunities</h3>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="upsellOpportunity"
                    checked={formData.upsellOpportunity}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                  />
                  <span>Active Upsell Opportunity</span>
                </label>

                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="crossSellOpportunity"
                    checked={formData.crossSellOpportunity}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                  />
                  <span>Active Cross-sell Opportunity</span>
                </label>

                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="referralReceived"
                    checked={formData.referralReceived}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                  />
                  <span>Referral Received from Client</span>
                </label>

                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="repeatProject"
                    checked={formData.repeatProject}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                  />
                  <span>Repeat Projects Committed</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" className="cursor-pointer">Save Customer Success Details</Button>
            </div>

    </form>
  );
}
