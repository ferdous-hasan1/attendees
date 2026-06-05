import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut } from 'lucide-react';

const Header = ({ title, onLogout, onNavigate, userRole }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the popup if the user taps anywhere else on the screen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to generate initials based on role
  const getInitials = (role) => {
    if (!role) return 'U';
    return role === 'admin' ? 'AD' : role === 'teacher' ? 'TR' : 'ST';
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      
      {/* 1. Page Title */}
      <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
        {title}
      </h2>
      
      {/* 2. Profile Section */}
      <div className="relative" ref={menuRef}>
        
        {/* Profile Avatar Button */}
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="h-9 w-9 bg-[#1E3A8A] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm hover:scale-105 transition-transform"
        >
          {getInitials(userRole)}
        </button>

        {/* 3. The Popup Dropdown */}
        {isProfileOpen && (
          <div className="absolute top-12 right-0 w-48 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 z-50">
            
            {/* Small Role Indicator */}
            <div className="px-4 py-2 border-b border-slate-50 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Logged in as
              </span>
              <p className="text-sm font-semibold text-slate-800 capitalize">
                {userRole || 'User'}
              </p>
            </div>

            {/* Manage Profile Option */}
            <button 
              onClick={() => {
                setIsProfileOpen(false);
                onNavigate('settings');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#1E3A8A] transition-colors"
            >
              <Settings size={18} />
              <span>Manage Profile</span>
            </button>
            
            <div className="h-px bg-slate-100 my-1 w-full block"></div>

            {/* Sign Out Option */}
            <button 
              onClick={() => {
                setIsProfileOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;