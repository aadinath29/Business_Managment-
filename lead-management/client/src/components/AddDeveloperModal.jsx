import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './UI/Button';
import { developersApi } from '../services/api/developersApi';

export function AddDeveloperModal({ isOpen, onClose, teamLeaderId, teamId, leadId, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    phone: '',
    department: 'CRM Development',
    designation: 'Developer'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.name || !formData.employeeId || !formData.email) {
      setError('Name, Employee ID, and Email are required.');
      return;
    }
    
    setLoading(true);
    try {
      await developersApi.create({
        ...formData,
        teamId: teamId || teamLeaderId
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      if (err.response?.data?.errors?.length > 0) {
        setError(err.response.data.errors[0].message || 'Validation failed');
      } else {
        setError(err.response?.data?.message || 'Failed to add developer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Add New Developer</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Developer Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. John Doe" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Employee ID *</label>
              <input required type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. EMP123" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email *</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@example.com" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+91 XXXXX XXXXX" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Department</label>
              <select name="department" value={formData.department} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>CRM Development</option>
                <option>Cloud Solutions</option>
                <option>Enterprise Integrations</option>
                <option>Data Platforms</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Designation</label>
              <input type="text" name="designation" value={formData.designation} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Developer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
