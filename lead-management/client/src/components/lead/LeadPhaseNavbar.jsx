import React, { useEffect, useRef, useState } from 'react';
import { PhaseNavigationItem } from './PhaseNavigationItem';
import { PhaseProgress } from './PhaseProgress';

export function LeadPhaseNavbar({ leadStatus, lostPhaseName, onPhaseSelect }) {
  const [activeTabId, setActiveTabId] = useState('qualification');
  const scrollContainerRef = useRef(null);
  const itemsRef = useRef({});

  const phases = [
    { id: 'qualification', label: 'Qualification', marker: '📋' },
    { id: 'discovery', label: 'Discovery & Comm', marker: '✉️' },
    { id: 'solution', label: 'Solution & Proposal', marker: '📄' },
    { id: 'delivery', label: 'Delivery & Closure', marker: '🏁' },
    { id: 'success', label: 'Customer Success', marker: '🤝' },
  ];

  const getPhaseIndex = (status) => {
    switch (status) {
      case 'New': return 0;
      case 'Contacted': return 1;
      case 'Qualified': return 1;
      case 'Negotiation': return 2;
      case 'UAT':
      case 'Delivery': return 3;
      case 'Closed Won': return 4;
      default: return 0;
    }
  };

  const getPhaseStatus = (phaseId, index) => {
    if (leadStatus === 'Closed Lost' && lostPhaseName) {
      const lostPhaseLower = lostPhaseName.toLowerCase();
      const lostIdx = phases.findIndex(p => lostPhaseLower.includes(p.id));
      if (index === lostIdx) return 'lost';
      if (index < lostIdx) return 'completed';
      return 'upcoming';
    }

    if (leadStatus === 'Closed Won') {
      if (index === 4) return 'success';
      return 'completed';
    }

    if (leadStatus === 'On Hold') {
      const currentIdx = getPhaseIndex(leadStatus);
      if (index === currentIdx) return 'onhold';
      if (index < currentIdx) return 'completed';
      return 'upcoming';
    }

    const currentIdx = getPhaseIndex(leadStatus);
    if (index === currentIdx) return 'active';
    if (index < currentIdx) return 'completed';
    return 'upcoming';
  };

  // Finds the nearest ancestor that actually scrolls; falls back to the window.
  const getScrollParent = (node) => {
    let parent = node?.parentElement;
    while (parent) {
      const { overflowY } = window.getComputedStyle(parent);
      if (/(auto|scroll|overlay)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null; // window/viewport scrolls
  };

  useEffect(() => {
    const firstSection = document.getElementById(phases[0].id);
    const observerOptions = {
      root: firstSection ? getScrollParent(firstSection) : null, // null = viewport
      rootMargin: '-130px 0px -40% 0px', // Exact offset relative to sticky headers height
      threshold: 0.1,
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveTabId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    phases.forEach((phase) => {
      const el = document.getElementById(phase.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const activeBtn = itemsRef.current[activeTabId];
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeTabId]);

  const handleTabClick = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 130; // offset spacing for sticky headers
      const scrollContainer = getScrollParent(el);

      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollTop + el.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top - offset,
          behavior: 'smooth'
        });
      } else {
        const offsetPosition = window.scrollY + el.getBoundingClientRect().top - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
      setActiveTabId(id);
      onPhaseSelect?.(id);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowRight' && index < phases.length - 1) {
      const nextId = phases[index + 1].id;
      handleTabClick(nextId);
      itemsRef.current[nextId]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      const prevId = phases[index - 1].id;
      handleTabClick(prevId);
      itemsRef.current[prevId]?.focus();
    }
  };

  const getConnectorStatus = (phaseId, idx) => {
    if (activeTabId === phaseId) {
      return 'active';
    }
    const activeIdx = phases.findIndex(p => p.id === activeTabId);
    if (idx < activeIdx) {
      return 'active';
    }
    return 'upcoming';
  };

  return (
    <nav 
      aria-label="Lead Journey Phases Stepper"
      className="bg-white border-b border-gray-200 px-8 py-3 w-full"
    >
      <div 
        ref={scrollContainerRef}
        role="tablist"
        className="flex items-center overflow-x-auto whitespace-nowrap scrollbar-none snap-x snap-mandatory py-1 select-none"
      >
        {phases.map((phase, idx) => {
          const status = getPhaseStatus(phase.id, idx);
          const isActive = activeTabId === phase.id;

          return (
            <React.Fragment key={phase.id}>
              <PhaseNavigationItem
                id={phase.id}
                label={phase.label}
                marker={phase.marker}
                status={status}
                isActiveTab={isActive}
                elementRef={(el) => {
                  itemsRef.current[phase.id] = el;
                }}
                onClick={() => handleTabClick(phase.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
              />
              {idx < phases.length - 1 && (
                <PhaseProgress status={getConnectorStatus(phase.id, idx)} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
