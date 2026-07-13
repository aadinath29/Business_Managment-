import React from 'react';
import { Card, CardContent } from '../UI/Card';
import { Building2, Target, Briefcase, Activity } from 'lucide-react';
import { calculateAchievementPercentage } from '../../utils/branchCalculations';

export function BranchStats({ branches }) {
  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.status === 'Active').length;

  const totalLeads = branches.reduce((acc, b) => acc + (b.activeLeads || 0), 0);
  const totalProjects = branches.reduce((acc, b) => acc + (b.activeProjects || 0), 0);
  
  const achievements = branches.map(b => calculateAchievementPercentage(b.achievedTarget, b.assignedTarget));
  const avgAchievement = achievements.length > 0 
    ? Math.round(achievements.reduce((acc, v) => acc + v, 0) / achievements.length) 
    : 0;

  const getAchievementColor = (pct) => {
    if (pct >= 90) return 'text-emerald-600 bg-emerald-50';
    if (pct >= 70) return 'text-blue-600 bg-blue-50';
    if (pct >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 mr-3">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Branches</p>
            <h4 className="text-lg font-bold text-gray-900 mt-0.5">{totalBranches}</h4>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 mr-3">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Branches</p>
            <h4 className="text-lg font-bold text-gray-900 mt-0.5">{activeBranches}</h4>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 mr-3">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Active Leads</p>
            <h4 className="text-lg font-bold text-gray-900 mt-0.5">{totalLeads}</h4>
          </div>
        </CardContent>
      </Card>



      <Card>
        <CardContent className="p-4 flex items-center">
          <div className={`p-2.5 rounded-xl mr-3 ${getAchievementColor(avgAchievement)}`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Achievement</p>
            <h4 className="text-lg font-bold text-gray-900 mt-0.5">{avgAchievement}%</h4>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
