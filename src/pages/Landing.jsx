import React from 'react';
import { ShieldCheck, ScanFace, ChevronRight, Activity } from 'lucide-react';

const Landing = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden flex items-center justify-center p-6">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1E3A8A] rounded-full blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#10B981] rounded-full blur-[120px] opacity-30 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* KIOSK MODE */}
        <div 
            onClick={() => onNavigate('kiosk')}
            className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-10 cursor-pointer hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20"
        >
            <div className="absolute top-6 right-6">
                <div className="h-3 w-3 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
            <div className="h-16 w-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:rotate-12 transition-transform duration-500">
                <ScanFace className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Mark Attendance</h2>
            <p className="text-slate-400 mb-8 text-lg">
                Touchless check-in station. AI-powered face recognition for students and staff.
            </p>
            <div className="flex items-center text-emerald-400 font-semibold group-hover:translate-x-2 transition-transform">
                <span>Enter Kiosk Mode</span>
                <ChevronRight className="ml-2" />
            </div>
        </div>

        {/* MANAGEMENT PORTAL */}
        <div 
            onClick={() => onNavigate('login')}
            className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-10 cursor-pointer hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20"
        >
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:-rotate-12 transition-transform duration-500">
                <ShieldCheck className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Management Portal</h2>
            <p className="text-slate-400 mb-8 text-lg">
                Secure access for Admins and Faculty to manage records and generate reports.
            </p>
            <div className="flex items-center text-blue-400 font-semibold group-hover:translate-x-2 transition-transform">
                <span>Staff Login</span>
                <ChevronRight className="ml-2" />
            </div>
        </div>

      </div>
      
      <div className="absolute bottom-8 text-slate-500 text-sm font-medium flex items-center">
        <Activity size={16} className="mr-2 text-blue-500" />
        System Operational • v2.5.0
      </div>
    </div>
  );
};

export default Landing;