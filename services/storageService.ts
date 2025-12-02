import { Cycle, DailyLog, UserSettings, ChatMessage } from '../types';
import { db, auth } from './firebase'; 
import { ref, set, get, child, onValue, off } from "firebase/database";

// Constants
const PREFIX = 'flow_index_';
const KEYS = {
  LOGS: 'logs',
  CYCLES: 'cycles',
  SETTINGS: 'settings',
  CHAT: 'chat_history',
  INIT: 'initialized'
};

const DEFAULT_SETTINGS: UserSettings = {
  avgCycleLength: 28,
  avgPeriodLength: 5,
  name: 'Beautiful',
  dob: '',
  theme: 'light',
};

// Helper to get local key based on current user ID
const getLocalKey = (key: string, userId?: string) => {
    const activeId = userId || localStorage.getItem('flow_active_user_id') || 'guest';
    return `${PREFIX}${activeId}_${key}`;
};

// Helper to remove undefined values which Firebase Realtime Database throws errors on.
const sanitize = <T>(data: T): T => {
    if (data === undefined || data === null) return null as any;
    try {
        return JSON.parse(JSON.stringify(data));
    } catch (e) {
        console.error("Data sanitization failed:", e);
        return data;
    }
};

// Helper to get the most reliable User ID available
const getCurrentUserId = (): string | null => {
    const localId = localStorage.getItem('flow_active_user_id');
    if (localId && localId !== 'guest') return localId;
    
    // Fallback: Check auth instance directly
    if (auth.currentUser) return auth.currentUser.uid;
    
    return null;
};

export const storageService = {
  
  setActiveUser: (userId: string) => {
      localStorage.setItem('flow_active_user_id', userId);
  },

  clearLocalSession: () => {
      localStorage.removeItem('flow_active_user_id');
  },

  // --- SYNC & REALTIME ENGINE ---
  
  subscribeToUserData: (userId: string, callback: (data: any) => void) => {
      storageService.setActiveUser(userId);
      const userRef = ref(db, `users/${userId}`);
      
      const listener = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
              const data = snapshot.val();
              
              // 1. Update Local Cache
              if (data.logs) localStorage.setItem(getLocalKey(KEYS.LOGS, userId), JSON.stringify(data.logs));
              if (data.cycles) localStorage.setItem(getLocalKey(KEYS.CYCLES, userId), JSON.stringify(data.cycles));
              if (data.settings) localStorage.setItem(getLocalKey(KEYS.SETTINGS, userId), JSON.stringify(data.settings));
              if (data.chat) localStorage.setItem(getLocalKey(KEYS.CHAT, userId), JSON.stringify(data.chat));
              
              // 2. Pass data back to App state
              // Ensure settings are merged with defaults to prevent missing keys
              const mergedSettings = data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : DEFAULT_SETTINGS;

              callback({
                  logs: data.logs || [],
                  cycles: data.cycles || [],
                  settings: mergedSettings,
                  chat: data.chat || []
              });
          } else {
              // New user or empty data, return defaults
              callback({
                  logs: [],
                  cycles: [],
                  settings: DEFAULT_SETTINGS,
                  chat: []
              });
          }
      }, (error) => {
          console.error("Realtime sync error:", error);
      });

      return () => off(userRef, 'value', listener);
  },

  // --- Logs ---
  getLogs: (): DailyLog[] => {
    try {
      const data = localStorage.getItem(getLocalKey(KEYS.LOGS));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveLog: (log: DailyLog) => {
    const logs = storageService.getLogs();
    const existingIndex = logs.findIndex((l) => l.date === log.date);
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }
    
    // Local Save
    const userId = getCurrentUserId();
    localStorage.setItem(getLocalKey(KEYS.LOGS, userId || 'guest'), JSON.stringify(logs));
    
    // Cloud Save
    if (userId) {
        set(ref(db, `users/${userId}/logs`), sanitize(logs))
            .catch(err => console.error("Firebase log save failed:", err));
    }
    
    return logs;
  },

  // --- Cycles ---
  getCycles: (): Cycle[] => {
    const data = localStorage.getItem(getLocalKey(KEYS.CYCLES));
    const initialized = localStorage.getItem(getLocalKey(KEYS.INIT));

    if (!data && !initialized) {
        const today = new Date();
        const twoWeeksAgo = new Date(today.getTime() - (14 * 24 * 60 * 60 * 1000));
        const mockCycle: Cycle = {
            startDate: twoWeeksAgo.toISOString().split('T')[0],
            length: 28
        };
        return [mockCycle];
    }

    if (!data) return [];
    try { return JSON.parse(data); } catch { return []; }
  },

  saveCycle: (cycle: Cycle) => {
    const cycles = storageService.getCycles();
    const existingIndex = cycles.findIndex(c => c.startDate === cycle.startDate);
    if (existingIndex >= 0) {
        cycles[existingIndex] = cycle;
    } else {
        cycles.push(cycle);
        cycles.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }
    
    const userId = getCurrentUserId();
    localStorage.setItem(getLocalKey(KEYS.CYCLES, userId || 'guest'), JSON.stringify(cycles));
    
    if (userId) {
        set(ref(db, `users/${userId}/cycles`), sanitize(cycles))
            .catch(err => console.error("Firebase cycle save failed:", err));
    }
    return cycles;
  },

  saveCycles: (cycles: Cycle[]) => {
      const sorted = [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      
      const userId = getCurrentUserId();
      localStorage.setItem(getLocalKey(KEYS.CYCLES, userId || 'guest'), JSON.stringify(sorted));
      
      if (userId) {
          set(ref(db, `users/${userId}/cycles`), sanitize(sorted))
            .catch(err => console.error("Firebase cycles save failed:", err));
      }
      return sorted;
  },

  // --- Settings ---
  getSettings: (): UserSettings => {
    const data = localStorage.getItem(getLocalKey(KEYS.SETTINGS));
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  },
  
  saveSettings: (settings: UserSettings) => {
      // 1. Get current settings to ensure we don't lose fields
      const current = storageService.getSettings();
      
      // 2. Merge updates
      const updated = { 
          ...current, 
          ...settings,
          // Explicitly ensure numbers are numbers if they exist
          avgCycleLength: Number(settings.avgCycleLength),
          avgPeriodLength: Number(settings.avgPeriodLength)
      };
      
      const userId = getCurrentUserId();
      
      // 3. Local Save
      localStorage.setItem(getLocalKey(KEYS.SETTINGS, userId || 'guest'), JSON.stringify(updated));
      
      // 4. Cloud Save
      if (userId) {
          console.log("Saving settings to Firebase:", updated);
          set(ref(db, `users/${userId}/settings`), sanitize(updated))
            .then(() => console.log("Settings saved successfully."))
            .catch(err => console.error("Firebase settings save failed:", err));
      } else {
          console.warn("No user ID found, settings saved locally only.");
      }
      return updated;
  },

  // --- Chat ---
  getChatHistory: (): ChatMessage[] => {
      try {
          const data = localStorage.getItem(getLocalKey(KEYS.CHAT));
          return data ? JSON.parse(data) : [];
      } catch {
          return [];
      }
  },

  saveChatHistory: (messages: ChatMessage[]) => {
      const trimmed = messages.slice(-50);
      
      const userId = getCurrentUserId();
      localStorage.setItem(getLocalKey(KEYS.CHAT, userId || 'guest'), JSON.stringify(trimmed));
      
      if (userId) {
          set(ref(db, `users/${userId}/chat`), sanitize(trimmed))
            .catch(err => console.error("Firebase chat save failed:", err));
      }
  },

  // --- Data Management ---
  clearAllData: () => {
    const userId = getCurrentUserId();
    const localKeys = [KEYS.LOGS, KEYS.CYCLES, KEYS.SETTINGS, KEYS.CHAT, KEYS.INIT];
    
    localKeys.forEach(k => localStorage.removeItem(getLocalKey(k, userId || 'guest')));
    
    if (userId) {
        set(ref(db, `users/${userId}`), null)
            .catch(err => console.error("Firebase clear failed:", err));
    }
  },
};