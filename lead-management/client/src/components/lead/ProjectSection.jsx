import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Modal } from '../UI/Modal';
import { Plus, Settings, AlertTriangle, CheckSquare } from 'lucide-react';

export function ProjectSection({ projectExecution, tasks = [], devsList = [], teamLeaders = [], onUpdateExecution, onAddTask }) {
  const devInitials = (name) => (name || 'NA').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() || 'NA';
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isExecEditOpen, setIsExecEditOpen] = useState(false);

  // Execution edit form state
  const [execForm, setExecForm] = useState({
    projectId: '',
    projectName: '',
    startDate: '',
    deadline: '',
    priority: 'Medium',
    technology: '',
    status: 'Not Started',
    progressPct: 0,
    riskLevel: 'Low',
    currentSprint: '',
    teamLeaderId: '',
    expectedHours: 0
  });

  // Task form state
  const [newTask, setNewTask] = useState({
    devId: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    hoursWorked: '',
    estHours: '',
    status: 'Open',
    delayReason: '',
    blocker: '',
    codeReviewStatus: 'Pending',
    testingStatus: 'Pending'
  });

  useEffect(() => {
    if (projectExecution) {
      setExecForm({
        projectId: projectExecution.projectId || '',
        projectName: projectExecution.projectName || '',
        startDate: projectExecution.startDate || '',
        deadline: projectExecution.deadline || '',
        priority: projectExecution.priority || 'Medium',
        technology: projectExecution.technology || '',
        status: projectExecution.status || 'Not Started',
        progressPct: projectExecution.progressPct || 0,
        riskLevel: projectExecution.riskLevel || 'Low',
        currentSprint: projectExecution.currentSprint || '',
        teamLeaderId: projectExecution.teamLeaderId || '',
        expectedHours: projectExecution.expectedHours || 0
      });
    }
  }, [projectExecution]);

  const handleExecSubmit = (e) => {
    e.preventDefault();
    onUpdateExecution({
      ...execForm,
      progressPct: Number(execForm.progressPct) || 0,
      expectedHours: Number(execForm.expectedHours) || 0
    });
    setIsExecEditOpen(false);
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    onAddTask({
      ...newTask,
      hoursWorked: Number(newTask.hoursWorked) || 0,
      estHours: Number(newTask.estHours) || 0
    });
    setIsTaskModalOpen(false);
    setNewTask({
      devId: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      hoursWorked: '',
      estHours: '',
      status: 'Open',
      delayReason: '',
      blocker: '',
      codeReviewStatus: 'Pending',
      testingStatus: 'Pending'
    });
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'High': return <Badge variant="danger">High Risk</Badge>;
      case 'Medium': return <Badge variant="warning">Medium</Badge>;
      default: return <Badge variant="success">Low Risk</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return <Badge variant="success">Completed</Badge>;
      case 'In Progress': return <Badge variant="info">In Progress</Badge>;
      case 'On Hold': return <Badge variant="warning">On Hold</Badge>;
      default: return <Badge variant="default">Not Started</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Project Execution summary card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h3 className="text-sm font-semibold text-gray-700">Sprint Tracking & Parameters</h3>
            <Button variant="ghost" onClick={() => setIsExecEditOpen(true)} className="text-xs cursor-pointer">
              <Settings className="w-4 h-4 mr-1" /> Configure Project
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-gray-600">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Project ID & Name</span>
                  <span className="font-bold text-gray-900 text-sm">{projectExecution?.projectId || 'N/A'} - {projectExecution?.projectName || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Sprint Track</span>
                  <span className="font-bold text-gray-900">{projectExecution?.currentSprint || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Risk Level</span>
                  <div className="mt-0.5">{getRiskBadge(projectExecution?.riskLevel)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Target Deadline</span>
                  <span className="font-bold text-gray-900">{projectExecution?.deadline || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Technology Stack</span>
                  <span className="font-bold text-gray-900">{projectExecution?.technology || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Team Leader</span>
                  <span className="font-bold text-gray-900">
                    {teamLeaders.find(tl => tl.id === projectExecution?.teamLeaderId || tl.teamId === projectExecution?.teamLeaderId)?.name || 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Progress bar container */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                  <span>Sprint Completion Velocity</span>
                  <span>{projectExecution?.progressPct || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${projectExecution?.progressPct || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Hourly stats grid */}
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl flex flex-col justify-between text-center">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Expected Dev Sizing</span>
                <div className="text-3xl font-extrabold text-indigo-600 mt-1">{projectExecution?.expectedHours || 0} hrs</div>
              </div>
              <div className="border-t border-slate-200/50 my-2 pt-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Actual Spent Hours</span>
                <div className="text-xl font-bold text-slate-800">{projectExecution?.actualHours || 0} hrs logged</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Developer Tasks list card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h3 className="text-sm font-semibold text-gray-700">Developer Tasks & Progress</h3>
            <Button onClick={() => setIsTaskModalOpen(true)} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" /> Log Developer Task
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Developer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Work Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timeline</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quality status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sprint Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-400">No developer tasks logged under this execution cycle.</td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-xs font-bold flex items-center justify-center text-slate-700 mr-2.5">
                            {devInitials(t.devId)}
                          </div>
                          <span className="text-xs font-semibold text-gray-900">{t.devId || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700 max-w-xs">
                        <div className="font-bold text-gray-800">{t.description}</div>
                        {t.blocker && (
                          <div className="flex items-center text-[10px] text-red-500 font-bold mt-1 bg-red-50 p-1 rounded">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Blocker: {t.blocker}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        <span className="font-bold">{t.hoursWorked}h</span>
                        <span className="text-gray-400"> / {t.estHours}h</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-505">
                        <div><span className="text-[10px] font-bold text-gray-400 uppercase">Start:</span> {t.startDate}</div>
                        <div><span className="text-[10px] font-bold text-gray-400 uppercase">End:</span> {t.endDate || 'Ongoing'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-550">
                        <div><span className="text-[10px] font-bold">Review:</span> {t.codeReviewStatus}</div>
                        <div><span className="text-[10px] font-bold">QA:</span> {t.testingStatus}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          t.status === 'InProgress' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>{t.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {tasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">No developer tasks logged under this execution cycle.</div>
            ) : (
              tasks.map((t) => (
                <div key={t.id} className="p-4 rounded-xl border border-gray-100 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-xs font-bold flex items-center justify-center text-slate-700 mr-2">
                        {devInitials(t.devId)}
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{t.devId || 'Unassigned'}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      t.status === 'InProgress' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>{t.status}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-800 font-medium">{t.description}</p>
                    {t.blocker && (
                      <div className="flex items-center text-[10px] text-red-500 font-bold mt-1 bg-red-55 p-1 rounded">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Blocker: {t.blocker}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-505 border-t border-gray-100/50 pt-2">
                    <div>
                      <span className="text-[9px] text-gray-400 block uppercase font-bold">Timeline</span>
                      <span>Start: {t.startDate}</span>
                      <span className="block text-[10px]">End: {t.endDate || 'Ongoing'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 block uppercase font-bold">Hours Worked</span>
                      <span className="font-bold text-gray-900">{t.hoursWorked}h</span>
                      <span className="text-gray-400 text-[10px]"> / {t.estHours}h</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100/50 pt-2">
                    <div>
                      <span className="text-[9px] text-gray-400 block uppercase font-bold">Quality status</span>
                      <span>Review: {t.codeReviewStatus} • QA: {t.testingStatus}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configure Project Modal */}
      <Modal isOpen={isExecEditOpen} onClose={() => setIsExecEditOpen(false)} title="Configure Execution Cycle">
        <form onSubmit={handleExecSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Project ID" 
              name="projectId" 
              value={execForm.projectId} 
              onChange={(e) => setExecForm({...execForm, projectId: e.target.value})}
              placeholder="e.g. PRJ-1001" 
              required
            />
            <Input 
              label="Project Name" 
              name="projectName" 
              value={execForm.projectName} 
              onChange={(e) => setExecForm({...execForm, projectName: e.target.value})}
              placeholder="e.g. Acme Web Rebuild" 
              required
            />
            <Input 
              label="Start Date" 
              name="startDate" 
              type="date"
              value={execForm.startDate} 
              onChange={(e) => setExecForm({...execForm, startDate: e.target.value})}
            />
            <Input 
              label="Target Deadline" 
              name="deadline" 
              type="date"
              value={execForm.deadline} 
              onChange={(e) => setExecForm({...execForm, deadline: e.target.value})}
            />
            <Select 
              label="Project Priority"
              name="priority"
              value={execForm.priority}
              onChange={(e) => setExecForm({...execForm, priority: e.target.value})}
              options={[
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' }
              ]}
            />
            <Input 
              label="Technology Stack" 
              name="technology" 
              value={execForm.technology} 
              onChange={(e) => setExecForm({...execForm, technology: e.target.value})}
              placeholder="e.g. React, Node.js" 
            />
            <Select 
              label="Sprint status"
              name="status"
              value={execForm.status}
              onChange={(e) => setExecForm({...execForm, status: e.target.value})}
              options={[
                { label: 'Not Started', value: 'Not Started' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'On Hold', value: 'On Hold' },
                { label: 'Completed', value: 'Completed' }
              ]}
            />
            <Input 
              label="Completion Progress (%)" 
              name="progressPct" 
              type="number"
              min="0"
              max="100"
              value={execForm.progressPct} 
              onChange={(e) => setExecForm({...execForm, progressPct: e.target.value})}
            />
            <Select 
              label="Risk Assessment"
              name="riskLevel"
              value={execForm.riskLevel}
              onChange={(e) => setExecForm({...execForm, riskLevel: e.target.value})}
              options={[
                { label: 'Low Risk', value: 'Low' },
                { label: 'Medium Risk', value: 'Medium' },
                { label: 'High Risk', value: 'High' }
              ]}
            />
            <Input 
              label="Current Sprint Tag" 
              name="currentSprint" 
              value={execForm.currentSprint} 
              onChange={(e) => setExecForm({...execForm, currentSprint: e.target.value})}
              placeholder="e.g. Sprint 3" 
            />
            <Select 
              label="Allocated Team Leader"
              name="teamLeaderId"
              value={execForm.teamLeaderId}
              onChange={(e) => setExecForm({...execForm, teamLeaderId: e.target.value})}
              options={teamLeaders.map(tl => ({ label: tl.name, value: tl.id }))}
            />
            <Input 
              label="Expected Sizing (Hours)" 
              name="expectedHours" 
              type="number"
              value={execForm.expectedHours} 
              onChange={(e) => setExecForm({...execForm, expectedHours: e.target.value})}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsExecEditOpen(false)}>Cancel</Button>
            <Button type="submit">Save Configurations</Button>
          </div>
        </form>
      </Modal>

      {/* Log Task Work Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Log Developer Task Work">
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="Select Developer"
              name="devId"
              value={newTask.devId}
              onChange={(e) => setNewTask({...newTask, devId: e.target.value})}
              options={devsList.filter(Boolean).map(dev => ({ label: dev, value: dev }))}
              required
            />
            <Select 
              label="Sprint Status"
              name="status"
              value={newTask.status}
              onChange={(e) => setNewTask({...newTask, status: e.target.value})}
              options={[
                { label: 'Open / To Do', value: 'Open' },
                { label: 'In Progress', value: 'InProgress' },
                { label: 'Blocked', value: 'Blocked' },
                { label: 'Completed', value: 'Completed' }
              ]}
            />
            <Input 
              label="Start Date" 
              name="startDate" 
              type="date"
              value={newTask.startDate} 
              onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
              required
            />
            <Input 
              label="End Date" 
              name="endDate" 
              type="date"
              value={newTask.endDate} 
              onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
            />
            <Input 
              label="Hours Worked" 
              name="hoursWorked" 
              type="number"
              value={newTask.hoursWorked} 
              onChange={(e) => setNewTask({...newTask, hoursWorked: e.target.value})}
              required
            />
            <Input 
              label="Estimated Sizing (Hours)" 
              name="estHours" 
              type="number"
              value={newTask.estHours} 
              onChange={(e) => setNewTask({...newTask, estHours: e.target.value})}
              required
            />
            <Input 
              label="Code Review Status" 
              name="codeReviewStatus" 
              value={newTask.codeReviewStatus} 
              onChange={(e) => setNewTask({...newTask, codeReviewStatus: e.target.value})}
              placeholder="e.g. Approved / Under Review" 
            />
            <Input 
              label="QA Testing Status" 
              name="testingStatus" 
              value={newTask.testingStatus} 
              onChange={(e) => setNewTask({...newTask, testingStatus: e.target.value})}
              placeholder="e.g. Passed / Pending" 
            />
          </div>

          <Input 
            label="Task Description" 
            name="description" 
            value={newTask.description} 
            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            placeholder="e.g. Initialize schema tables and constraints" 
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Reason for Delay (optional)" 
              name="delayReason" 
              value={newTask.delayReason} 
              onChange={(e) => setNewTask({...newTask, delayReason: e.target.value})}
              placeholder="e.g. Scope creep modifications" 
            />
            <Input 
              label="Active Blocker (optional)" 
              name="blocker" 
              value={newTask.blocker} 
              onChange={(e) => setNewTask({...newTask, blocker: e.target.value})}
              placeholder="e.g. Awaiting database admin credentials" 
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
            <Button type="submit">Log Task Work</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
