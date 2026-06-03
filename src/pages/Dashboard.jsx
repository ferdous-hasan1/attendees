import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCircle, CheckCircle2, XCircle, Clock, Filter, LogIn, LogOut, Calendar} from 'lucide-react';

const Dashboard = () => {
  // --- STATE ---
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');

  // --- FETCH FILTERED DATA ---
  const fetchStats = async () => {
    setLoading(true);
    try {
      // Pass the filters directly to FastAPI via URL parameters!
      const response = await axios.get(`/dashboard/stats?dept=${selectedDept}&batch=${selectedBatch}`);
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever a filter changes
  useEffect(() => {
    fetchStats();
  }, [selectedDept, selectedBatch]);

  // --- HELPER COMPONENTS ---
  const StatCard = ({ title, value, type, colorClass, icon: Icon }) => (
    <div className={`p-6 rounded-3xl border ${colorClass} bg-white shadow-sm flex items-center gap-5`}>
      <div className={`p-4 rounded-2xl ${colorClass.replace('border-', 'bg-').replace('200', '50')} ${colorClass.replace('border-', 'text-').replace('200', '600')}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black text-slate-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Overview</h1>
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={selectedDept} 
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical">Electrical</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Calendar size={16} className="text-slate-400" />
            <select 
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Batches</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
      ) : (
        <>
          {/* STUDENT STATS */}
          <div>
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Users size={20}/> Student Attendance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Enrolled" value={stats.students.total} colorClass="border-blue-200" icon={Users} />
              <StatCard title="Present Today" value={stats.students.present} colorClass="border-emerald-200" icon={CheckCircle2} />
              <StatCard title="Absent Today" value={stats.students.absent} colorClass="border-red-200" icon={XCircle} />
            </div>
          </div>

          {/* FACULTY STATS */}
          <div>
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 mt-8"><UserCircle size={20}/> Faculty Attendance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Total Faculty" value={stats.teachers.total} colorClass="border-indigo-200" icon={UserCircle} />
              <StatCard title="On Campus" value={stats.teachers.present} colorClass="border-teal-200" icon={CheckCircle2} />
              <StatCard title="Off Campus" value={stats.teachers.absent} colorClass="border-rose-200" icon={XCircle} />
            </div>
          </div>

          {/* DUAL LOG TABLES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            
            {/* Student Logs */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-md font-bold text-slate-800 mb-4">Recent Student Activity</h3>
              <div className="space-y-3">
                {stats.recent_student_logs?.length === 0 ? <p className="text-slate-400 text-sm">No recent student logs.</p> : stats.recent_student_logs.map((log, i) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-slate-50 transition">
                    <div>
                      <p className="font-bold text-slate-700">{log.name}</p>
                      <p className="text-xs text-slate-400">{log.id} • {log.dept}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold">{log.status}</span>
                      <p className="text-xs text-slate-400 mt-1">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Logs (Entry/Exit) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-md font-bold text-slate-800 mb-4">Recent Faculty Activity</h3>
              <div className="space-y-3">
                {stats.recent_teacher_logs?.length === 0 ? <p className="text-slate-400 text-sm">No recent faculty logs.</p> : stats.recent_teacher_logs.map((log, i) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-slate-50 transition">
                    <div>
                      <p className="font-bold text-slate-700">{log.name}</p>
                      <p className="text-xs text-slate-400">{log.id} • {log.dept}</p>
                    </div>
                    <div className="flex gap-3 text-right">
                      <div className="flex flex-col items-center">
                         <span className="text-xs font-bold text-slate-400 flex items-center"><LogIn size={12} className="mr-1"/> IN</span>
                         <span className="text-sm font-bold text-teal-600">{log.entry}</span>
                      </div>
                      <div className="flex flex-col items-center border-l border-slate-200 pl-3">
                         <span className="text-xs font-bold text-slate-400 flex items-center"><LogOut size={12} className="mr-1"/> OUT</span>
                         <span className="text-sm font-bold text-rose-600">{log.exit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;