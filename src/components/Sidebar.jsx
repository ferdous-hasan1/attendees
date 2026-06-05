import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, FileText, Settings, LogOut, UserCircle, GraduationCap, Video, QrCode, Smartphone, MoreHorizontal } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, userRole, onLogout }) => {
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef(null);

  const adminMenu = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'live', label: 'Live Camera', icon: Video },
    { id: 'teacher-qr', label: 'Class QR', icon: QrCode },
    { id: 'student-portal', label: 'Student App', icon: Smartphone },
    { id: 'teachers', label: 'Teachers', icon: UserCircle },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const teacherMenu = [
    { id: 'dashboard', label: 'My Classes', icon: LayoutDashboard },
    { id: 'teacher-qr', label: 'Class QR', icon: QrCode },
    { id: 'students', label: 'My Students', icon: GraduationCap },
    { id: 'records', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const studentMenu = [
    { id: 'dashboard', label: 'My Portal', icon: LayoutDashboard },
    { id: 'student-portal', label: 'Attendance', icon: Smartphone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  let menuItems = studentMenu;
  if (userRole === 'admin') menuItems = adminMenu;
  if (userRole === 'teacher') menuItems = teacherMenu;

  // Append Logout so it acts as a normal menu item
  const allItems = [...menuItems, { id: 'logout', label: 'Sign Out', icon: LogOut, isLogout: true }];

  const maxVisible = 4;
  const visibleItems = allItems.length > maxVisible ? allItems.slice(0, 3) : allItems;
  const hiddenItems = allItems.length > maxVisible ? allItems.slice(3) : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 px-2 pb-safe shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto relative">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.isLogout) onLogout();
              else setActiveTab(item.id);
            }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${
              activeTab === item.id && !item.isLogout
                ? 'text-[#1E3A8A] scale-110' 
                : item.isLogout ? 'text-red-500 hover:text-red-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id && !item.isLogout ? 'drop-shadow-sm' : ''} />
            <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
          </button>
        ))}

        {hiddenItems.length > 0 && (
          <div className="flex flex-col items-center justify-center w-full h-full relative" ref={moreRef}>
            <button
              onClick={() => setShowMore(!showMore)}
              className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                showMore ? 'text-[#1E3A8A] scale-110' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MoreHorizontal size={20} />
              <span className="text-[10px] font-bold tracking-wide">More</span>
            </button>

            {showMore && (
              <div className="absolute bottom-[4.5rem] right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 min-w-[200px] animate-in slide-in-from-bottom-2 zoom-in-95">
                {hiddenItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setShowMore(false);
                      if (item.isLogout) onLogout();
                      else setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      activeTab === item.id && !item.isLogout
                        ? 'bg-blue-50 text-[#1E3A8A]'
                        : item.isLogout
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;