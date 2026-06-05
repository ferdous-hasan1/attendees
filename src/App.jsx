import React, { useState, useEffect } from 'react';
import axios from 'axios'; // <-- Exactly ONE import, right at the top!

// Make sure your Sidebar file contains the new ResponsiveNavigation code!
import Sidebar from './components/Sidebar'; 
import Header from './components/Header';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Kiosk from './pages/LiveAttendance';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers'; 
import Records from './pages/Records';
import Settings from './pages/Settings';
import TeacherQR from './pages/TeacherQR';
import StudentPortal from './pages/StudentPortal';
import StudentDashboard from './pages/StudentDashboard';
import { motion, AnimatePresence } from 'framer-motion';

// 👇 The ONLY global rule you need for the Proxy 👇
axios.defaults.baseURL = '/api';

const App = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  // --- RESTORE SESSION ON REFRESH ---
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const savedRole = localStorage.getItem('userRole');
    const savedEmail = localStorage.getItem('userEmail');
    if (isLoggedIn && savedRole) {
      setUserRole(savedRole);
      setUserEmail(savedEmail);
      setCurrentView('app');
      
      // Everyone lands on their respective Overview first!
      setActiveTab('dashboard'); 
    }
  }, []);

  const showToast = (message, type) => {
    console.log("Notification:", message);
    if (type === 'success' || type === 'error') {
       alert(message); 
    }
  };

  const handleLogin = (role, email) => {
    setUserRole(role);
    setUserEmail(email); 
    setCurrentView('app');
    
    setActiveTab('dashboard');

    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken'); 
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isLoggedIn');
    
    setUserRole(null);
    setUserEmail(null);
    setCurrentView('landing');
  };

  // --- VIEW ROUTING ---
  if (currentView === 'landing') return <Landing onNavigate={(view) => setCurrentView(view)} />;
  if (currentView === 'login') return <Login onLogin={handleLogin} onBack={() => setCurrentView('landing')} />;
  if (currentView === 'kiosk') return <Kiosk onExit={() => setCurrentView('landing')} />;

  return (
    // 👇 FIXED: Removed md:flex-row to enforce vertical layout on all screens with the bottom dock
    <div className="flex flex-col h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 🧭 NAVIGATION: Automatically switches between Bottom Nav and Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={userRole}
        onLogout={handleLogout}
      />
      
      {/* 👇 FIXED: Added universal pb-20 to push content up so it isn't hidden behind the universal bottom nav bar. */}
      <div className="flex-1 flex flex-col overflow-hidden relative pb-20 w-full">
        
        {/* 🏷️ TOP HEADER */}
        <Header 
            title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')} 
            onLogout={handleLogout}
            onNavigate={setActiveTab}
            userRole={userRole}
        />
        
        {/* ✨ ANIMATED MAIN CONTENT AREA */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex-1 flex flex-col min-h-full"
            >
              {/* 🚦 THE TRAFFIC COP: Strictly one dashboard per role */}
              {activeTab === 'dashboard' && (userRole === 'admin' || userRole === 'teacher') && (
                 <Dashboard role={userRole} userEmail={userEmail} />
              )}
              
              {activeTab === 'dashboard' && userRole === 'student' && (
                 <StudentDashboard userEmail={userEmail} onNavigate={setActiveTab} />
              )}

              {/* --- KIOSK / LIVE CAMERA --- */}
              {activeTab === 'live' && (
                 // 👇 FIXED: Made this flex-1 so it automatically fills the screen minus the header and bottom nav!
                 <div className="flex-1 w-full flex items-center justify-center bg-black min-h-[50vh]">
                     <Kiosk onExit={() => setActiveTab('dashboard')} />
                 </div>
              )}

              {/* --- DATA MANAGEMENT --- */}
              {activeTab === 'records' && <Records showToast={showToast} />}
              {/* Change this line: */}
              {activeTab === 'settings' && <Settings showToast={showToast} userRole={userRole} userEmail={userEmail} />}
              {activeTab === 'students' && <Students showToast={showToast} />}
              
              {userRole === 'admin' && activeTab === 'teachers' && (
                 <Teachers showToast={showToast} />
              )}

              {/* --- NEW QR & STUDENT PORTAL ROUTES --- */}
              {activeTab === 'teacher-qr' && <TeacherQR />}
              {activeTab === 'student-portal' && <StudentPortal userEmail={userEmail} />}
              
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;