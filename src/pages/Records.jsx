import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Download, Calendar, Filter, FileSpreadsheet, 
  FileText, ChevronLeft, ChevronRight, RefreshCw, User 
} from 'lucide-react';

function Records({ showToast }) {
  // ==============================
  // 1. CONFIGURATION & STATE
  // ==============================
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination Settings
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  // ==============================
  // 2. DATA FETCHING
  // ==============================
  const fetchRecords = async () => {
    setLoading(true);
    try {
      // ✅ FIXED: Using dynamic hostname so it never breaks on new Wi-Fi
      const response = await axios.get('/records');
      setRecords(response.data);
    } catch (error) {
      console.error("Error fetching records:", error);
      if (showToast) showToast("Failed to load records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // ==============================
  // 3. EXPORT FUNCTIONS (Bulletproof Blob Method)
  // ==============================
  const handleExport = async (format) => {
    try {
        if (showToast) showToast(`Generating ${format.toUpperCase()}...`, "info");

        // ✅ FIXED: Using Axios to fetch the file as a Blob (Binary Data)
        const response = await axios.get(`/records/export?format=${format}`, {
            responseType: 'blob' 
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Attendease_Report.${format}`);
        
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Export Error:", error);
        if (showToast) showToast(`Failed to download ${format.toUpperCase()}`, "error");
    }
  };

  // ==============================
  // 4. FILTER & PAGINATION LOGIC
  // ==============================
  const filteredRecords = records.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    const name = record.student?.full_name || "";
    const roll = record.student?.roll_number || "";
    return name.toLowerCase().includes(searchLower) || roll.includes(searchLower);
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const currentRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ==============================
  // 5. RENDER THE PAGE
  // ==============================
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Attendance Reports</h1>
          <p className="text-slate-500 mt-1">View detailed logs and export class reports.</p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3">
          <button onClick={() => handleExport('csv')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition font-medium shadow-sm">
            <FileSpreadsheet size={18} className="text-green-600" />
            <span>Export CSV</span>
          </button>
          
          <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition font-medium shadow-sm">
            <FileText size={18} className="text-red-600" />
            <span>Export PDF</span>
          </button>

          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition font-medium">
            <Calendar size={18} />
            <span>Date Range</span>
          </button>
        </div>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Name or Roll ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>
        
        <button onClick={fetchRecords} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition" title="Refresh Data">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                <th className="px-6 py-5">Student Name</th>
                <th className="px-6 py-5">Roll No</th>
                <th className="px-6 py-5">Department</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Time</th>
                <th className="px-6 py-5 text-center">Status</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                  </tr>
                ))
              ) : currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                       <Filter size={40} className="opacity-20" />
                       <p>No attendance records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                          {record.student?.full_name?.charAt(0) || <User size={16} />}
                        </div>
                        <span className="font-semibold text-slate-700">
                          {record.student?.full_name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-500">{record.student?.roll_number || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.student?.department || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{record.time}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        record.status === 'Present' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                           record.status === 'Present' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}></span>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page <span className="font-medium text-slate-900">{currentPage}</span> of {totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Records;