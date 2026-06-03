import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
// We removed 'useNavigate' because your App.jsx handles the views manually

// 1. Accept 'onExit' as a prop here
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

      const response = await axios.post(`http://${window.location.hostname}:8000/attendance/mark`, formData, {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white overflow-hidden relative">
      
      {/* --- 2. FIXED EXIT BUTTON --- */}
      {/* Instead of navigate(), we call onExit() which tells App.jsx to close this tab */}
      <button 
        onClick={onExit} 
        className="absolute top-8 left-8 z-50 flex items-center gap-3 px-6 py-3 bg-slate-800/40 backdrop-blur-md border border-slate-600 rounded-full text-slate-300 hover:text-white hover:bg-blue-600/20 hover:border-blue-500 transition-all duration-300 group shadow-lg cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="font-mono tracking-widest uppercase text-sm font-semibold">Exit Terminal</span>
      </button>

      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]"></div>
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20"></div>
      </div>

      {/* HEADER */}
      <div className="z-10 text-center mb-10 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-800/50 border border-slate-700 mb-4 backdrop-blur-sm">
          <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            {isScanning ? "Secure Connection Est." : "Processing Data..."}
          </span>
        </div>
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-lg">
          Smart Gate <span className="text-slate-600 text-2xl font-light">v2.0</span>
        </h1>
      </div>

      {/* WEBCAM HUD CONTAINER */}
      <div className="relative z-10 group">
        
        {/* Camera Feed */}
        <div className="relative w-[680px] h-[510px] bg-black rounded-sm overflow-hidden border border-slate-800 shadow-[0_0_50px_-10px_rgba(6,182,212,0.15)]">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover opacity-80"
            videoConstraints={{ facingMode: "user" }}
          />

          {/* HUD OVERLAY LAYERS */}
          
          {/* Corner Brackets */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-lg"></div>
          <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-lg"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-lg"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-cyan-500/50 rounded-br-lg"></div>

          {/* Central Focus Ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-64 h-64 border border-white/10 rounded-full flex items-center justify-center">
                <div className="w-60 h-60 border border-white/5 rounded-full border-dashed animate-[spin_10s_linear_infinite]"></div>
             </div>
          </div>

          {/* Scanner Line (When Idle) */}
          {status === "idle" && (
            <div className="absolute inset-0">
              <div className="animate-scanner"></div>
            </div>
          )}

          {/* Result Popup (Glass Card) */}
          {(status === "success" || status === "warning") && lastScanned && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm transition-all duration-300">
              <div className="glass-card p-8 rounded-xl text-center max-w-sm w-full mx-6 animate-pop-in border-t-4 border-t-cyan-500 relative overflow-hidden">
                
                {/* Shine Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

                {/* Avatar */}
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl mb-4 border-4 border-slate-800">
                  {lastScanned.name.charAt(0)}
                </div>

                <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">{lastScanned.name}</h2>
               <p className="text-cyan-200 font-mono text-sm mb-6 opacity-80">ID: {lastScanned.id_value}</p>

                <div className={`px-6 py-3 rounded-lg font-bold text-sm tracking-wider uppercase shadow-lg border ${
                  status === "success" 
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}>
                  {status === "success" ? "● Entry Authorized" : "● Already Logged"}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer System Text */}
        <div className="absolute -bottom-10 left-0 w-full flex justify-between px-2 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          <span>Sys.Monitor: Active</span>
          <span>Face.Recog: Enabled</span>
          <span>Net.Latency: 12ms</span>
        </div>
      </div>
    </div>
  );
}

export default LiveAttendance;