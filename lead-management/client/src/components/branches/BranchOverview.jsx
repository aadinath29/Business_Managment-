import React from 'react';
import { Card, CardContent } from '../UI/Card';
import { Mail, Phone, Clock, Calendar, ShieldCheck, MapPin } from 'lucide-react';

export function BranchOverview({ branch }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Parameters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b">Corporate Details</h4>
          <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
            <div>
              <span className="text-gray-400 font-medium block">Working Days</span>
              <span className="font-semibold text-gray-800">{branch.workingDays || 'Not Provided'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Timezone</span>
              <span className="font-semibold text-gray-800">{branch.timezone || 'Not Provided'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">GST Number</span>
              <span className={`font-semibold font-mono uppercase ${branch.gstNumber ? 'text-gray-800' : 'text-gray-400 normal-case font-sans'}`}>{branch.gstNumber || 'Not Provided'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">PAN Number</span>
              <span className={`font-semibold font-mono uppercase ${branch.panNumber ? 'text-gray-800' : 'text-gray-400 normal-case font-sans'}`}>{branch.panNumber || 'Not Provided'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manager details */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b">Branch Leadership</h4>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
              {(branch.manager || 'Not Assigned').charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 leading-tight">{branch.manager || 'Not Assigned'}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Active Manager</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-gray-600">
            <p className="flex items-center"><Mail className="w-3.5 h-3.5 mr-2 text-gray-400" /> {branch.managerEmail || branch.email || 'Not available'}</p>
            <p className="flex items-center"><Phone className="w-3.5 h-3.5 mr-2 text-gray-400" /> {branch.managerPhone || branch.phone || 'Not available'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Full Address */}
      <Card className="md:col-span-2">
        <CardContent className="p-4 space-y-2">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b">Branch Office Location</h4>
          <p className="text-xs text-gray-600 leading-relaxed flex items-start gap-1">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{branch.address}, {branch.city}, {branch.state}, {branch.country} - {branch.pincode || 'N/A'}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
