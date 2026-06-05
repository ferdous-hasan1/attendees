import React, { useState } from 'react';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import { MapPin, ScanLine, CheckCircle, AlertTriangle, Keyboard, Camera } from 'lucide-react';

const StudentPortal = ({ userEmail }) => {
    const [mode, setMode] = useState('scan'); // 'scan' or 'manual'
    const [totpInput, setTotpInput] = useState('');
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // --- PREMIUM AUDIO & VOICE ALERTS ---
    const playSuccessAudio = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.log("Audio not supported");
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance("Attendance marked.");
            utterance.rate = 1.0;
            utterance.pitch = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    };

    // This function handles BOTH manual typing and automatic camera scanning
    const handleMarkAttendance = (codeToSubmit) => {
        setStatus('locating');
        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMessage('GPS is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await axios.post('/attendance/qr-mark', {
                        email: userEmail,
                        totp_code: codeToSubmit,
                        latitude: latitude,
                        longitude: longitude
                    });

                    playSuccessAudio();
                    setStatus('success');

                } catch (error) {
                    setStatus('error');

                    // --- CRASH-PROOF ERROR EXTRACTOR ---
                    const detail = error.response?.data?.detail;
                    let finalMessage = "An unexpected error occurred.";

                    if (Array.isArray(detail)) {
                        finalMessage = `Validation Error: ${detail[0].loc[1]} - ${detail[0].msg}`;
                    } else if (typeof detail === 'string') {
                        finalMessage = detail;
                    }

                    setErrorMessage(finalMessage);
                }
            },
            (error) => {
                setStatus('error');
                setErrorMessage('Location access was denied. Please enable GPS.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-slate-900 animate-in fade-in">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-slate-200">

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ScanLine size={32} />
                    </div>
                    <h1 className="text-2xl font-bold">Class Check-In</h1>
                    <p className="text-slate-500 text-sm mt-1">Scan the board or enter the code.</p>
                </div>

                {/* Toggle Mode Buttons */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => setMode('scan')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'scan' ? 'bg-white text-[#1E3A8A] shadow-sm' : 'text-slate-500'}`}
                    >
                        <Camera size={16} /> Scan QR
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'manual' ? 'bg-white text-[#1E3A8A] shadow-sm' : 'text-slate-500'}`}
                    >
                        <Keyboard size={16} /> Type Code
                    </button>
                </div>

                {/* THE CAMERA SCANNER */}
                {mode === 'scan' && status !== 'success' && (
                    <div className="rounded-2xl overflow-hidden border-4 border-slate-100 mb-6 relative bg-black">
                        <Scanner
                            onScan={(result) => {
                                if (result && result.length > 0) {
                                    let rawText = result[0].rawValue;

                                    if (rawText) {
                                        const cleanCode = rawText.replace("ATTENDEASE-", "").trim();
                                        setTotpInput(cleanCode);
                                        handleMarkAttendance(cleanCode);
                                    }
                                }
                            }}
                            onError={(error) => console.log(error?.message)}
                            scanDelay={1000}
                        />
                        <div className="absolute bottom-2 left-0 right-0 text-center text-white/70 text-xs font-bold">
                            Point camera at projector
                        </div>
                    </div>
                )}

                {/* THE MANUAL INPUT */}
                {mode === 'manual' && status !== 'success' && (
                    <>
                        <input
                            type="text"
                            placeholder="XXXXXX"
                            value={totpInput}
                            onChange={(e) => setTotpInput(e.target.value.toUpperCase())}
                            disabled={status === 'locating'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-2xl font-mono tracking-widest outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 mb-6 uppercase disabled:opacity-50"
                        />
                        {status === 'idle' && (
                            <button
                                onClick={() => handleMarkAttendance(totpInput)}
                                disabled={totpInput.length < 6}
                                className="w-full bg-[#1E3A8A] hover:bg-blue-900 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg"
                            >
                                Verify & Mark Present
                            </button>
                        )}
                    </>
                )}

                {/* Status Messages */}
                {status === 'locating' && (
                    <button disabled className="w-full bg-amber-500 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg animate-pulse mt-4">
                        <MapPin className="animate-bounce" size={20} /> Verifying GPS Location...
                    </button>
                )}

                {status === 'error' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex flex-col items-center text-center animate-in shake mt-4">
                        <AlertTriangle size={40} className="mb-2 text-red-500" />
                        <span className="font-bold text-lg">Access Denied</span>
                        <span className="text-sm mt-1">{errorMessage}</span>
                        <button onClick={() => setStatus('idle')} className="mt-4 px-6 py-2 bg-red-100 rounded-lg text-sm font-bold text-red-700 hover:bg-red-200 transition">Try Again</button>
                    </div>
                )}
            </div>

            {/* 👇 FIXED: NEW FULL-SCREEN SUCCESS POPUP MODAL 👇 */}
            {status === 'success' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300 relative">
                        
                        {/* Premium Green Header */}
                        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Decorative background circles */}
                            <div className="absolute top-[-20%] left-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            
                            {/* Bouncing Check Icon */}
                            <div className="bg-white rounded-full p-3 shadow-lg shadow-emerald-900/20 mb-2 animate-bounce">
                                <CheckCircle size={48} className="text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Success!</h2>
                        </div>

                        {/* Card Body */}
                        <div className="p-8 text-center bg-white">
                            <p className="text-slate-800 font-bold text-lg mb-1">Attendance Logged</p>
                            <p className="text-slate-500 text-sm mb-8">Your GPS location matches the campus zone. You have been marked present for this session.</p>
                            
                            <button 
                                onClick={() => { 
                                    setStatus('idle'); 
                                    setTotpInput(''); 
                                    setMode('scan'); 
                                }} 
                                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors shadow-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default StudentPortal;