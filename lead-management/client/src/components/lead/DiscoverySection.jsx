import React, { useState } from 'react';
import { Card, CardContent } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Modal } from '../UI/Modal';
import { Plus, Mail, Phone, Calendar, Video, MessageSquare } from 'lucide-react';

export function DiscoverySection({ lead, communications, requirements, developers = [], onAddCommunication, onAddRequirement }) {
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);

  // New communication form state
  const [newComm, setNewComm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    type: 'Call',
    from: '',
    to: lead.contactPerson || '',
    department: 'CRM Development',
    subject: '',
    discussionSummary: '',
    requirementDiscussed: '',
    clientProblem: '',
    suggestedSolution: '',
    nextFollowUpDate: '',
    nextAction: '',
    minutesOfMeeting: ''
  });

  // New requirement form state
  const [newReq, setNewReq] = useState({
    description: '',
    priority: 'Medium',
    estHours: '',
    assignedTeam: 'CRM Development',
    assignedDeveloperId: '',
    expectedCompletion: '',
    status: 'Open'
  });

  const getCommIcon = (type) => {
    switch (type) {
      case 'Call': return <Phone className="w-4 h-4 text-blue-500" />;
      case 'Meeting': return <Video className="w-4 h-4 text-indigo-500" />;
      case 'Email': return <Mail className="w-4 h-4 text-amber-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleCommSubmit = (e) => {
    e.preventDefault();
    onAddCommunication(newComm);
    setIsCommModalOpen(false);
    setNewComm({
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      type: 'Call',
      from: '',
      to: lead.contactPerson || '',
      department: 'CRM Development',
      subject: '',
      discussionSummary: '',
      requirementDiscussed: '',
      clientProblem: '',
      suggestedSolution: '',
      nextFollowUpDate: '',
      nextAction: '',
      minutesOfMeeting: ''
    });
  };

  const handleReqSubmit = (e) => {
    e.preventDefault();
    onAddRequirement({
      ...newReq,
      estHours: Number(newReq.estHours) || 0
    });
    setIsReqModalOpen(false);
    setNewReq({
      description: '',
      priority: 'Medium',
      estHours: '',
      assignedTeam: 'CRM Development',
      assignedDeveloperId: '',
      expectedCompletion: '',
      status: 'Open'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Communications card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h3 className="text-sm font-semibold text-gray-700">Interactions Log</h3>
            <Button onClick={() => setIsCommModalOpen(true)} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" /> Log Interaction
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Participants</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject & Summary</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Follow Up</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {communications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-400">No communication logs recorded yet.</td>
                  </tr>
                ) : (
                  communications.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        <div className="font-semibold text-gray-700">{c.date}</div>
                        <div>{c.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                        <div className="flex items-center space-x-1.5 font-bold">
                          {getCommIcon(c.type)}
                          <span>{c.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        <div><span className="text-[10px] text-gray-400 uppercase font-bold">From:</span> {c.from || 'Admin'}</div>
                        <div><span className="text-[10px] text-gray-400 uppercase font-bold">To:</span> {c.to}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 max-w-xs">
                        <div className="font-bold text-gray-900 mb-0.5">{c.subject}</div>
                        <div className="line-clamp-2">{c.discussionSummary}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {c.nextFollowUpDate ? (
                          <>
                            <div className="font-bold text-amber-600">{c.nextFollowUpDate}</div>
                            <div className="text-[10px] truncate max-w-[120px]">{c.nextAction}</div>
                          </>
                        ) : 'None'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {communications.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">No communication logs recorded yet.</div>
            ) : (
              communications.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-gray-100 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getCommIcon(c.type)}
                      <span className="text-xs font-bold text-slate-800">{c.type}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold">{c.date} • {c.time}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{c.subject}</h4>
                    <p className="text-xs text-gray-500 mt-1">{c.discussionSummary}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100/50 pt-2">
                    <div>
                      <span className="text-[9px] text-gray-400 block uppercase font-bold">Participants</span>
                      <span>From: {c.from || 'Admin'} • To: {c.to}</span>
                    </div>
                    {c.nextFollowUpDate && (
                      <div className="text-right">
                        <span className="text-[9px] text-amber-600 block uppercase font-bold">Follow Up</span>
                        <span className="font-semibold text-amber-700">{c.nextFollowUpDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Requirements card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h3 className="text-sm font-semibold text-gray-700">Functional Scopes & Requirements</h3>
            <Button onClick={() => setIsReqModalOpen(true)} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" /> Add Requirement
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requirement</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocations</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requirements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-400">No scoped requirements documented yet.</td>
                  </tr>
                ) : (
                  requirements.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-xs text-gray-900 font-medium max-w-xs">{r.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          r.priority === 'High' ? 'bg-red-100 text-red-800' :
                          r.priority === 'Medium' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>{r.priority}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        <div className="font-bold">{r.assignedTeam}</div>
                        <div className="text-[10px] text-gray-400">{r.assignedDeveloper || 'Unassigned'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-bold text-center">{r.estHours}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{r.expectedCompletion || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>{r.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {requirements.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">No scoped requirements documented yet.</div>
            ) : (
              requirements.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-gray-100 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-gray-900 max-w-[70%]">{r.description}</p>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      r.priority === 'High' ? 'bg-red-100 text-red-800' :
                      r.priority === 'Medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{r.priority}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100/50 pt-2">
                    <div>
                      <span className="text-[9px] text-gray-400 block uppercase font-bold">Allocation</span>
                      <span className="font-bold text-gray-800">{r.assignedTeam}</span>
                      <span className="text-[10px] text-gray-500 block">{r.assignedDeveloper || 'Unassigned'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 block uppercase font-bold">Est. Hours</span>
                      <span className="font-semibold text-slate-800">{r.estHours}h</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100/50 pt-2">
                    <span>Deadline: {r.expectedCompletion || 'N/A'}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>{r.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logging communication record modal */}
      <Modal isOpen={isCommModalOpen} onClose={() => setIsCommModalOpen(false)} title="Log Customer Interaction">
        <form onSubmit={handleCommSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Interaction Date" 
              name="date" 
              type="date"
              value={newComm.date} 
              onChange={(e) => setNewComm({...newComm, date: e.target.value})}
              required 
            />
            <Input 
              label="Interaction Time" 
              name="time" 
              type="time"
              value={newComm.time} 
              onChange={(e) => setNewComm({...newComm, time: e.target.value})}
              required 
            />
            <Select 
              label="Communication Type"
              name="type"
              value={newComm.type}
              onChange={(e) => setNewComm({...newComm, type: e.target.value})}
              options={[
                { label: 'Call', value: 'Call' },
                { label: 'Meeting', value: 'Meeting' },
                { label: 'Email', value: 'Email' },
                { label: 'WhatsApp', value: 'WhatsApp' },
                { label: 'Zoom/Video', value: 'Meeting' }
              ]}
            />
            <Input 
              label="Conducted By (From)" 
              name="from" 
              value={newComm.from} 
              onChange={(e) => setNewComm({...newComm, from: e.target.value})}
              placeholder="e.g. Rohan Verma" 
              required
            />
            <Input
              label="Client Rep (To)"
              name="to"
              value={newComm.to}
              onChange={(e) => setNewComm({...newComm, to: e.target.value})}
              placeholder="e.g. Priya Singh"
              required
            />
          </div>

          <Input 
            label="Interaction Subject" 
            name="subject" 
            value={newComm.subject} 
            onChange={(e) => setNewComm({...newComm, subject: e.target.value})}
            placeholder="e.g. Requirement Scoping Session" 
            required
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Discussion Summary</label>
            <textarea
              value={newComm.discussionSummary}
              onChange={(e) => setNewComm({...newComm, discussionSummary: e.target.value})}
              rows="3"
              className="block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
              placeholder="Core takeaways..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Next Follow Up Date" 
              name="nextFollowUpDate" 
              type="date"
              value={newComm.nextFollowUpDate} 
              onChange={(e) => setNewComm({...newComm, nextFollowUpDate: e.target.value})}
            />
            <Input 
              label="Next Action Task" 
              name="nextAction" 
              value={newComm.nextAction} 
              onChange={(e) => setNewComm({...newComm, nextAction: e.target.value})}
              placeholder="e.g. Send pricing proposal document" 
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsCommModalOpen(false)}>Cancel</Button>
            <Button type="submit">Log Interaction</Button>
          </div>
        </form>
      </Modal>

      {/* Adding scoped requirements modal */}
      <Modal isOpen={isReqModalOpen} onClose={() => setIsReqModalOpen(false)} title="Scope Project Requirement">
        <form onSubmit={handleReqSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Requirement Description</label>
            <textarea
              value={newReq.description}
              onChange={(e) => setNewReq({...newReq, description: e.target.value})}
              rows="3"
              className="block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
              placeholder="e.g. Build multi-branch dropdown filters in sticky top header..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="Requirement Priority"
              name="priority"
              value={newReq.priority}
              onChange={(e) => setNewReq({...newReq, priority: e.target.value})}
              options={[
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' }
              ]}
            />
            <Input 
              label="Estimated Hours" 
              name="estHours" 
              type="number"
              value={newReq.estHours} 
              onChange={(e) => setNewReq({...newReq, estHours: e.target.value})}
              placeholder="e.g. 40"
              required 
            />
            <Input 
              label="Assigned Team" 
              name="assignedTeam" 
              value={newReq.assignedTeam} 
              onChange={(e) => setNewReq({...newReq, assignedTeam: e.target.value})}
              placeholder="CRM Development" 
              required
            />
            <Select
              label="Assigned Developer"
              name="assignedDeveloperId"
              value={newReq.assignedDeveloperId}
              onChange={(e) => setNewReq({...newReq, assignedDeveloperId: e.target.value})}
              options={[
                { label: developers.length ? 'Select Developer...' : 'No developers in this team', value: '' },
                ...developers.map(dev => ({ label: dev.name, value: dev.id }))
              ]}
            />
            <Input 
              label="Expected Completion Date" 
              name="expectedCompletion" 
              type="date"
              value={newReq.expectedCompletion} 
              onChange={(e) => setNewReq({...newReq, expectedCompletion: e.target.value})}
              required
            />
            <Select 
              label="Scoping Status"
              name="status"
              value={newReq.status}
              onChange={(e) => setNewReq({...newReq, status: e.target.value})}
              options={[
                { label: 'Open', value: 'Open' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Completed', value: 'Completed' }
              ]}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsReqModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Requirement</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
