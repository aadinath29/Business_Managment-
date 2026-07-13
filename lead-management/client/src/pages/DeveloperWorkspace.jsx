import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { ArrowLeft, CheckCircle2, Circle, Calendar, Clock, GitCommit, Trash2, Edit2, Play, Pause, Check } from 'lucide-react';
import { developersService, leadsService, tasksService } from '../services/mockData';


export function DeveloperWorkspace() {
  const { teamLeaderId, leadId, developerId } = useParams();
  const navigate = useNavigate();
  
  const [developer, setDeveloper] = useState(null);
  const [lead, setLead] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    const [fetchedDevs, fetchedLead, allTasks] = await Promise.all([
      developersService.getByLead(leadId),
      leadsService.getById(leadId),
      tasksService.getAll()
    ]);
    
    setDeveloper(fetchedDevs.find(d => d.id === developerId));
    setLead(fetchedLead);
    
    const devTasks = allTasks.filter(t => t.assignedDeveloper === developerId && t.leadId === leadId);
    setTasks(devTasks);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [teamLeaderId, leadId, developerId]);

  const handleStatusChange = async (taskId, newStatus) => {
    await tasksService.update(taskId, { status: newStatus });
    fetchWorkspaceData();
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await tasksService.delete(taskId);
      fetchWorkspaceData();
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Developer Workspace...</div>;
  if (!developer) return <div className="p-8 text-center text-gray-500">Developer not found.</div>;

  const completedTasksCount = tasks.filter(t => t.status === 'Done').length;
  const completionPct = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  // Mock activity timeline
  const recentActivity = [
    { id: 1, type: 'commit', message: 'Fixed API integration bug', time: '2 hours ago' },
    { id: 2, type: 'task', message: 'Completed task: Frontend layout for dashboard', time: '4 hours ago' },
    { id: 3, type: 'commit', message: 'Updated dependencies', time: 'Yesterday' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate(`/teams/${teamLeaderId}/leads/${leadId}`)} className="p-2 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{developer.name}'s Workspace</h1>
            <p className="text-sm text-gray-500 mt-1">Working on Lead: {lead?.name}</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Developer Info & KPIs */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl mr-4">
                  {developer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{developer.name}</h2>
                  <p className="text-sm text-gray-500">{developer.role}</p>
                  <Badge variant="success" className="mt-2">Online</Badge>
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tasks Assigned</span>
                  <span className="font-bold">{tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tasks Completed</span>
                  <span className="font-bold text-emerald-600">{completedTasksCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Completion</span>
                  <span className="font-bold text-blue-600">{completionPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Active Time Today</span>
                  <span className="font-bold">6h 15m</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assigned Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Completion</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No tasks assigned for this lead.</td>
                      </tr>
                    ) : tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.status === 'Done' ? (
                            <Badge variant="success">Done</Badge>
                          ) : task.status === 'In Progress' ? (
                            <Badge variant="primary">In Progress</Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-sm font-medium ${task.status === 'Done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {task.title}
                          <div className="text-xs text-gray-400 font-normal mt-0.5">{task.category || 'Development'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-700' : task.priority === 'Low' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                            {task.priority || 'Medium'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-900">{task.assignedDate || task.startDate || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-900">{task.estimatedCompletion || task.dueDate || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {task.status !== 'In Progress' && task.status !== 'Done' && (
                              <button onClick={() => handleStatusChange(task.id, 'In Progress')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer" title="Start Task">
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {task.status === 'In Progress' && (
                              <button onClick={() => handleStatusChange(task.id, 'Pending')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer" title="Pause Task">
                                <Pause className="w-4 h-4" />
                              </button>
                            )}
                            {task.status !== 'Done' && (
                              <button onClick={() => handleStatusChange(task.id, 'Done')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer" title="Mark Complete">
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer" title="Delete Task">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {tasks.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">No tasks assigned for this lead.</div>
                ) : (
                  tasks.map((task) => (
                    <Card key={task.id} className="p-4 space-y-3 relative border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`text-sm font-semibold ${task.status === 'Done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">{task.category || 'Development'}</p>
                        </div>
                        {task.status === 'Done' ? (
                          <Badge variant="success">Done</Badge>
                        ) : task.status === 'In Progress' ? (
                          <Badge variant="primary">In Progress</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-2">
                        <div>
                          <span className="text-gray-400 block uppercase font-bold text-[9px]">Priority</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-700' : task.priority === 'Low' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                            {task.priority || 'Medium'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block uppercase font-bold text-[9px]">Est. Completion</span>
                          <span>{task.estimatedCompletion || task.dueDate || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-55">
                        {task.status !== 'In Progress' && task.status !== 'Done' && (
                          <button onClick={() => handleStatusChange(task.id, 'In Progress')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs flex items-center gap-1 border border-blue-100 cursor-pointer">
                            <Play className="w-3.5 h-3.5" /> Start
                          </button>
                        )}
                        {task.status === 'In Progress' && (
                          <button onClick={() => handleStatusChange(task.id, 'Pending')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg text-xs flex items-center gap-1 border border-amber-100 cursor-pointer">
                            <Pause className="w-3.5 h-3.5" /> Pause
                          </button>
                        )}
                        {task.status !== 'Done' && (
                          <button onClick={() => handleStatusChange(task.id, 'Done')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs flex items-center gap-1 border border-emerald-100 cursor-pointer">
                            <Check className="w-3.5 h-3.5" /> Complete
                          </button>
                        )}
                        <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-red-650 hover:bg-red-50 rounded-lg text-xs flex items-center gap-1 border border-red-100 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
