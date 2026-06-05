import React, { useState } from 'react';
import axios from 'axios';
import { Shield, User, ChevronLeft, ArrowRight, AlertCircle, GraduationCap } from 'lucide-react';

const Login = ({ onLogin, onBack }) => {
  const [activeRole, setActiveRole] = useState('admin'); // 'admin', 'teacher', or 'student'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { id: 'admin', label: 'Admin', icon: Shield, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'teacher', label: 'Teacher', icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'student', label: 'Student', icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-50' }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email.trim()); 
      formData.append('password', password);
      formData.append('role', activeRole);

      const response = await axios.post('/login', formData);

      localStorage.setItem('adminToken', response.data.access_token);
      onLogin(response.data.role, email); 

    } catch (err) {
      console.error(err);
      setError('Invalid credentials. Access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // FIXED: Changed min-h-screen to min-h-[100dvh] for better mobile browser support
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-4 relative">
      
      {/* FIXED: Adjusted Back Button for mobile screens */}
      <button 
        onClick={onBack} 
        className="absolute top-6 left-4 md:top-8 md:left-8 flex items-center text-slate-500 hover:text-[#1E3A8A] transition-colors text-sm md:text-base"
      >
        <ChevronLeft size={20} className="mr-1" /> 
        <span className="hidden sm:inline">Back to Home</span>
        <span className="sm:hidden">Back</span>
      </button>

      {/* Main Card Container */}
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-10 border border-slate-100 mt-8 md:mt-0">
        
        {/* Dynamic Header Section */}
        <div className="text-center mb-8">
            <div className="h-12 w-12 bg-[#1E3A8A] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/30">
                <span className="text-white font-bold text-2xl">A</span>
            </div>
            
            {/* FIXED: Dynamic Title based on selected role */}
            <h1 className="text-2xl font-bold text-slate-900">
                {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} Portal
            </h1>
            
            {/* FIXED: Dynamic Subtitle */}
            <p className="text-slate-500 mt-1 text-sm md:text-base">
                {activeRole === 'student' ? 'Student Access' : 'Authorized Personnel Only'}
            </p>
        </div>

        {/* Error Message Box */}
        {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-3 md:p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border border-red-200 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0" />
                <p>{error}</p>
            </div>
        )}

        {/* Role Selectors */}
       {/* FIXED: Reduced gap and padding for better mobile fit */}
       <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
            {roles.map((role) => (
                <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                        setActiveRole(role.id);
                        setError('');
                        // FIXED: Clear inputs when switching roles
                        setEmail('');
                        setPassword('');
                    }}
                    className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all duration-300 ${
                        activeRole === role.id 
                        ? `border-[#1E3A8A] bg-blue-50/50 scale-105 shadow-md` 
                        : 'border-transparent bg-slate-50 hover:bg-slate-100 grayscale hover:grayscale-0'
                    }`}
                >
                    <role.icon className={`mb-1 md:mb-2 w-6 h-6 md:w-7 md:h-7 ${activeRole === role.id ? role.color : 'text-slate-400'}`} />
                    <span className={`text-xs md:text-sm font-semibold ${activeRole === role.id ? 'text-slate-900' : 'text-slate-500'}`}>
                        {role.label}
                    </span>
                </button>
            ))}
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">
                    {activeRole} Email
                </label>
                <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent outline-none transition-all font-medium text-slate-900 text-sm md:text-base"
                    placeholder={`Enter ${activeRole} Email`}
                />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent outline-none transition-all font-medium text-slate-900 text-sm md:text-base"
                    placeholder="••••••••"
                />
            </div>
            
            <button 
                type="submit"
                disabled={isLoading} 
                className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold py-3.5 md:py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center group mt-6 disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
            >
                <span>{isLoading ? 'Verifying...' : 'Access Dashboard'}</span>
                {!isLoading && <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
            </button>
        </form>

      </div>
    </div>
  );
};

export default Login;