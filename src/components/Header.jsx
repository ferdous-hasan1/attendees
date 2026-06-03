import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

const Header = ({ title, toggleSidebar }) => (
  <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
    <div className="flex items-center">
      <button onClick={toggleSidebar} className="mr-4 md:hidden text-slate-500">
        <Menu size={24} />
      </button>
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
    </div>
    
    <div className="flex items-center space-x-4">
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search..." 
          className="pl-10 pr-4 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] w-64"
        />
      </div>
      <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full">
        <Bell size={20} />
        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
      </button>
      <div className="h-8 w-8 bg-[#1E3A8A] rounded-full flex items-center justify-center text-white text-sm font-medium">
        AD
      </div>
    </div>
  </header>
);

export default Header;