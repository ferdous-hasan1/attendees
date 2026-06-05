import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bell, User, Monitor, Save, Loader2 } from "lucide-react";

const Section = ({ title, icon: Icon, desc, children }) => (
  <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 mb-6">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500 font-medium">{desc}</p>
      </div>
    </div>
    <div className="space-y-6">{children}</div>
  </div>
);

// 👇 FIXED: Receiving userEmail as a prop
const Settings = ({ showToast, userRole, userEmail }) => {
  // --- NEW STATE FOR PROFILE DATA ---
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Existing states
  const [emailNotif, setEmailNotif] = useState(true);
  const [securityAlert, setSecurityAlert] = useState(true);
  const [confidence, setConfidence] = useState(91);

  // --- NEW: FETCH PROFILE DATA FROM ENDPOINT ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userEmail || !userRole) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        // Hitting the new Python endpoint you created
        const response = await axios.get("/profile", {
          params: { email: userEmail, role: userRole },
        });

        // Populate the state with the database response
        setProfileName(response.data.name);
        setProfileEmail(response.data.email);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (showToast) showToast("Failed to load profile details.", "error");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [userEmail, userRole, showToast]);

  const handleSave = () => {
    if (showToast) showToast("Settings saved successfully!", "success");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your account and preferences.
        </p>
      </div>

      {/* 1. PROFILE SECTION */}
      <Section
        title={userRole === "admin" ? "Admin Profile" : "My Profile"}
        icon={User}
        desc={
          userRole === "admin"
            ? "Update your faculty credentials"
            : "View your personal details"
        }
      >
        {isLoadingProfile ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-[#1E3A8A]" size={28} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
                Full Name
              </label>
              {/* 👇 FIXED: Bound input to state */}
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800 focus:ring-2 focus:ring-blue-100"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
                Email Address
              </label>
              {/* 👇 FIXED: Bound input to state and disabled it so they can't change their login ID */}
              <input
                type="email"
                value={profileEmail}
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl outline-none font-medium text-slate-500 cursor-not-allowed"
                placeholder="Your Email"
              />
            </div>
          </div>
        )}
      </Section>

      {/* 2. ADMIN ONLY: NOTIFICATIONS */}
      {userRole === "admin" && (
        <Section
          title="Notifications & Alerts"
          icon={Bell}
          desc="Manage real-time system alerts"
        >
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-bold text-slate-800">Daily Report Email</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Send attendance summary at 5:00 PM
              </p>
            </div>
            <button
              onClick={() => setEmailNotif(!emailNotif)}
              className={`w-12 h-6 rounded-full transition-colors relative ${emailNotif ? "bg-blue-600" : "bg-slate-300"}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${emailNotif ? "translate-x-7" : "translate-x-1"}`}
              ></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-bold text-slate-800">Security Breach Alert</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Notify immediately if unknown face persists
              </p>
            </div>
            <button
              onClick={() => setSecurityAlert(!securityAlert)}
              className={`w-12 h-6 rounded-full transition-colors relative ${securityAlert ? "bg-blue-600" : "bg-slate-300"}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${securityAlert ? "translate-x-7" : "translate-x-1"}`}
              ></div>
            </button>
          </div>
        </Section>
      )}

      {/* 3. ADMIN ONLY: AI & CAMERA */}
      {userRole === "admin" && (
        <Section
          title="AI & Camera Config"
          icon={Monitor}
          desc="Adjust face detection parameters"
        >
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold uppercase text-slate-400">
                Confidence Threshold
              </label>
              <span className="text-xs font-bold text-blue-600">
                {confidence}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="99"
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Loose (30%)
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Strict (99%)
              </span>
            </div>
          </div>
        </Section>
      )}

      {/* SAVE BUTTON */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoadingProfile}
          className="px-8 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          <Save size={18} /> Save Changes
        </button>
      </div>
    </div>
  );
};

export default Settings;
