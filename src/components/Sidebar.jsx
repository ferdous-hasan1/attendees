import React from 'react';
import { LayoutDashboard, Users, FileText, Settings, LogOut, UserCircle, GraduationCap, Video, QrCode, Smartphone } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, userRole, onLogout }) => {
  
  const adminMenu = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'live', label: 'Live Camera', icon: Video },
    { id: 'teacher-qr', label: 'Generate Class QR', icon: QrCode },
    { id: 'student-portal', label: 'Student Phone (Test)', icon: Smartphone },
    { id: 'teachers', label: 'Manage Teachers', icon: UserCircle },
    { id: 'students', label: 'Manage Students', icon: GraduationCap },
    { id: 'records', label: 'Attendance Records', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const teacherMenu = [
    { id: 'dashboard', label: 'My Classes', icon: LayoutDashboard },
    { id: 'teacher-qr', label: 'Generate Class QR', icon: QrCode },
    { id: 'students', label: 'My Students', icon: GraduationCap },
    { id: 'records', label: 'Class Reports', icon: FileText },
    { id: 'settings', label: 'Profile Settings', icon: Settings },
  ];

  // --- NEW: THE STUDENT MENU ---
  const studentMenu = [
    { id: 'dashboard', label: 'My Portal', icon: LayoutDashboard },
    { id: 'student-portal', label: 'Mark Attendance', icon: Smartphone },
    { id: 'settings', label: 'Profile Settings', icon: Settings },
  ];

  // --- FIXED: SMART ROLE SELECTOR ---
  let menuItems = studentMenu; // Default to most restrictive
  if (userRole === 'admin') menuItems = adminMenu;
  if (userRole === 'teacher') menuItems = teacherMenu;

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="h-20 flex items-center px-6 border-b border-slate-100">
        <div className="h-8 w-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center mr-3 shadow-md shadow-blue-900/20">
            <span className="text-white font-bold">A</span>
        </div>
        <div>
            <span className="block text-lg font-bold text-[#1E3A8A] leading-none">Attendease</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">{userRole} Portal</span>
        </div>
      </div>
      
      <div className="p-4 space-y-2 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/30 translate-x-1' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'text-blue-200' : ''} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;