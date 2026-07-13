import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f3f4f6] font-sans text-gray-900 relative">
      {/* Mobile Sidebar Overlay/Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer Wrapper */}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:flex shrink-0`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-col flex-1 w-0 min-h-screen">
        {/* Mobile top navigation header (Hamburger menu for mobile) */}
        <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 lg:hidden shrink-0 text-white shadow-md z-50 sticky top-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-slate-300 hover:text-white focus:outline-none cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-base font-bold tracking-wide">Business Management</span>
          <div className="w-8" /> {/* spacer balance */}
        </header>

        <main className="flex-1 relative z-0 focus:outline-none flex flex-col p-4 md:p-6 lg:p-8 pt-0 md:pt-0 lg:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
