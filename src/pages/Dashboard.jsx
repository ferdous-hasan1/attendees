import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, UserCircle, CheckCircle2, XCircle, 
  Clock, Filter, Calendar, Briefcase, Activity, 
  TrendingUp, TrendingDown, RefreshCw 
} from 'lucide-react';
const Dashboard = ({ role }) => {
  // --- STATE ---
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Enterprise Filters
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'student', 'teacher'
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');

  // --- FETCH DATA ---
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/dashboard/stats?dept=${selectedDept}&batch=${selectedBatch}`);
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedDept, selectedBatch]);

  // --- DYNAMIC CALCULATIONS ---
  // We calculate the numbers based on what the Admin wants to see (Students, Teachers, or Both)
  const getMetrics = () => {
    if (!stats) return { total: 0, present: 0, absent: 0, rate: 0 };
    
    let total = 0; let present = 0; let absent = 0;

    if (roleFilter === 'all' || roleFilter === 'student') {
      total += stats.students.total;
      present += stats.students.present;
      absent += stats.students.absent;
    }
    if (roleFilter === 'all' || roleFilter === 'teacher') {
      total += stats.teachers.total;
      present += stats.teachers.present;
      absent += stats.teachers.absent;
    }

    const rate = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, absent, rate };
  };

  const metrics = getMetrics();

  // --- HELPER COMPONENTS ---
  const MetricCard = ({ title, value, subtitle, icon: Icon, colorClass, trend }) => (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-4 rounded-2xl ${colorClass.bg} ${colorClass.text}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-bold ${trend >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend >= 75 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {trend}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-4xl font-black text-slate-800">{value}</h3>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-1">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
      </div>
      {/* Decorative background blur */}
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${colorClass.bg}`}></div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER & DATE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Attendance Overview</h1>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
            <Calendar size={16} />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* MASTER FILTER CONTROL BAR */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
        
        {/* Role Segmented Control */}
        <div className="flex bg-slate-50 p-1 rounded-xl w-full lg:w-auto border border-slate-100">
          {['all', 'student', 'teacher'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`flex-1 lg:px-8 py-2.5 rounded-lg text-sm font-bold capitalize transition-all duration-300 ${
                roleFilter === r 
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {r === 'all' ? 'Institution' : `${r}s`}
            </button>
          ))}
        </div>

        {/* Dropdown Filters */}
        <div className="flex w-full lg:w-auto gap-3 px-2">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
            <Briefcase size={16} className="text-slate-400" />
            <select 
              value={selectedDept} 
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full"
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical">Electrical</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>

          <div className="flex-1 flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(e.target.value)}
              disabled={roleFilter === 'teacher'} // Teachers don't have batches
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full disabled:opacity-50"
            >
              <option value="All">All Batches</option>
              <option value="2024">Batch 2024</option>
              <option value="2025">Batch 2025</option>
              <option value="2026">Batch 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* METRICS DASHBOARD */}
      {loading && !stats ? (
        <div className="flex justify-center items-center py-32">
          <RefreshCw className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Total Enrolled" 
              value={metrics.total} 
              icon={Users} 
              colorClass={{ bg: 'bg-blue-50', text: 'text-blue-600' }} 
            />
            <MetricCard 
              title="Present Today" 
              value={metrics.present} 
              trend={metrics.rate}
              icon={CheckCircle2} 
              colorClass={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }} 
            />
            <MetricCard 
              title="Absent Today" 
              value={metrics.absent} 
              icon={XCircle} 
              colorClass={{ bg: 'bg-rose-50', text: 'text-rose-600' }} 
            />
            <MetricCard 
              title="Health Rate" 
              value={`${metrics.rate}%`} 
              subtitle="Target: > 75%"
              icon={Activity} 
              colorClass={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }} 
            />
          </div>

          {/* UNIFIED ACTIVITY LEDGER */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Clock className="text-blue-600" size={20}/> 
                Live Activity Ledger
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                    <th className="p-5">Name & ID</th>
                    <th className="p-5">Role</th>
                    <th className="p-5">Department</th>
                    <th className="p-5 text-right">Status / Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  
                  {/* Map Students if filter allows */}
                  {(roleFilter === 'all' || roleFilter === 'student') && stats?.recent_student_logs?.map((log, i) => (
                    <tr key={`s-${i}`} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-5">
                        <p className="font-bold text-slate-800">{log.name}</p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">{log.id}</p>
                      </td>
                      <td className="p-5">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">Student</span>
                      </td>
                      <td className="p-5 text-sm font-bold text-slate-600">{log.dept}</td>
                      <td className="p-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-600 flex items-center gap-1 text-sm font-bold">
                            <CheckCircle2 size={14}/> {log.status}
                          </span>
                          <span className="text-xs text-slate-400 font-medium mt-1">{log.time}</span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Map Teachers if filter allows */}
                  {(roleFilter === 'all' || roleFilter === 'teacher') && stats?.recent_teacher_logs?.map((log, i) => (
                    <tr key={`t-${i}`} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-5">
                        <p className="font-bold text-slate-800">{log.name}</p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">{log.id}</p>
                      </td>
                      <td className="p-5">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">Faculty</span>
                      </td>
                      <td className="p-5 text-sm font-bold text-slate-600">{log.dept}</td>
                      <td className="p-5 text-right flex justify-end gap-4">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-slate-400">IN</span>
                          <span className="text-sm font-bold text-teal-600">{log.entry}</span>
                        </div>
                        <div className="flex flex-col items-end pl-4 border-l border-slate-200">
                          <span className="text-xs font-bold text-slate-400">OUT</span>
                          <span className="text-sm font-bold text-rose-600">{log.exit}</span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Empty State */}
                  {((roleFilter === 'all' && stats?.recent_student_logs?.length === 0 && stats?.recent_teacher_logs?.length === 0) || 
                    (roleFilter === 'student' && stats?.recent_student_logs?.length === 0) || 
                    (roleFilter === 'teacher' && stats?.recent_teacher_logs?.length === 0)) && (
                    <tr>
                      <td colSpan="4" className="py-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                          <Activity className="text-slate-300" size={32}/>
                        </div>
                        <h4 className="text-lg font-bold text-slate-700">No activity yet</h4>
                        <p className="text-sm text-slate-400 mt-1">Attendance logs for this filter will appear here.</p>
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Dashboard;