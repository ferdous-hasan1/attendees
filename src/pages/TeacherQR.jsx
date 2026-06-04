import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react'; 
import { ShieldAlert, RefreshCw, MapPin } from 'lucide-react';

const TeacherQR = () => {
  const [qrData, setQrData] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    fetchNewCode();
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchNewCode();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchNewCode = async () => {
    try {
      // Replace the old hardcoded IP with this dynamic line:
const response = await axios.get(`http://${window.location.hostname}:8000/teacher/live-qr`);
      setQrData(response.data.qr_string);
    } catch (error) {
      console.error("Failed to fetch live QR");
    }
  };

  // Extract just the 6 digits from "ATTENDEASE-XXXXXX"
  const displayCode = qrData ? qrData.split('-')[1] : '------';

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-50 animate-in fade-in">
      <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 text-center max-w-lg w-full">
        
        <div className="inline-flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-2xl mb-6">
           <ShieldAlert size={32} />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Live Attendance</h1>
        <p className="text-slate-500 mb-8 flex items-center justify-center gap-2">
            <MapPin size={16} /> GPS Geofencing Active
        </p>

        {/* The QR Code */}
        <div className="bg-white p-4 rounded-2xl border-4 border-[#1E3A8A] inline-block mb-6 shadow-inner transition-opacity duration-300">
           {qrData ? (
               <QRCodeSVG value={qrData} size={256} level="H" includeMargin={false} />
           ) : (
               <div className="w-[256px] h-[256px] flex items-center justify-center bg-slate-100">Loading...</div>
           )}
        </div>

        {/* 👇 THE NEW TEXT CODE DISPLAY 👇 */}
        <div className="mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Manual Entry Code</p>
            <div className="text-5xl font-mono font-bold text-[#1E3A8A] tracking-[0.25em] bg-blue-50 py-4 px-6 rounded-xl border border-blue-100 inline-block">
                {displayCode}
            </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4">
            <div 
                className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 10 ? 'bg-red-500' : 'bg-[#1E3A8A]'}`}
                style={{ width: `${(timeLeft / 30) * 100}%` }}
            ></div>
        </div>
        
        <div className="flex items-center justify-center gap-2 font-bold text-slate-600">
            <RefreshCw size={18} className={timeLeft < 5 ? 'animate-spin text-red-500' : ''} />
            Code expires in <span className={timeLeft < 10 ? 'text-red-500' : 'text-[#1E3A8A]'}>{timeLeft}s</span>
        </div>

      </div>
    </div>
  );
};
export default TeacherQR;