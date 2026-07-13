import React from 'react';
import { ChevronRight } from 'lucide-react';

export function PhaseProgress({ status }) {
  const getLineColor = () => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'border-emerald-400';
      case 'active':
        return 'border-blue-400';
      case 'lost':
        return 'border-rose-400';
      case 'onhold':
        return 'border-amber-400';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <div className="flex items-center space-x-1 shrink-0 px-2 select-none">
      <div className={`w-8 md:w-12 border-t-2 border-dashed ${getLineColor()}`} />
      <ChevronRight className={`w-3.5 h-3.5 ${
        status === 'completed' || status === 'success' ? 'text-emerald-500' :
        status === 'active' ? 'text-blue-500' :
        status === 'lost' ? 'text-rose-500' :
        status === 'onhold' ? 'text-amber-500' :
        'text-gray-300'
      }`} />
    </div>
  );
}
