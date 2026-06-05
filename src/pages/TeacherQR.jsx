import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react'; 
import { ShieldAlert, RefreshCw, MapPin, CheckCircle } from 'lucide-react';

const TeacherQR = () => {
  const [qrData, setQrData] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [notifications, setNotifications] = useState([]);
  const lastIdRef = useRef(0);

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

    const pollAttendance = async (isInit = false) => {
      try {
        const res = await axios.get(`/teacher/recent-attendance?last_id=${lastIdRef.current}`);
        if (res.data && res.data.length > 0) {
          const maxId = Math.max(...res.data.map(r => r.id));
          lastIdRef.current = maxId;
          
          if (!isInit) {
            setNotifications(prev => [...prev, ...res.data]);
            
            res.data.forEach(notif => {
              setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== notif.id));
              }, 5000);
            });
          }
        }
      } catch (error) {
        console.error("Polling error", error);
      }
    };
    
    pollAttendance(true);
    const pollTimer = setInterval(() => pollAttendance(false), 3000);

    return () => {
      clearInterval(timer);
      clearInterval(pollTimer);
    };
  }, []);

  const fetchNewCode = async () => {
    try {
      const response = await axios.get('/teacher/live-qr');
      setQrData(response.data.qr_string);
    } catch (error) {
      console.error("Failed to fetch live QR");
    }
  };

  const displayCode = qrData ? qrData.split('-')[1] : '------';

  return (
    // FIXED: Ensured it completely fills the space and centers contents perfectly without forcing a scrollbar
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-4 bg-slate-50/50 relative overflow-y-auto animate-in fade-in">
      
      {/* FIXED: Compacted the padding and maximum width so it fits vertically on laptops */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 text-center w-full max-w-[360px] md:max-w-[400px] mx-auto my-auto flex flex-col items-center justify-center">
        
        {/* Compacted Icon */}
        <div className="inline-flex items-center justify-center p-2.5 bg-red-50 text-red-600 rounded-2xl mb-3 md:mb-4">
           <ShieldAlert className="w-6 h-6 md:w-7 md:h-7" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Live Attendance</h1>
        <p className="text-xs text-slate-500 mb-4 flex items-center justify-center gap-1.5">
            <MapPin size={14} /> GPS Geofencing Active
        </p>

        {/* FIXED: QR Code sizing reduced to 180px so it doesn't push the card out of the screen */}
        <div className="bg-white p-3 rounded-2xl border-[3px] border-[#1E3A8A] inline-block mb-4 shadow-inner transition-opacity duration-300">
           {qrData ? (
               <QRCodeSVG 
                  value={qrData} 
                  size={180} 
                  style={{ width: "100%", height: "auto", maxWidth: "180px", maxHeight: "180px" }}
                  level="H" 
                  includeMargin={false} 
               />
           ) : (
               <div className="w-[160px] h-[160px] md:w-[180px] md:h-[180px] flex items-center justify-center bg-slate-100 text-slate-400 text-sm">Loading...</div>
           )}
        </div>

        {/* Compacted Manual Entry */}
        <div className="mb-4 w-full">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Manual Entry Code</p>
            <div className="text-3xl md:text-3xl font-mono font-bold text-[#1E3A8A] tracking-[0.2em] bg-blue-50 py-3 px-4 rounded-xl border border-blue-100 inline-block w-full">
                {displayCode}
            </div>
        </div>

        {/* Compacted Progress Bar */}
        <div className="w-full bg-slate-100 h-2 md:h-2.5 rounded-full overflow-hidden mb-3">
            <div 
                className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 10 ? 'bg-red-500' : 'bg-[#1E3A8A]'}`}
                style={{ width: `${(timeLeft / 30) * 100}%` }}
            ></div>
        </div>
        
        <div className="flex items-center justify-center gap-1.5 text-xs md:text-sm font-bold text-slate-600">
            <RefreshCw size={14} className={`${timeLeft < 5 ? 'animate-spin text-red-500' : ''}`} />
            Code expires in <span className={timeLeft < 10 ? 'text-red-500' : 'text-[#1E3A8A]'}>{timeLeft}s</span>
        </div>

      </div>

      {/* Popups slightly adjusted so they look great on desktop and mobile */}
      <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 flex flex-col gap-3 z-50 pointer-events-none">
        {notifications.map((notif) => (
          <div key={notif.id} className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 md:px-5 md:py-3.5 rounded-2xl shadow-xl shadow-emerald-900/10 flex items-center gap-3 animate-in slide-in-from-right-8 fade-in duration-300 max-w-[250px] md:max-w-xs">
            <CheckCircle className="text-emerald-500 shrink-0" size={20} />
            <div className="truncate">
              <p className="font-bold text-xs md:text-sm truncate">{notif.student_name}</p>
              <p className="text-[10px] md:text-xs text-emerald-600 font-medium">Marked present</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherQR;