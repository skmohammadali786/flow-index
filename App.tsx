import React, { useState, useEffect } from 'react';
import { CalendarView } from './components/CalendarView';
import { DailyLogSheet } from './components/DailyLogSheet';
import { CycleWheel } from './components/CycleWheel';
import { Insights } from './components/Insights';
import { SettingsView } from './components/SettingsView';
import { ChatView } from './components/ChatView';
import { AnalysisView } from './components/AnalysisView';
import { Toast } from './components/Toast';
import { AuthView } from './components/AuthView';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { Cycle, DailyLog, UserSettings, UserSession } from './types';
import { formatDateISO, analyzeCyclesFromLogs } from './utils/dateUtils';
import { Plus, Calendar as CalendarIcon, PieChart, MessageCircle, Settings, Droplet, GlassWater, Moon, Weight, BarChart2, Thermometer, ChevronRight } from 'lucide-react';

type Tab = 'tracker' | 'calendar' | 'analysis' | 'chat' | 'settings';
type MetricType = 'water' | 'sleep' | 'weight' | 'temperature';

// Helper for initial state and updates
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 18) return 'Afternoon';
    if (hour >= 18 && hour < 22) return 'Evening';
    return 'Night';
};

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [settings, setSettings] = useState<UserSettings>(storageService.getSettings());
  const [selectedDate, setSelectedDate] = useState<string>(formatDateISO(new Date()));
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('tracker');
  const [focusMetric, setFocusMetric] = useState<MetricType | null>(null);
  
  // Dynamic Greeting State
  const [greeting, setGreeting] = useState(getGreeting());
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  // Dynamic Greeting Updater - Runs every minute to ensure greeting stays accurate without refresh
  useEffect(() => {
      // Update immediately on mount (in case of time change since load)
      setGreeting(getGreeting());

      const interval = setInterval(() => {
          setGreeting(getGreeting());
      }, 60000); // Check every 60 seconds
      
      return () => clearInterval(interval);
  }, []);

  // 1. Auth Listener: Handles initial load and external auth changes
  useEffect(() => {
    const unsubscribeAuth = authService.onAuthStateChanged((session: any) => {
        if (session) {
            // Normalize User object (Firebase) or UserSession (Local)
            const mappedUser: UserSession = {
                id: session.uid || session.id,
                email: session.email || '',
                name: session.displayName || session.name || 'Beautiful'
            };
            setUser(mappedUser);
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Data Listener: Reacts to User State Changes
  useEffect(() => {
      if (!user) {
          setLogs([]);
          setCycles([]);
          // We don't necessarily clear settings here to avoid UI flickering, 
          // they will be overwritten when a new user logs in or reset by storageService on read.
          return;
      }

      // Subscribe to Realtime DB updates for this user
      const unsubscribeData = storageService.subscribeToUserData(user.id, (data) => {
          setLogs(data.logs);
          setCycles(data.cycles);
          setSettings(data.settings);
      });

      return () => {
          unsubscribeData();
      };
  }, [user]);

  // Theme effect
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const handleLogin = (userSession: UserSession) => {
      // Manually set user state to trigger the data listener and view update
      // This is critical when using the fallback auth mechanism which doesn't trigger the firebase listener
      setUser(userSession);
  };

  const handleLogout = async () => {
      await authService.logout();
      setUser(null);
      setActiveTab('tracker');
  };

  const handleSaveLog = (newLog: DailyLog) => {
    // 1. Save Log
    const updatedLogs = storageService.saveLog(newLog);
    setLogs([...updatedLogs]); 

    // 2. DYNAMIC CYCLE ENGINE
    if (newLog.flow) {
        const detectedCycles = analyzeCyclesFromLogs(updatedLogs, settings.avgCycleLength);
        
        if (detectedCycles.length > 0) {
            const savedCycles = storageService.saveCycles(detectedCycles);
            setCycles(savedCycles);
        } else if (cycles.length > 0 && updatedLogs.filter(l => l.flow && l.flow !== 'Spotting').length === 0) {
            // Edge case: User deleted all period logs
            storageService.saveCycles([]);
            setCycles([]);
        }
    }
    
    showToast("Daily log saved!");
  };

  const handleSaveSettings = async (newSettings: UserSettings) => {
    try {
        // 1. Save Settings (Async to ensure backend sync)
        await storageService.saveSettings(newSettings);
        setSettings(newSettings);

        // 2. Update local user state immediately for UI consistency (Display Name)
        if (user && newSettings.name !== user.name) {
             const updatedUser = { ...user, name: newSettings.name };
             setUser(updatedUser);
        }

        // 3. Re-Analyze Cycles with new configuration
        // If the user changed the default cycle length, we want the *current* active cycle
        // (which relies on default length) to update immediately.
        if (logs.length > 0) {
            const reanalyzedCycles = analyzeCyclesFromLogs(logs, newSettings.avgCycleLength);
            if (reanalyzedCycles.length > 0) {
                const savedCycles = storageService.saveCycles(reanalyzedCycles);
                setCycles(savedCycles);
            }
        }
        
        showToast("Settings updated successfully!");
    } catch (e) {
        console.error("Failed to save settings:", e);
        showToast("Failed to save settings", "error");
    }
  };

  const handleClearData = () => {
    storageService.clearAllData();
    setActiveTab('tracker');
    showToast("All data has been cleared", "success");
  };

  const handleDateSelect = (date: string) => {
      setSelectedDate(date);
      setFocusMetric(null);
      setIsLogSheetOpen(true);
  };

  const openLogSheetWithMetric = (metric: MetricType) => {
      setSelectedDate(formatDateISO(new Date()));
      setFocusMetric(metric);
      setIsLogSheetOpen(true);
  };

  const latestCycle = cycles.length > 0 
      ? cycles[0] 
      : { startDate: formatDateISO(new Date()), length: settings.avgCycleLength };

  const currentLog = logs.find(l => l.date === selectedDate);
  const isToday = selectedDate === formatDateISO(new Date());

  const DashboardMetric = ({ icon, label, value, unit, color, onClick }: { icon: React.ReactNode, label: string, value: string | number, unit: string, color: string, onClick?: () => void }) => (
      <div 
        onClick={onClick}
        className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-start justify-between h-28 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] active:scale-95"
      >
          <div className={`absolute top-0 right-0 p-2 opacity-10 rounded-bl-2xl ${color}`}>
              {icon}
          </div>
          <div className={`p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 mb-2 ${color.replace('bg-', 'text-')}`}>
              {icon}
          </div>
          <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                  {value} <span className="text-xs font-medium text-gray-400">{unit}</span>
              </p>
          </div>
      </div>
  );

  // --- Render Logic ---

  if (loading) return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
  );

  if (!user) {
      return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-dvh bg-pink-50/50 dark:bg-gray-950 pb-24 md:pb-0 md:pl-24 transition-colors duration-300 font-sans">
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 border-b dark:border-gray-800">
        <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg mr-3 shadow-lg shadow-rose-200 dark:shadow-none overflow-hidden">
                 <img src="https://iili.io/fC1i0s1.md.jpg" alt="Flow Index" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-xl text-gray-800 dark:text-white tracking-tight">Flow Index</span>
        </div>
        <button 
            onClick={() => setActiveTab('settings')}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
            <Settings size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Desktop Sidebar (Left) */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-24 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 items-center py-8 z-50">
        <div 
            onClick={() => setActiveTab('tracker')}
            className="w-12 h-12 rounded-xl mb-12 shadow-lg shadow-rose-200 dark:shadow-rose-900/20 cursor-pointer hover:scale-105 transition-transform overflow-hidden"
        >
             <img src="https://iili.io/fC1i0s1.md.jpg" alt="Flow Index" className="w-full h-full object-cover" />
        </div>
        <nav className="flex-1 flex flex-col gap-8 w-full">
             <SidebarItem icon={<PieChart size={24} />} active={activeTab === 'tracker'} onClick={() => setActiveTab('tracker')} label="Tracker" />
             <SidebarItem icon={<CalendarIcon size={24} />} active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} label="Calendar" />
             <SidebarItem icon={<BarChart2 size={24} />} active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} label="Analysis" />
             <SidebarItem icon={<MessageCircle size={24} />} active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} label="Chat" />
        </nav>
        <button 
            onClick={() => setActiveTab('settings')}
            className={`p-3 rounded-xl transition-colors mb-4 ${activeTab === 'settings' ? 'bg-gray-900 dark:bg-gray-800 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
            <Settings size={24} />
        </button>
      </div>

      <main className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12">
        
        {activeTab === 'tracker' && (
            <div className="animate-fade-in-up space-y-6">
                
                {/* 1. Hero Section (Full Width) */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-purple-500/5 dark:shadow-none border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[320px]">
                         <div className="z-10 w-full md:w-1/2 mb-8 md:mb-0 text-center md:text-left">
                             <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                 Good {greeting},<br/>
                                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600">{settings.name}</span>
                             </h1>
                             <p className="text-gray-500 dark:text-gray-400 font-medium text-sm md:text-lg mb-8 max-w-md">
                                 Here is your cycle summary for {new Date().toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}.
                             </p>
                             <button 
                                onClick={() => { setSelectedDate(formatDateISO(new Date())); setFocusMetric(null); setIsLogSheetOpen(true); }}
                                className="inline-flex items-center px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-gray-900/20"
                             >
                                 <Plus size={20} className="mr-2" />
                                 Log Today
                             </button>
                         </div>
                         <div className="w-full md:w-1/2 flex justify-center relative">
                             {/* Wheel Component */}
                             <CycleWheel 
                                key={latestCycle.startDate + settings.avgCycleLength}
                                latestCycle={latestCycle} 
                                settings={settings} 
                                cycles={cycles}
                             />
                         </div>
                </div>

                {/* 2. Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <DashboardMetric 
                        label="Water" 
                        value={currentLog?.water || 0} 
                        unit="Cups" 
                        icon={<GlassWater size={18} />} 
                        color="bg-blue-500 text-blue-500"
                        onClick={() => openLogSheetWithMetric('water')}
                    />
                     <DashboardMetric 
                        label="Sleep" 
                        value={currentLog?.sleep || '--'} 
                        unit="Hrs" 
                        icon={<Moon size={18} />} 
                        color="bg-indigo-500 text-indigo-500"
                        onClick={() => openLogSheetWithMetric('sleep')}
                    />
                     <DashboardMetric 
                        label="Weight" 
                        value={currentLog?.weight || '--'} 
                        unit="kg" 
                        icon={<Weight size={18} />} 
                        color="bg-emerald-500 text-emerald-500"
                        onClick={() => openLogSheetWithMetric('weight')}
                    />
                     <DashboardMetric 
                        label="BBT Temp" 
                        value={currentLog?.temperature || '--'} 
                        unit="°" 
                        icon={<Thermometer size={18} />} 
                        color="bg-orange-500 text-orange-500"
                        onClick={() => openLogSheetWithMetric('temperature')}
                    />
                </div>

                {/* 3. Log Summary & Calendar Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Log Summary */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                                <span className="w-2 h-6 bg-rose-500 rounded-full mr-3"></span>
                                {isToday ? "Today's Log" : `Log: ${new Date(selectedDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}`}
                            </h3>
                            <button onClick={() => { setFocusMetric(null); setIsLogSheetOpen(true); }} className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-rose-500 transition-colors flex items-center">
                                EDIT <ChevronRight size={14} className="ml-1" />
                            </button>
                         </div>
                         
                         {currentLog ? (
                             <div className="space-y-4">
                                 <div className="flex flex-wrap gap-2">
                                     {currentLog.flow && <span className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-xl text-sm font-bold flex items-center border border-rose-100 dark:border-rose-900/30"><Droplet size={14} className="mr-2"/> {currentLog.flow} Flow</span>}
                                     {currentLog.discharge && <span className="px-4 py-2 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 rounded-xl text-sm font-bold border border-cyan-100 dark:border-cyan-900/30">{currentLog.discharge}</span>}
                                     {currentLog.moods.map(m => <span key={m} className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-bold border border-purple-100 dark:border-purple-900/30">{m}</span>)}
                                     {currentLog.symptoms.map(s => <span key={s} className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-xl text-sm font-bold border border-orange-100 dark:border-orange-900/30">{s}</span>)}
                                 </div>
                                 {currentLog.notes && (
                                     <div className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                         "{currentLog.notes}"
                                     </div>
                                 )}
                             </div>
                         ) : (
                             <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                 <p className="text-gray-400 dark:text-gray-500 font-medium mb-3">No log entry for {isToday ? 'today' : 'this date'}.</p>
                                 <button onClick={() => { setFocusMetric(null); setIsLogSheetOpen(true); }} className="text-sm font-bold text-rose-500 hover:text-rose-600">Start Logging</button>
                             </div>
                         )}
                    </div>

                    {/* Mini Calendar Link */}
                    <div className="lg:col-span-1">
                         <div className="h-full bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-rose-200 dark:hover:border-rose-800 transition-colors" onClick={() => setActiveTab('calendar')}>
                             <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-500 dark:text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                                 <CalendarIcon size={32} />
                             </div>
                             <h3 className="text-lg font-bold text-gray-900 dark:text-white">View Calendar</h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Check past cycles & predictions</p>
                         </div>
                    </div>
                </div>

                {/* 4. Insights Section - Compact & Bottom */}
                <Insights 
                    logs={logs} 
                    latestCycle={latestCycle} 
                    settings={settings}
                    onAskLuna={() => setActiveTab('chat')}
                />
            </div>
        )}

        {activeTab === 'calendar' && (
            <div className="animate-fade-in-up">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Full Calendar</h1>
                <CalendarView 
                    logs={logs} 
                    cycles={cycles} 
                    settings={settings}
                    selectedDate={selectedDate} 
                    onSelectDate={handleDateSelect} 
                />
            </div>
        )}

        {activeTab === 'analysis' && (
           <AnalysisView 
                logs={logs} 
                cycles={cycles}
                onNavigateToLog={() => { setSelectedDate(formatDateISO(new Date())); setIsLogSheetOpen(true); }}
            />
        )}
        
        {activeTab === 'chat' && (
           <ChatView settings={settings} latestCycle={latestCycle} />
        )}

        {activeTab === 'settings' && (
            <SettingsView 
                settings={settings} 
                onSave={handleSaveSettings}
                onClearData={handleClearData}
                onLogout={handleLogout}
            />
        )}

      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-2 h-[80px] z-40 safe-area-bottom">
           <div className="grid grid-cols-5 items-center h-full">
               <NavItem icon={<PieChart size={24} />} active={activeTab === 'tracker'} onClick={() => setActiveTab('tracker')} />
               <NavItem icon={<CalendarIcon size={24} />} active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
               
               <div className="relative flex justify-center items-center">
                   <button 
                     onClick={() => { setSelectedDate(formatDateISO(new Date())); setFocusMetric(null); setIsLogSheetOpen(true); }}
                     className="absolute -top-6 w-14 h-14 bg-gray-900 dark:bg-purple-600 rounded-full text-white flex items-center justify-center shadow-lg shadow-gray-900/20 dark:shadow-purple-900/50 hover:scale-105 transition-transform"
                   >
                       <Plus size={28} />
                   </button>
               </div>
               
               <NavItem icon={<BarChart2 size={24} />} active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} />
               <NavItem icon={<MessageCircle size={24} />} active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
           </div>
      </div>

      <DailyLogSheet 
        isOpen={isLogSheetOpen} 
        onClose={() => setIsLogSheetOpen(false)}
        date={selectedDate}
        existingLog={currentLog}
        onSave={handleSaveLog}
        autoFocusMetric={focusMetric}
      />

    </div>
  );
}

const SidebarItem = ({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label?: string }) => (
    <button 
        onClick={onClick}
        className={`w-full py-4 flex flex-col items-center border-l-4 transition-all group ${active ? 'border-rose-500 text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
    >
        {icon}
        {label && <span className="text-[10px] font-bold mt-1 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity dark:text-gray-400">{label}</span>}
    </button>
);

const NavItem = ({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`w-full h-full flex items-center justify-center rounded-xl transition-all ${active ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`}
    >
        {icon}
    </button>
);