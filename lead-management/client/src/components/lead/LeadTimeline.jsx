import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export function LeadTimeline({ journey }) {
  const [expandedId, setExpandedId] = useState(null);

  const getTimelineEvents = () => {
    if (!journey) return [];
    const events = [];

    // 1. Communications
    if (journey.communications) {
      journey.communications.forEach(c => {
        events.push({
          id: c.id,
          date: c.date,
          time: c.time || '',
          title: `${c.type} - ${c.subject}`,
          summary: c.discussionSummary,
          details: `Minutes: ${c.minutesOfMeeting || 'None'} | Next Action: ${c.nextAction || 'None'}`,
          type: 'communication',
          icon: c.type === 'Call' ? '📞' : c.type === 'Meeting' ? '🤝' : '✉️',
          color: 'blue'
        });
      });
    }

    // 2. Requirements
    if (journey.requirements) {
      journey.requirements.forEach(r => {
        events.push({
          id: r.id,
          date: r.expectedCompletion,
          title: `Requirement Scoped`,
          summary: r.description,
          details: `Assigned: ${r.assignedDeveloper || 'Unassigned'} | Team: ${r.assignedTeam} | Est. Hours: ${r.estHours}h`,
          type: 'requirement',
          icon: '📋',
          color: r.status === 'Completed' ? 'green' : 'orange'
        });
      });
    }

    // 3. Proposal
    if (journey.proposal && journey.proposal.proposalDate) {
      events.push({
        id: journey.proposal.id,
        date: journey.proposal.proposalDate,
        title: `Solution Proposal Drafted`,
        summary: `Proposal Number: ${journey.proposal.proposalNumber} | Final cost quote: ₹${journey.proposal.finalCost.toLocaleString('en-IN')}`,
        details: `Business Analysis: ${journey.proposal.businessAnalysis} | Approved: ${journey.proposal.proposalApproved ? 'Yes' : 'No'}`,
        type: 'proposal',
        icon: '📄',
        color: journey.proposal.proposalApproved ? 'green' : 'indigo'
      });
    }

    // 4. Project execution
    if (journey.projectExecution && journey.projectExecution.startDate) {
      events.push({
        id: journey.projectExecution.id,
        date: journey.projectExecution.startDate,
        title: `Project Kickoff`,
        summary: `Project Name: ${journey.projectExecution.projectName} | Status: ${journey.projectExecution.status}`,
        details: `Technology: ${journey.projectExecution.technology} | Progress: ${journey.projectExecution.progressPct}% | Devs: ${journey.projectExecution.totalDevs}`,
        type: 'execution',
        icon: '⚙️',
        color: 'indigo'
      });
    }

    // 5. Success or Issue logs
    if (journey.successRecord) {
      events.push({
        id: journey.successRecord.id,
        date: new Date().toISOString().split('T')[0], // placeholder date
        title: `Lead Converted (Won 🎉)`,
        summary: journey.successRecord.successReason,
        details: `Revenue: ₹${journey.successRecord.revenueGenerated?.toLocaleString('en-IN')} | Satisfaction: ${journey.successRecord.customerSatisfactionRating}%`,
        type: 'success',
        icon: '🏆',
        color: 'green'
      });
    }

    if (journey.issue) {
      events.push({
        id: journey.issue.id,
        date: journey.issue.dateLost,
        title: `Lead Closed (Lost ❌)`,
        summary: `Lost at phase: ${journey.issue.phaseLostAt} | Reason: ${journey.issue.reason}`,
        details: `Root Cause: ${journey.issue.rootCause} | Accountable: ${journey.issue.accountablePersonId}`,
        type: 'lost',
        icon: '⚠️',
        color: 'red'
      });
    }

    // Sort events by date descending
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const events = getTimelineEvents();

  const getColorClasses = (color) => {
    switch (color) {
      case 'green': return 'bg-emerald-500 ring-emerald-100 text-white';
      case 'orange': return 'bg-amber-500 ring-amber-100 text-white';
      case 'red': return 'bg-rose-500 ring-rose-100 text-white';
      case 'indigo': return 'bg-indigo-500 ring-indigo-100 text-white';
      default: return 'bg-blue-500 ring-blue-100 text-white';
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="relative border-l border-gray-200 ml-4 pl-6 space-y-6">
      {events.length === 0 ? (
        <div className="text-gray-400 text-sm py-4">No events logged in the timeline yet.</div>
      ) : (
        events.map((event) => {
          const isExpanded = expandedId === event.id;
          return (
            <div key={event.id} className="relative group">
              {/* Vertical timeline node dot */}
              <span className={`absolute -left-[35px] top-0 flex items-center justify-center w-7 h-7 rounded-full ring-4 shadow-xs text-xs font-bold ${getColorClasses(event.color)}`}>
                {event.icon}
              </span>
              
              {/* Event card content */}
              <div 
                className={`p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-100 hover:shadow-xs transition-all cursor-pointer ${isExpanded ? 'ring-1 ring-blue-100 shadow-xs' : ''}`}
                onClick={() => toggleExpand(event.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs font-bold text-gray-400 space-x-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{event.date} {event.time}</span>
                  </div>
                  <div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-bold text-gray-900 mt-1">{event.title}</h4>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.summary}</p>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1 bg-slate-50 p-2.5 rounded-lg">
                    {event.details.split(' | ').map((detail, idx) => (
                      <div key={idx} className="flex justify-between py-0.5 border-b border-gray-100/50 last:border-b-0">
                        <span className="font-bold text-gray-500">{detail.split(': ')[0]}:</span>
                        <span className="text-gray-700 font-medium">{detail.split(': ')[1] || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
