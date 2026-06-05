import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

function LiveAttendance({ onExit }) { 
  const webcamRef = useRef(null);
  
  const [isScanning, setIsScanning] = useState(true);
  const [lastScanned, setLastScanned] = useState(null);
  const [status, setStatus] = useState("idle"); 

  // --- AUTOMATIC SCANNING LOOP ---
  useEffect(() => {
    let interval;
    if (isScanning && status === "idle") {
      interval = setInterval(() => {
        captureAndCheck();
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [isScanning, status]);

  const captureAndCheck = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const blob = await fetch(imageSrc).then((res) => res.blob());
      const file = new File([blob], "scan.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/attendance/mark', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;

      if (data.status === "success" || data.status === "already_marked") {
        setLastScanned(data);
        setStatus(data.status === "success" ? "success" : "warning");
        setIsScanning(false);
        
        setTimeout(() => {
          setStatus("idle");
          setLastScanned(null);
          setIsScanning(true);
        }, 4000);
      }
    } catch (error) {
      console.log("Scanning...");
      setStatus("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-50 md:static md:inset-auto flex flex-col items-center justify-center bg-black md:bg-slate-900 text-white w-full h-full overflow-hidden">
      
      {/* Background Ambience (Desktop Only) */}
      <div className="hidden md:block absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20"></div>
      </div>

      {/* HEADER: Floating on mobile, stacked on desktop */}
      <div className="absolute top-12 left-0 w-full z-20 text-center md:static md:w-auto md:mb-6 pointer-events-none drop-shadow-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 md:bg-slate-800/50 border border-slate-600 mb-2 backdrop-blur-md">
          <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <span className="text-[10px] md:text-xs font-mono tracking-widest text-slate-300 uppercase">
            {isScanning ? "Secure Connection Est." : "Processing Data..."}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-lg">
          Attendease <span className="text-white md:text-slate-600 text-xl md:text-2xl font-light">Vision</span>
        </h1>
      </div>

      {/* WEBCAM HUD CONTAINER */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full md:w-[360px] md:h-[640px] md:rounded-3xl overflow-hidden md:border-4 md:border-slate-800 md:shadow-[0_0_50px_-10px_rgba(6,182,212,0.2)] bg-black group">
        
        {/* Back Button */}
        <button 
          onClick={onExit} 
          className="absolute top-6 left-4 md:top-4 md:left-4 z-50 flex items-center gap-2 px-4 py-2 bg-slate-900/60 backdrop-blur-md border border-slate-600/50 rounded-full text-white hover:bg-red-500 hover:border-red-400 transition-all duration-300 shadow-lg cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold text-sm hidden sm:block md:block">Exit</span>
        </button>

        {/* Camera Feed */}
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          // 👇 FIXED: Changed to `object-contain` for mobile to prevent zooming/cropping. 
          // `md:object-cover` keeps desktop constrained nicely to its 9:16 box.
          className="absolute inset-0 w-full h-full object-contain md:object-cover opacity-90"
          // 👇 FIXED: Removed the hardcoded aspectRatio to let the phone use its native raw camera size.
          videoConstraints={{ facingMode: "user" }}
        />

        {/* HUD OVERLAY LAYERS */}
        
        {/* Corner Brackets */}
        <div className="absolute top-[20%] left-6 w-12 h-12 border-t-2 border-l-2 border-cyan-500/60 rounded-tl-lg pointer-events-none"></div>
        <div className="absolute top-[20%] right-6 w-12 h-12 border-t-2 border-r-2 border-cyan-500/60 rounded-tr-lg pointer-events-none"></div>
        <div className="absolute bottom-[20%] left-6 w-12 h-12 border-b-2 border-l-2 border-cyan-500/60 rounded-bl-lg pointer-events-none"></div>
        <div className="absolute bottom-[20%] right-6 w-12 h-12 border-b-2 border-r-2 border-cyan-500/60 rounded-br-lg pointer-events-none"></div>

        {/* Central Focus Ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-56 border border-white/20 rounded-full flex items-center justify-center">
              <div className="w-52 h-52 border border-cyan-500/30 rounded-full border-dashed animate-[spin_10s_linear_infinite]"></div>
            </div>
        </div>

        {/* Scanner Line (When Idle) */}
        {status === "idle" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-full h-1 bg-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[scan_3s_ease-in-out_infinite]"></div>
          </div>
        )}

        {/* Result Popup (Glass Card) */}
        {(status === "success" || status === "warning") && lastScanned && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm transition-all duration-300 z-40">
            <div className="bg-slate-800/90 p-8 rounded-2xl text-center w-64 md:w-72 shadow-2xl border-t-4 border-t-cyan-500 relative overflow-hidden">
              
              {/* Shine Effect */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

              {/* Avatar */}
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-3xl font-bold shadow-xl mb-4 border-2 border-slate-700 text-white">
                {lastScanned.name.charAt(0)}
              </div>

              <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{lastScanned.name}</h2>
              <p className="text-cyan-200 font-mono text-xs mb-6 opacity-80">ID: {lastScanned.id_value}</p>

              {(() => {
                const msg = lastScanned.message;
                const isTeacher = lastScanned.type === 'teacher';
                
                let badgeClass = '';
                let label = '';
                
                if (status === 'warning') {
                  badgeClass = 'bg-slate-500/20 text-slate-300 border-slate-500/30';
                  label = `● ${msg || 'Already Logged'}`;
                } else if (isTeacher && msg === 'Exit Recorded') {
                  badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  label = '● Exit Recorded';
                } else if (isTeacher && msg === 'Entry Recorded') {
                  badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                  label = '● Entry Recorded';
                } else {
                  badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                  label = '● Entry Authorized';
                }
                
                return (
                  <div className={`px-4 py-2 rounded-lg font-bold text-xs tracking-wider uppercase shadow-lg border ${badgeClass}`}>
                    {label}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Footer System Text */}
        <div className="absolute bottom-4 left-0 w-full flex justify-between px-6 text-[9px] font-mono text-slate-400/70 uppercase tracking-widest pointer-events-none">
          <span>Sys: Active</span>
          <span>Net: 12ms</span>
        </div>
      </div>
      
      {/* Tailwind Custom Animation for the Scanner Line */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(640px); }
        }
      `}} />
    </div>
  );
}

export default LiveAttendance;