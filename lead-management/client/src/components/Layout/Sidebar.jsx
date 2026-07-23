import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, CheckSquare, Target, Building2, LogOut, Calculator, MessageSquare } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: Target },
  { path: '/accounting', label: 'Accounting', icon: Calculator },
  { path: '/teams', label: 'Teams', icon: Users },
  { path: '/branches', label: 'Branches', icon: Building2 },
  { path: '/reports', label: 'Reports', icon: FileText, roles: ['SUPER_ADMIN'] },
  { path: '/chat-with-ai', label: 'Chat with AI', icon: MessageSquare },
];

export function Sidebar({ onClose }) {
  const { role, backendRole, name, logout } = useAuth();
  const navigate = useNavigate();
  
  const filteredNavItems = navItems.filter(item => {
    if (item.path === '/branches' && role === 'team_leader') {
      return false;
    }
    if (item.path === '/accounting' && role === 'team_leader') {
      return false;
    }

    if (!item.roles) return true;
    
    // Some items might be restricted by standard role or strict backendRole
    if (item.roles.includes('SUPER_ADMIN')) {
      return backendRole === 'SUPER_ADMIN';
    }
    
    return item.roles.includes(role);
  });

  return (
    <div className="flex flex-col w-64 h-screen bg-slate-900 text-slate-300 border-r border-slate-800">
      <div className="flex items-center justify-center h-16 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-wide">Business Management</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5 mr-3 shrink-0" />
            {item.path === '/branches' && role === 'branch_manager' ? 'Branch' : item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center px-4 py-2 text-sm text-slate-400 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3 text-white font-bold">
            {name ? name.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div>
            <p className="text-white font-medium">{name || 'User'}</p>
            <p className="text-xs capitalize">{role === 'team_leader' ? 'Team Leader' : role === 'branch_manager' ? 'Branch Manager' : 'Admin'}</p>
          </div>
        </div>
        <button 
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex items-center space-x-2 text-sm font-medium text-slate-400 hover:text-red-500 transition-colors cursor-pointer w-full px-4"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
