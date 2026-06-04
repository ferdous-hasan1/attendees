import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam'; 
import { Camera, Upload, User, Hash, Briefcase, Calendar, Save, Trash2, X, RefreshCw, Edit2, Search, Mail, Lock } from 'lucide-react';

function Students({ showToast }) {
  const [viewMode, setViewMode] = useState('list');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', roll: '', dept: '', batch: '' });
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const webcamRef = useRef(null);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      // ✅ FIXED: No more IP address! Relies on the global /api proxy
      const response = await axios.get('/students');
      
      if (Array.isArray(response.data)) {
          setStudents(response.data);
      } else {
          setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]); 
    }
  };

  const handleInputChange = (e) => { 
      setFormData({ ...formData, [e.target.name]: e.target.value }); 
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc).then(res => res.blob()).then(blob => {
        const capturedFile = new File([blob], "webcam_capture.jpg", { type: "image/jpeg" });
        setFile(capturedFile);
        setPreview(imageSrc);
        setUseCamera(false);
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);       
    data.append('roll', formData.roll);
    data.append('dept', formData.dept);
    data.append('batch', formData.batch);
    if (formData.password && formData.password.trim() !== "") {
        data.append('password', formData.password); 
    }
    if (file) data.append('file', file);

   try {
      if (isEditing) {
        // ✅ FIXED: Clean proxy route
        await axios.put(`/students/${editId}`, data);
        if (showToast) showToast("Student Updated", "success");
      } else {
        // ✅ FIXED: Clean proxy route
        await axios.post('/students/register', data);
        if (showToast) showToast("Student Registered", "success");
      }
      fetchStudents();
      cancelEdit();
      setViewMode('list'); 
    } catch (error) {
      if (showToast) showToast(error.response?.data?.detail || "Action failed", "error");
    }
  };

 const handleEditClick = (student) => {
    setFormData({ 
       name: student.full_name, 
       email: student.email, 
       password: '', 
       roll: student.roll_number, 
       dept: student.department, 
       batch: student.batch_year 
    });
    setEditId(student.id);
    setIsEditing(true);
    
    // ✅ FIXED: Image previews now use the /api proxy
    if (student.photo_path) {
        setPreview(`/api/${student.photo_path}`);
    } else {
        setPreview(null);
    }
    
    setViewMode('form');
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student and all their attendance records?")) {
      try {
        // ✅ FIXED: Clean proxy route
        await axios.delete(`/students/${id}`);
        if (showToast) showToast("Student deleted successfully", "success");
        fetchStudents(); 
      } catch (error) {
        console.error("Delete error:", error);
        if (showToast) showToast("Failed to delete student", "error");
      }
    }
  };

  const cancelEdit = () => {
    setFormData({ name: '', email: '', password: '', roll: '', dept: '', batch: '' });
    setIsEditing(false);
    setEditId(null);
    setFile(null);
    setPreview(null);
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || student.roll_number.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      
      {/* Top Header & Segmented Control */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
              <h1 className="text-3xl font-bold text-slate-800">Student Directory</h1>
              <p className="text-slate-500 mt-1">Manage enrollments and biometrics.</p>
          </div>
          
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button 
                  onClick={() => { setViewMode('list'); cancelEdit(); }}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-[#1E3A8A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Directory
              </button>
              <button 
                  onClick={() => setViewMode('form')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'form' ? 'bg-white text-[#1E3A8A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  {isEditing ? <Edit2 size={16} /> : <User size={16} />}
                  {isEditing ? 'Edit Profile' : 'New Enrollment'}
              </button>
          </div>
      </div>

      {/* --- VIEW 1: DIRECTORY LIST --- */}
      {viewMode === 'list' && (
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100">
             <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by name or roll number..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] outline-none transition-all font-medium"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 text-sm uppercase tracking-wider text-slate-400">
                            <th className="p-4 font-bold">Student</th>
                            <th className="p-4 font-bold">Email</th>
                            <th className="p-4 font-bold">Roll No.</th>
                            <th className="p-4 font-bold">Department</th>
                            <th className="p-4 font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((student) => (
                            <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img 
                                          // ✅ FIXED: Table images now securely use the /api proxy
                                          src={`/api/${student.photo_path}`} 
                                          alt="Face" 
                                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
                                          onError={(e) => e.target.src = "https://via.placeholder.com/40"} 
                                        />
                                        <span className="font-bold text-slate-800">{student.full_name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-500 font-medium">{student.email}</td>
                                <td className="p-4 text-slate-500 font-medium">{student.roll_number}</td>
                                <td className="p-4">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">{student.department}</span>
                                </td>
                                {/* ✅ Buttons are now permanently visible! ✅ */}
<td className="p-4">
    <div className="flex gap-2">
        <button onClick={() => handleEditClick(student)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
        <button onClick={() => handleDelete(student.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
    </div>
</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredStudents.length === 0 && (
                    <div className="text-center py-12 text-slate-500 font-medium">No students found.</div>
                )}
            </div>
          </div>
      )}

      {/* --- VIEW 2: REGISTRATION FORM --- */}
      {viewMode === 'form' && (
         <div className={`rounded-3xl shadow-xl border p-8 transition-all duration-500 ${isEditing ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
                <div className={`p-3 rounded-xl ${isEditing ? 'bg-amber-100 text-amber-600' : 'bg-[#1E3A8A]/10 text-[#1E3A8A]'}`}>
                    {isEditing ? <Edit2 size={24} /> : <User size={24} />}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Profile' : 'Student Enrollment'}</h2>
                    <p className={`text-sm font-medium ${isEditing ? 'text-amber-600' : 'text-slate-500'}`}>
                        {isEditing ? `Modifying ${formData.name}'s data` : 'Register a new face to the system'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* Column 1: Identity & Credentials */}
                <div className="space-y-5 lg:col-span-1">
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2"><User size={14}/> Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] outline-none font-medium" placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2"><Mail size={14}/> Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] outline-none font-medium" placeholder="student@university.edu" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2"><Lock size={14}/> Account Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={!isEditing} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] outline-none font-medium" placeholder={isEditing ? "(Leave blank to keep current)" : "••••••••"} />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2"><Hash size={14}/> Roll Number</label>
                        <input type="text" name="roll" value={formData.roll} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] outline-none font-medium uppercase" placeholder="CS001" />
                    </div>
                </div>

                {/* Column 2: Academics */}
                <div className="space-y-5 lg:col-span-1">
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2"><Briefcase size={14}/> Department</label>
                        <select name="dept" value={formData.dept} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] outline-none font-medium appearance-none">
                            <option value="">Select Dept</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Electrical">Electrical</option>
                            <option value="Mechanical">Mechanical</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2"><Calendar size={14}/> Batch Year</label>
                        <input type="text" name="batch" value={formData.batch} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] outline-none font-medium" placeholder="2026" />
                    </div>
                </div>

                {/* Column 3: Biometric Upload */}
                <div className="lg:col-span-1">
                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2"><Camera size={14}/> Biometric Face Data</label>
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center h-[260px] flex flex-col items-center justify-center relative overflow-hidden group">
                        
                        {useCamera ? (
                            <div className="absolute inset-0 bg-black z-10 flex flex-col">
                                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover opacity-80" />
                                <button type="button" onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                                    Snap Photo
                                </button>
                                <button type="button" onClick={() => setUseCamera(false)} className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full hover:bg-black/80"><X size={16}/></button>
                            </div>
                        ) : preview ? (
                            <div className="absolute inset-0 z-10">
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button type="button" onClick={() => {setPreview(null); setFile(null);}} className="bg-red-500 text-white p-3 rounded-full hover:scale-110 transition-transform"><Trash2 size={20}/></button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4"><Upload size={24} /></div>
                                <p className="text-sm font-bold text-slate-700 mb-1">Upload Photo</p>
                                <p className="text-xs text-slate-400 mb-4 px-4">Clear, frontal face required for AI encoding.</p>
                                
                                <div className="flex gap-2 w-full px-4">
                                    <label className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-50 transition-colors">
                                        Browse
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} required={!isEditing} />
                                    </label>
                                    <button type="button" onClick={() => setUseCamera(true)} className="flex-1 bg-[#1E3A8A] text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-900 transition-colors">
                                        Camera
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="lg:col-span-3 pt-6 border-t border-slate-100 flex justify-end gap-3">
                    {isEditing && (
                        <button type="button" onClick={() => {cancelEdit(); setViewMode('list');}} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                            Cancel
                        </button>
                    )}
                    <button type="submit" className={`px-8 py-3 font-bold text-white rounded-xl flex items-center gap-2 shadow-lg transition-transform hover:scale-105 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-[#1E3A8A] hover:bg-blue-900 shadow-blue-900/20'}`}>
                        <Save size={18} />
                        {isEditing ? 'Save Changes' : 'Enroll Student'}
                    </button>
                </div>
            </form>
         </div>
      )}
    </div>
  );
}

export default Students;