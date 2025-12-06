import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { Save, Trash2, LogOut, Sun, Moon, User, Activity, Droplet, Calendar } from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => Promise<void> | void;
  onClearData: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onClearData, onLogout }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if props change (e.g. initial load from database)
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (field: keyof UserSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Mimic a minimal delay for UX if the operation is too fast
    const startTime = Date.now();
    
    try {
        await onSave(formData);
    } finally {
        // Ensure the loading spinner shows for at least 500ms for visual feedback
        const elapsed = Date.now() - startTime;
        if (elapsed < 500) {
            setTimeout(() => setIsSaving(false), 500 - elapsed);
        } else {
            setIsSaving(false);
        }
    }
  };

  return (
    <div className="animate-fade-in-up pb-24 md:pb-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl shadow-purple-500/5 dark:shadow-none border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                <User className="mr-2 text-purple-500" size={20} />
                Profile
            </h2>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Display Name</label>
                    <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Date of Birth</label>
                    <input 
                        type="date" 
                        value={formData.dob || ''}
                        onChange={(e) => handleChange('dob', e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>
            </div>
        </div>

        {/* Cycle Config */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl shadow-purple-500/5 dark:shadow-none border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                <Activity className="mr-2 text-rose-500" size={20} />
                Cycle Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Cycle Length (Days)</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="number" 
                            value={formData.avgCycleLength}
                            onChange={(e) => handleChange('avgCycleLength', parseInt(e.target.value) || 28)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Period Length (Days)</label>
                    <div className="relative">
                        <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="number" 
                            value={formData.avgPeriodLength}
                            onChange={(e) => handleChange('avgPeriodLength', parseInt(e.target.value) || 5)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                    </div>
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                Note: "Smart Prediction" will automatically override the Cycle Length if you have logged enough consistent cycles.
            </p>
        </div>

        {/* App Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl shadow-purple-500/5 dark:shadow-none border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">App Preferences</h2>
            
             <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                 <div className="flex items-center">
                     {formData.theme === 'dark' ? <Moon size={20} className="text-indigo-400 mr-3" /> : <Sun size={20} className="text-amber-400 mr-3" />}
                     <span className="font-bold text-gray-700 dark:text-gray-200">Dark Mode</span>
                 </div>
                 <button 
                    onClick={() => handleChange('theme', formData.theme === 'dark' ? 'light' : 'dark')}
                    className={`w-12 h-7 rounded-full transition-colors relative ${formData.theme === 'dark' ? 'bg-indigo-500' : 'bg-gray-300'}`}
                 >
                     <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${formData.theme === 'dark' ? 'left-6' : 'left-1'}`}></div>
                 </button>
             </div>
        </div>

        {/* Save Button */}
        <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-xl shadow-gray-900/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {isSaving ? (
                <>
                    <div className="w-5 h-5 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                </>
            ) : (
                <>
                    <Save size={20} className="mr-2" />
                    Save Settings
                </>
            )}
        </button>

        {/* Danger Zone */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">Danger Zone</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => {
                        if (window.confirm("Are you sure you want to log out?")) {
                            onLogout();
                        }
                    }}
                    className="py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                    <LogOut size={18} className="mr-2" />
                    Log Out
                </button>

                <button 
                    onClick={() => {
                        if (window.confirm("Are you sure you want to delete ALL your data? This cannot be undone.")) {
                            onClearData();
                        }
                    }}
                    className="py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center"
                >
                    <Trash2 size={18} className="mr-2" />
                    Clear Data
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};