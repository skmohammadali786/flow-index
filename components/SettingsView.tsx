
import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { Save, Trash2, AlertTriangle, User, Bell, Moon, Sun, LogOut } from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClearData: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onClearData, onLogout }) => {
  // Use strings for number inputs to allow "empty" state while typing
  const [name, setName] = useState(settings.name);
  const [dob, setDob] = useState(settings.dob || '');
  const [cycleLen, setCycleLen] = useState(settings.avgCycleLength.toString());
  const [periodLen, setPeriodLen] = useState(settings.avgPeriodLength.toString());
  const [theme, setTheme] = useState<'light' | 'dark'>(settings.theme || 'light');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setName(settings.name);
    setDob(settings.dob || '');
    setCycleLen(settings.avgCycleLength.toString());
    setPeriodLen(settings.avgPeriodLength.toString());
    setTheme(settings.theme || 'light');
  }, [settings]);

  const handleSave = () => {
    const cLen = parseInt(cycleLen, 10);
    const pLen = parseInt(periodLen, 10);

    if (isNaN(cLen) || cLen < 20 || cLen > 50) {
      alert("Please enter a valid cycle length (20-50 days).");
      return;
    }
    if (isNaN(pLen) || pLen < 2 || pLen > 10) {
      alert("Please enter a valid period length (2-10 days).");
      return;
    }

    onSave({
      name,
      dob,
      avgCycleLength: cLen,
      avgPeriodLength: pLen,
      theme
    });
  };

  return (
    <div className="animate-fade-in-up max-w-2xl mx-auto pb-24 md:pb-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <button 
            onClick={onLogout}
            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
            <LogOut size={16} className="mr-2" />
            Sign Out
        </button>
      </div>

      <div className="space-y-6">
        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-purple-500/5 dark:shadow-none border border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <Moon className="text-indigo-500 mr-2" size={20} />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Appearance</h2>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              <button 
                onClick={() => setTheme('light')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                  <Sun size={16} className="mr-2" /> Light Mode
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                  <Moon size={16} className="mr-2" /> Dark Mode
              </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-purple-500/5 dark:shadow-none border border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <User className="text-purple-500 mr-2" size={20} />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Profile</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-gray-900 dark:text-white transition-all font-medium placeholder-gray-400"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
              <input 
                type="date" 
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-gray-900 dark:text-white transition-all font-medium dark:[color-scheme:dark]"
              />
              <p className="text-xs text-gray-400 mt-2 font-medium">Used to personalize health insights for your age.</p>
            </div>
          </div>
        </div>

        {/* Cycle Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-purple-500/5 dark:shadow-none border border-gray-100 dark:border-gray-700">
           <div className="flex items-center mb-6">
            <Bell className="text-rose-500 mr-2" size={20} />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Cycle Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cycle Length (Days)</label>
              <input 
                type="number" 
                value={cycleLen}
                onChange={(e) => setCycleLen(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-gray-900 dark:text-white transition-all font-medium"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Average: 28 Days</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Period Length (Days)</label>
              <input 
                type="number" 
                value={periodLen}
                onChange={(e) => setPeriodLen(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-gray-900 dark:text-white transition-all font-medium"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Average: 5 Days</p>
            </div>
          </div>
        </div>

        <button 
            onClick={handleSave}
            className="w-full py-4 bg-gray-900 dark:bg-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-gray-900/20 dark:shadow-purple-500/30 hover:bg-black dark:hover:bg-purple-700 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center text-lg"
          >
            <Save size={20} className="mr-2" />
            Save Changes
        </button>

        {/* Danger Zone */}
        <div className="mt-8 bg-rose-50 dark:bg-rose-900/10 rounded-3xl p-6 md:p-8 border border-rose-100 dark:border-rose-900/20">
            <h2 className="text-lg font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center">
                <AlertTriangle size={20} className="mr-2" /> 
                Danger Zone
            </h2>
            <p className="text-rose-600/80 dark:text-rose-400/70 text-sm mb-6 font-medium">This will permanently delete all your logs and cycle history.</p>
            
            {!showDeleteConfirm ? (
            <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-white dark:bg-transparent dark:border-rose-700 text-rose-600 dark:text-rose-400 rounded-xl font-bold shadow-sm border border-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all flex items-center"
            >
                <Trash2 size={18} className="mr-2" />
                Clear All Data
            </button>
            ) : (
            <div className="space-y-4 animate-fade-in-up">
                <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Are you absolutely sure?</p>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => { onClearData(); setShowDeleteConfirm(false); }}
                        className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/30"
                    >
                        Yes, Delete Everything
                    </button>
                    <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};
