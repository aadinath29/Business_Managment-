import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './UI/Button';
import { tasksService } from '../services/mockData';

export function AddTaskModal({ isOpen, onClose, developers, leadId, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedDeveloper: '',
    priority: 'Medium',
    status: 'Pending',
    startDate: '',
    estimatedCompletion: '',
    category: 'Development',
    remarks: ''
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
    
    if (!formData.title || !formData.assignedDeveloper || !formData.startDate || !formData.estimatedCompletion) {
      setError('Title, Developer, Start Date, and Estimated Completion are required.');
      return;
    }
    
    setLoading(true);
    try {
      await tasksService.create({
        ...formData,
        leadId,
        assignedDate: formData.startDate,
        progress: 0,
        timeline: [
          { date: new Date().toISOString().split('T')[0], action: 'Task Created', user: 'Team Leader' }
        ]
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to create task.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Assign New Task</h2>
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
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Task Title *</label>
            <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Implement login API" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Detailed task requirements..."></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Assign To Developer *</label>
              <select required name="assignedDeveloper" value={formData.assignedDeveloper} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Developer...</option>
                {developers.map(dev => (
                  <option key={dev.id} value={dev.id}>{dev.name} ({dev.employeeId})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Start Date *</label>
              <input required type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Estimated Completion *</label>
              <input required type="date" name="estimatedCompletion" value={formData.estimatedCompletion} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Development</option>
                <option>Testing</option>
                <option>Design</option>
                <option>Documentation</option>
                <option>Bug Fix</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Assign Task'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
