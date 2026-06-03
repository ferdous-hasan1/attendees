import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, QrCode, Calendar, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const StudentDashboard = ({ userEmail, onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      // Safety check: wait until the email is ready
      if (!userEmail) return; 
      
      try {
        // ✅ FIXED: Using proxy route so it never breaks on new Wi-Fi
        const response = await axios.get(`/student/dashboard?email=${userEmail}`);
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  // 👇 FIXED: This array absolutely stops the infinite loop!
  }, [userEmail]); 

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
         <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1E3A8A]"></div>
         <span className="mt-4 text-slate-500 font-bold tracking-widest uppercase text-sm">Loading Profile...</span>
      </div>
    );
  }

  if (!stats) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
          <AlertCircle size={48} className="mb-4 text-red-400" />
          <p className="font-bold">Failed to load profile data.</p>
       </div>
    );
  }

  // 🧮 MATH: Calculate the ring color based on the 75% rule
  const percentage = stats.attendance_percentage || 0;
  const ringColor = percentage >= 75 ? 'text-emerald-500' : 'text-red-500';
  const ringStroke = percentage >= 75 ? 'stroke-emerald-500' : 'stroke-red-500';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* --- WELCOME BANNER --- */}
        <div className="bg-slate-900 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-blue-900/10">
             <img 
                // ✅ FIXED: Image points to the secure proxy
                src={`/api/${stats.photo_path}`} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-800 shadow-lg"
                onError={(e) => e.target.src = "https://via.placeholder.com/100"}
             />
             <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {stats.student_name}!</h1>
                <p className="text-slate-400 font-medium">Roll No: <span className="text-blue-400">{stats.roll_number}</span> | Student Portal</p>
             </div>
        </div>

        {/* --- TWO COLUMN LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Health Metrics & Actions */}
            <div className="lg:col-span-1 space-y-8">
                
                {/* 75% Rule Progress Ring */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Attendance Health</h2>
                    <div className="relative w-40 h-40 mx-auto mb-6">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Background Circle */}
                            <circle className="text-slate-100 stroke-current" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent"></circle>
                            {/* Progress Circle */}
                            <circle 
                                className={`${ringStroke} stroke-current drop-shadow-md transition-all duration-1000 ease-out`} 
                                strokeWidth="10" 
                                strokeLinecap="round" 
                                cx="50" cy="50" r="40" 
                                fill="transparent" 
                                strokeDasharray="251.2" 
                                strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                            ></circle>
                        </svg>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <span className={`text-4xl font-black ${ringColor}`}>{percentage}%</span>
                        </div>
                    </div>
                    <p className={`text-sm font-bold ${percentage >= 75 ? 'text-slate-500' : 'text-red-500'}`}>
                        {percentage >= 75 ? '✅ Above 75% requirement.' : '⚠️ Warning: Below 75%!'}
                    </p>
                </div>

                {/* Smart Action Panel */}
                <div className="bg-gradient-to-br from-blue-600 to-[#1E3A8A] rounded-3xl p-8 shadow-xl shadow-blue-900/20 text-center">
                    <h2 className="text-white font-bold text-xl mb-2">Live Class?</h2>
                    <p className="text-blue-100 text-sm font-medium mb-8">Scan the teacher's QR code or use GPS to mark your attendance.</p>
                    <button 
                        // ✅ FIXED: Routes cleanly to your StudentPortal scanner!
                        onClick={() => onNavigate('student-portal')}
                        className="w-full bg-white text-[#1E3A8A] font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 hover:scale-105 transition-transform"
                    >
                        <QrCode size={22} />
                        Mark Attendance
                    </button>
                </div>
            </div>

            {/* Column 2: Recent Logs */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={20} /></div>
                        Recent Logs
                    </h2>
                    <span className="text-sm font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-full">
                        {stats.present_days} / {stats.total_classes_held} Days Present
                    </span>
                </div>
                
                <div className="space-y-4">
                    {stats.recent_logs?.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            No attendance records found yet.
                        </div>
                    ) : (
                        stats.recent_logs?.map((log, index) => (
                            <div key={index} className="flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors rounded-2xl border border-slate-100 group">
                                <div className="flex items-center gap-5">
                                    <div className={`p-3 rounded-full shadow-sm ${log.status === 'Present' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {log.status === 'Present' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{log.date}</p>
                                        <p className="text-sm font-semibold text-slate-400 flex items-center gap-1 mt-0.5"><Clock size={14}/> {log.time}</p>
                                    </div>
                                </div>
                                <span className={`px-5 py-2 rounded-full text-sm font-black tracking-wide uppercase ${log.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {log.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default StudentDashboard;