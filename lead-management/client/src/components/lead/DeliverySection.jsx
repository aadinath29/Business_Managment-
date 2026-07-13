import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../UI/Card';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';
import { Star } from 'lucide-react';

export function DeliverySection({ delivery, onUpdate }) {
  const [formData, setFormData] = useState({
    demoDate: '',
    demoBy: '',
    demoResult: 'Success',
    clientRating: 5,
    clientReview: '',
    changesRequested: false,
    deliveryDate: '',
    uatStatus: 'Not Started',
    finalTestingDone: false,
    documentationUploaded: false,
    trainingCompleted: false,
    projectClosed: false
  });

  useEffect(() => {
    if (delivery) {
      setFormData({
        demoDate: delivery.demoDate || '',
        demoBy: delivery.demoBy || '',
        demoResult: delivery.demoResult || 'Success',
        clientRating: delivery.clientRating || 5,
        clientReview: delivery.clientReview || '',
        changesRequested: !!delivery.changesRequested,
        deliveryDate: delivery.deliveryDate || '',
        uatStatus: delivery.uatStatus || 'Not Started',
        finalTestingDone: !!delivery.finalTestingDone,
        documentationUploaded: !!delivery.documentationUploaded,
        trainingCompleted: !!delivery.trainingCompleted,
        projectClosed: !!delivery.projectClosed
      });
    }
  }, [delivery]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, clientRating: rating }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Demo presentation review */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Client Demonstration & Quality Audits</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  label="Demo Date" 
                  name="demoDate" 
                  type="date"
                  value={formData.demoDate} 
                  onChange={handleChange}
                />
                <Input 
                  label="Conducted By" 
                  name="demoBy" 
                  value={formData.demoBy} 
                  onChange={handleChange}
                  placeholder="e.g. Rohan Verma" 
                />
                <Select 
                  label="Demonstration Result"
                  name="demoResult"
                  value={formData.demoResult}
                  onChange={handleChange}
                  options={[
                    { label: 'Success / Accepted', value: 'Success' },
                    { label: 'Failed / Rejected', value: 'Fail' },
                    { label: 'Needs Re-scoping Review', value: 'Needs Review' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Client Rating Review</label>
                  <div className="flex items-center space-x-1.5 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        className="focus:outline-none cursor-pointer"
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            star <= formData.clientRating 
                              ? 'fill-amber-400 text-amber-400 animate-pulse' 
                              : 'text-gray-300'
                          }`} 
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-gray-500 ml-2">{formData.clientRating} / 5 Stars</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="changesRequested"
                      checked={formData.changesRequested}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                    />
                    <span>Changes / Rework Requested by Client</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Client Review Feedback</label>
                <textarea
                  name="clientReview"
                  value={formData.clientReview}
                  onChange={handleChange}
                  rows="3"
                  className="block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  placeholder="Record direct quotes from client demo feedback..."
                />
              </div>
            </div>

            {/* Delivery checklists */}
            <div className="space-y-4 pt-4 border-t border-gray-100 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Formal Handoff & Closure Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Formal Delivery Date" 
                  name="deliveryDate" 
                  type="date"
                  value={formData.deliveryDate} 
                  onChange={handleChange}
                />
                <Select 
                  label="UAT Status"
                  name="uatStatus"
                  value={formData.uatStatus}
                  onChange={handleChange}
                  options={[
                    { label: 'Not Started', value: 'Not Started' },
                    { label: 'In Progress', value: 'In Progress' },
                    { label: 'Completed & Signed', value: 'Completed' }
                  ]}
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="finalTestingDone"
                    checked={formData.finalTestingDone}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                  />
                  <span>Final QA Verification Testing Done</span>
                </label>

                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="documentationUploaded"
                    checked={formData.documentationUploaded}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                  />
                  <span>Technical & User Docs Uploaded</span>
                </label>

                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="trainingCompleted"
                    checked={formData.trainingCompleted}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                  />
                  <span>Client Training Completed</span>
                </label>

                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="projectClosed"
                    checked={formData.projectClosed}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                  />
                  <span>Close Project Cycle</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" className="cursor-pointer">Save Delivery Closure Info</Button>
            </div>

    </form>
  );
}
