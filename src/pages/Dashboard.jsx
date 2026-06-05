import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import { 
  Users, UserCircle, CheckCircle2, XCircle, 
  Clock, Filter, Calendar, Briefcase, Activity, 
  TrendingUp, TrendingDown, RefreshCw, LogIn, LogOut, Camera, X, CheckCircle, Trash2
} from 'lucide-react';

const Dashboard = ({ role, userEmail }) => {
  // --- STATE ---
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shiftData, setShiftData] = useState(null);
  
  // Sign-out modal state
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signOutStatus, setSignOutStatus] = useState('idle'); 
  const [signOutMessage, setSignOutMessage] = useState('');
  const signOutWebcamRef = useRef(null);
  
  // Enterprise Filters
  const [roleFilter, setRoleFilter] = useState(role === 'teacher' ? 'student' : 'all'); 
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // --- FETCH DATA ---
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/dashboard/stats`, {
        params: {
          role: role,
          email: userEmail,
          dept: selectedDept,
          batch: selectedBatch
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    if (role === 'teacher' && userEmail) {
      fetchShiftStatus();
    }
  }, [selectedDept, selectedBatch, role, userEmail]);

  const fetchShiftStatus = () => {
    axios.get(`/teacher/shift-status?email=${encodeURIComponent(userEmail)}`)
      .then(res => setShiftData(res.data))
      .catch(() => setShiftData(null));
  };

  const handleSignOutScan = async () => {
    if (!signOutWebcamRef.current) return;
    const imageSrc = signOutWebcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    setSignOutStatus('scanning');
    try {
      const blob = await fetch(imageSrc).then(r => r.blob());
      const file = new File([blob], 'signout.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await axios.post('/teacher/sign-out', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSignOutStatus('success');
      setSignOutMessage(res.data.message);
      setShiftData(prev => ({ ...prev, exit_time: res.data.exit_time, status: 'completed' }));
    } catch (err) {
      setSignOutStatus('error');
      setSignOutMessage(err.response?.data?.detail || 'Face not recognized. Try again.');
    }
  };

  const closeSignOutModal = () => {
    setShowSignOutModal(false);
    setSignOutStatus('idle');
    setSignOutMessage('');
  };

  // --- DELETE USER LOGIC ---
  const handleDeleteClick = (db_id, name, type) => {
    setUserToDelete({ id: db_id, name, type });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const endpoint = userToDelete.type === 'student' ? `/students/${userToDelete.id}` : `/teachers/${userToDelete.id}`;
      await axios.delete(endpoint);
      
      // Update local state to remove the user from recent logs instantly
      setStats(prev => {
        if (!prev) return prev;
        const newStats = { ...prev };
        if (userToDelete.type === 'student') {
          newStats.recent_student_logs = newStats.recent_student_logs.filter(log => log.db_id !== userToDelete.id);
        } else {
          newStats.recent_teacher_logs = newStats.recent_teacher_logs.filter(log => log.db_id !== userToDelete.id);
        }
        return newStats;
      });
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user. Check console for details.");
    } finally {
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  // --- DYNAMIC CALCULATIONS ---
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
    // FIXED: Added min-w-0 to prevent text from pushing the card out of bounds
    <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col justify-between relative overflow-hidden group min-w-0 w-full">
      <div className="flex justify-between items-start mb-2 md:mb-4 gap-1">
        <div className={`p-2.5 md:p-4 rounded-2xl ${colorClass.bg} ${colorClass.text} shrink-0`}>
          <Icon size={18} className="md:w-6 md:h-6" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 md:gap-1 text-[10px] md:text-sm font-bold shrink-0 ${trend >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend >= 75 ? <TrendingUp size={12} className="md:w-4 md:h-4" /> : <TrendingDown size={12} className="md:w-4 md:h-4" />}
            {trend}%
          </div>
        )}
      </div>
      <div className="z-10 relative mt-2 min-w-0">
        {/* FIXED: Scaled down text size slightly and added truncate to prevent word-wrap breaking */}
        <h3 className="text-xl sm:text-2xl md:text-4xl font-black text-slate-800 truncate leading-none">{value}</h3>
        <p className="text-[9px] sm:text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-wider mt-1 md:mt-1.5 truncate">{title}</p>
        {subtitle && <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 mt-0.5 md:mt-2 truncate">{subtitle}</p>}
      </div>
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${colorClass.bg}`}></div>
    </div>
  );

  return (
    // FIXED: Added w-full max-w-[100vw] overflow-x-hidden to absolutely prevent horizontal scrolling
    <div className="p-4 md:p-8 w-full max-w-[100vw] mx-auto space-y-4 md:space-y-8 animate-in fade-in duration-500 overflow-x-hidden">
      
      {/* TEACHER SHIFT CARD */}
      {role === 'teacher' && (
        <div className="bg-gradient-to-br from-[#1E3A8A] to-blue-700 rounded-3xl p-5 md:p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden w-full">
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/5 rounded-full"></div>
          
          <div className="relative">
            <div className="flex items-center flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-5">
              <Clock size={16} className="text-blue-200 shrink-0 md:w-5 md:h-5" />
              <h2 className="text-sm md:text-lg font-bold text-blue-100 tracking-tight shrink-0">Today's Shift</h2>
              <span className={`ml-auto px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                !shiftData || shiftData.status === 'not_started' ? 'bg-white/10 text-white/60' :
                shiftData.status === 'signed_in' ? 'bg-emerald-400/20 text-emerald-200' :
                'bg-purple-400/20 text-purple-200'
              }`}>
                {!shiftData || shiftData.status === 'not_started' ? 'Not Started' :
                 shiftData.status === 'signed_in' ? '● Active' : '✓ Completed'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-4 w-full">
              {/* Clock In */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/10 min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                  <div className="p-1 md:p-1.5 bg-emerald-400/20 rounded-lg shrink-0">
                    <LogIn size={10} className="text-emerald-300 md:w-3.5 md:h-3.5" />
                  </div>
                  <span className="text-[9px] md:text-xs font-bold text-white/60 uppercase tracking-wider truncate">Clock In</span>
                </div>
                <p className={`text-sm sm:text-lg md:text-2xl font-black tracking-tight truncate ${
                  shiftData?.entry_time ? 'text-white' : 'text-white/30'
                }`}>
                  {shiftData?.entry_time || '--:--'}
                </p>
              </div>
              
              {/* Clock Out */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/10 min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                  <div className="p-1 md:p-1.5 bg-amber-400/20 rounded-lg shrink-0">
                    <LogOut size={10} className="text-amber-300 md:w-3.5 md:h-3.5" />
                  </div>
                  <span className="text-[9px] md:text-xs font-bold text-white/60 uppercase tracking-wider truncate">Clock Out</span>
                </div>
                <p className={`text-sm sm:text-lg md:text-2xl font-black tracking-tight truncate ${
                  shiftData?.exit_time ? 'text-amber-200' : 'text-white/30'
                }`}>
                  {shiftData?.exit_time || '--:--'}
                </p>
              </div>
            </div>

            {/* Mark Shift Complete Button */}
            {shiftData?.status === 'signed_in' && (
              <button
                onClick={() => { setShowSignOutModal(true); setSignOutStatus('idle'); }}
                className="mt-4 md:mt-5 w-full flex items-center justify-center gap-1.5 md:gap-2 py-3 rounded-2xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/30 text-amber-200 font-bold text-[10px] md:text-sm transition-all duration-200"
              >
                <Camera size={12} className="md:w-4 md:h-4" />
                Mark Shift Complete
              </button>
            )}
          </div>
        </div>
      )}

      {/* HEADER & DATE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full">
        <div className="w-full md:w-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight truncate">Attendance Overview</h1>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-1.5 text-xs sm:text-sm">
            <Calendar size={14} className="shrink-0" />
            <span className="truncate">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 transition disabled:opacity-50 w-full md:w-auto shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* MASTER FILTER CONTROL BAR */}
      {role !== 'student' && (
      <div className="bg-white p-2 md:p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between gap-3 w-full">
        
        {/* FIXED: Switched from Flex to Grid-Cols-3 so buttons shrink properly and don't push the screen */}
        <div className={`grid ${role === 'teacher' ? 'grid-cols-1' : 'grid-cols-3'} bg-slate-50 p-1 rounded-xl w-full lg:w-auto border border-slate-100 gap-1`}>
          {(role === 'teacher' ? ['student'] : ['all', 'student', 'teacher']).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`w-full py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-bold capitalize truncate transition-all duration-300 ${
                roleFilter === r 
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {r === 'all' ? 'Institution' : `${r}s`}
            </button>
          ))}
        </div>

        {/* FIXED: Switched from Flex to Grid-Cols-2 so dropdowns stay inside bounds */}
        <div className="grid grid-cols-2 w-full lg:w-auto gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-2 md:py-2.5 rounded-xl border border-slate-200 focus-within:border-blue-300 w-full min-w-0">
            <Briefcase size={14} className="text-slate-400 shrink-0" />
            <select 
              value={selectedDept} 
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-[10px] sm:text-xs md:text-sm font-bold text-slate-700 outline-none cursor-pointer w-full truncate"
            >
              <option value="All">All Depts</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical">Electrical</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-2 md:py-2.5 rounded-xl border border-slate-200 focus-within:border-blue-300 w-full min-w-0">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <select 
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(e.target.value)}
              disabled={roleFilter === 'teacher'} 
              className="bg-transparent text-[10px] sm:text-xs md:text-sm font-bold text-slate-700 outline-none cursor-pointer w-full disabled:opacity-50 truncate"
            >
              <option value="All">All Batches</option>
              <option value="2024">Batch 2024</option>
              <option value="2025">Batch 2025</option>
              <option value="2026">Batch 2026</option>
            </select>
          </div>
        </div>
      </div>
      )}

      {/* METRICS DASHBOARD */}
      {loading && !stats ? (
        <div className="flex justify-center items-center py-20 md:py-32">
          <RefreshCw className="animate-spin text-blue-600" size={24} />
        </div>
      ) : (
        <div className="space-y-4 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 w-full">
          
          {/* KPI CARDS - Strict Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 w-full">
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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800 flex items-center gap-2 truncate">
                <Clock className="text-blue-600 shrink-0" size={16}/> 
                Live Activity Ledger
              </h3>
            </div>
            
            {/* Horizontal Scroll wrapper for Mobile Tables */}
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] md:text-xs uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
                    <th className="px-4 py-3 md:p-5 whitespace-nowrap">Name & ID</th>
                    <th className="px-4 py-3 md:p-5 whitespace-nowrap">Role</th>
                    <th className="px-4 py-3 md:p-5 whitespace-nowrap">Department</th>
                    <th className="px-4 py-3 md:p-5 text-right whitespace-nowrap">Status / Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  
                  {/* Map Students if filter allows */}
                  {(roleFilter === 'all' || roleFilter === 'student') && stats?.recent_student_logs?.map((log, i) => (
                    <tr key={`s-${i}`} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-3 md:p-5">
                        <p className="font-bold text-sm md:text-base text-slate-800 truncate max-w-[150px]">{log.name}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-0.5">{log.id}</p>
                      </td>
                      <td className="px-4 py-3 md:p-5">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold whitespace-nowrap">Student</span>
                      </td>
                      <td className="px-4 py-3 md:p-5 text-xs md:text-sm font-bold text-slate-600 whitespace-nowrap">{log.dept}</td>
                      <td className="px-4 py-3 md:p-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-600 flex items-center gap-1 text-xs md:text-sm font-bold whitespace-nowrap">
                              <CheckCircle2 size={14} className="md:w-4 md:h-4"/> {log.status}
                            </span>
                            <span className="text-[10px] md:text-xs text-slate-400 font-medium mt-1 whitespace-nowrap">{log.time}</span>
                          </div>
                          {role === 'admin' && (
                            <button onClick={() => handleDeleteClick(log.db_id, log.name, 'student')} className="ml-2 p-1.5 md:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Map Teachers if filter allows */}
                  {(roleFilter === 'all' || roleFilter === 'teacher') && stats?.recent_teacher_logs?.map((log, i) => (
                    <tr key={`t-${i}`} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-3 md:p-5">
                        <p className="font-bold text-sm md:text-base text-slate-800 truncate max-w-[150px]">{log.name}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-0.5">{log.id}</p>
                      </td>
                      <td className="px-4 py-3 md:p-5">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold whitespace-nowrap">Faculty</span>
                      </td>
                      <td className="px-4 py-3 md:p-5 text-xs md:text-sm font-bold text-slate-600 whitespace-nowrap">{log.dept}</td>
                      <td className="px-4 py-3 md:p-5 text-right flex justify-end gap-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex gap-3">
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] md:text-[10px] font-bold text-slate-400">IN</span>
                              <span className="text-xs md:text-sm font-bold text-teal-600 whitespace-nowrap">{log.entry}</span>
                            </div>
                            <div className="flex flex-col items-end pl-3 border-l border-slate-200">
                              <span className="text-[9px] md:text-[10px] font-bold text-slate-400">OUT</span>
                              <span className="text-xs md:text-sm font-bold text-rose-600 whitespace-nowrap">{log.exit}</span>
                            </div>
                          </div>
                          {role === 'admin' && (
                            <button onClick={() => handleDeleteClick(log.db_id, log.name, 'teacher')} className="ml-2 p-1.5 md:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Empty State */}
                  {((roleFilter === 'all' && stats?.recent_student_logs?.length === 0 && stats?.recent_teacher_logs?.length === 0) || 
                    (roleFilter === 'student' && stats?.recent_student_logs?.length === 0) || 
                    (roleFilter === 'teacher' && stats?.recent_teacher_logs?.length === 0)) && (
                    <tr>
                      <td colSpan="4" className="py-10 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                          <Activity className="text-slate-300" size={24}/>
                        </div>
                        <h4 className="text-sm md:text-base font-bold text-slate-700">No activity yet</h4>
                        <p className="text-[10px] md:text-xs text-slate-400 mt-1">Attendance logs for this filter will appear here.</p>
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SIGN OUT CAMERA MODAL (Kept identical to original but responsive) */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-[95%] max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 md:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-base md:text-lg">Verify Identity</h3>
                <p className="text-slate-400 text-[10px] md:text-xs mt-0.5">Face scan required to sign out</p>
              </div>
              <button onClick={closeSignOutModal} className="p-1.5 md:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
                <X size={16} className="md:w-4 md:h-4" />
              </button>
            </div>

            <div className="p-4 md:p-5">
              {signOutStatus === 'success' ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-emerald-500" />
                  </div>
                  <h4 className="text-lg md:text-xl font-bold text-slate-800 mb-1">Shift Complete!</h4>
                  <p className="text-slate-500 text-xs md:text-sm">{signOutMessage}</p>
                  <button onClick={closeSignOutModal} className="mt-6 px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition w-full">
                    Done
                  </button>
                </div>
              ) : signOutStatus === 'error' ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-3">
                    <X size={24} className="text-red-500" />
                  </div>
                  <p className="text-red-600 font-bold text-xs md:text-sm mb-4">{signOutMessage}</p>
                  <button onClick={() => setSignOutStatus('idle')} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition w-full">
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl overflow-hidden bg-black mb-4 relative" style={{aspectRatio: '4/3'}}>
                    <Webcam ref={signOutWebcamRef} audio={false} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: 'user' }} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400/70 rounded-tl-lg"></div>
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/70 rounded-tr-lg"></div>
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400/70 rounded-bl-lg"></div>
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400/70 rounded-br-lg"></div>
                    {signOutStatus === 'scanning' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-white font-bold text-xs animate-pulse">Verifying face...</div>
                      </div>
                    )}
                  </div>
                  <button onClick={handleSignOutScan} disabled={signOutStatus === 'scanning'} className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition text-xs">
                    <Camera size={14} />
                    {signOutStatus === 'scanning' ? 'Verifying...' : 'Capture & Sign Out'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-[95%] max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">Delete {userToDelete.type === 'student' ? 'Student' : 'Faculty'}</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to permanently delete <strong>{userToDelete.name}</strong>? This action cannot be undone and will remove all their records.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => { setDeleteModalOpen(false); setUserToDelete(null); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/30 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;