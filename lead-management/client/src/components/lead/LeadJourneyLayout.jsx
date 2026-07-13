import React from 'react';


export function LeadJourneyLayout({ actionBar, phaseNavbar, content, timeline }) {
  return (
    <div className="flex flex-col w-full font-sans text-gray-900 overflow-visible">

      {/* Headers Wrapper - Now flush to the top and edges, acting as the primary application header */}
      <div className="sticky top-0 z-50 flex flex-col bg-white shadow-sm border-b border-gray-200 -mx-4 md:-mx-6 lg:-mx-8 mb-6">
        {actionBar}
        {phaseNavbar}
      </div>

      {/* Page Content area */}
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left side: content sections */}
          <div className="lg:col-span-2 space-y-8">
            {content}
          </div>

          {/* Right side: activity timeline */}
          <div className="lg:col-span-1 bg-slate-50 p-6 rounded-xl border border-gray-100 shadow-2xs">
            {timeline}
          </div>

        </div>
      </div>
    </div>
  );
}
