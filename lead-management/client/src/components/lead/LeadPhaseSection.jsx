import React from 'react';
import { Card, CardContent } from '../UI/Card';

export function LeadPhaseSection({ id, title, noCard = false, children }) {
  return (
    <section 
      id={id} 
      className="scroll-mt-[210px] focus:outline-none" 
      role="tabpanel" 
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
    >
      {noCard ? (
        <div className="space-y-4">
          <div className="px-4 py-2 bg-slate-100/50 rounded-lg border border-slate-200/40">
            <h2 id={`${id}-title`} className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {title}
            </h2>
          </div>
          {children}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <h2 id={`${id}-title`} className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
              {title}
            </h2>
            {children}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
