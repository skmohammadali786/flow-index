import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    updateProfile, 
    onAuthStateChanged,
    User 
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";
import { UserSession } from '../types';
import { storageService } from './storageService';

const MOCK_SESSION_KEY = 'flow_mock_session';

// Helper to check for API Key specific errors
const isApiKeyError = (error: any) => {
    const code = (error.code || '').toLowerCase();
    const msg = (error.message || '').toLowerCase();
    return (
        code.includes('api-key') || 
        msg.includes('api-key') || 
        msg.includes('api key') ||
        code === 'auth/internal-error' ||
        code === 'auth/invalid-api-key'
    );
};

export const authService = {
  // Listen to auth state changes (Real-time) + Check Local Fallback
  onAuthStateChanged: (callback: (user: User | UserSession | null) => void) => {
      // 1. Check for existing mock session first (persistence)
      const storedMock = localStorage.getItem(MOCK_SESSION_KEY);
      if (storedMock) {
          try {
              const mockUser = JSON.parse(storedMock);
              callback(mockUser);
          } catch (e) {
              localStorage.removeItem(MOCK_SESSION_KEY);
          }
      } else if (!isFirebaseConfigured) {
          // If no local session AND no firebase config, we are logged out.
          // Don't try to listen to Firebase as it throws errors with invalid keys.
          callback(null);
          return () => {};
      }

      // 2. Listen to Firebase (Only if configured)
      if (isFirebaseConfigured) {
          try {
              return onAuthStateChanged(auth, (firebaseUser) => {
                  if (firebaseUser) {
                      // Firebase is working and user is logged in
                      // Clear mock session to avoid conflicts
                      localStorage.removeItem(MOCK_SESSION_KEY);
                      callback(firebaseUser);
                  } else {
                      // Firebase says logged out. 
                      // Only callback(null) if we don't have a local mock session
                      if (!localStorage.getItem(MOCK_SESSION_KEY)) {
                          callback(null);
                      }
                  }
              }, (error) => {
                  console.warn("Auth listener error:", error);
                  // If listener fails, do nothing; we rely on manual login fallback
              });
          } catch (e) {
              console.warn("Firebase Auth Listener failed:", e);
              return () => {};
          }
      }
      
      return () => {};
  },

  // Get current synchronous user
  getCurrentUser: (): UserSession | null => {
    // Check Firebase
    if (isFirebaseConfigured) {
        try {
            const user = auth.currentUser;
            if (user) {
                return {
                    id: user.uid,
                    email: user.email || '',
                    name: user.displayName || undefined
                };
            }
        } catch (e) {
            // Ignore firebase errors
        }
    }
    
    // Check Mock
    const storedMock = localStorage.getItem(MOCK_SESSION_KEY);
    if (storedMock) {
        return JSON.parse(storedMock);
    }

    return null;
  },

  // Helper to create offline session
  createOfflineSession: (email: string, name?: string): UserSession => {
      console.warn("Using local offline session.");
      // Create a consistent ID based on email for the mock session
      const mockId = 'local_' + btoa(email).replace(/=/g, '').substring(0, 12);
      
      const mockUser: UserSession = {
          id: mockId,
          email: email,
          name: name || 'User' 
      };
      
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockUser));
      storageService.setActiveUser(mockId);
      return mockUser;
  },

  // Login with Aggressive Fallback
  login: async (email: string, password: string): Promise<UserSession> => {
    // 1. Short-circuit if not configured (prevents SDK errors)
    if (!isFirebaseConfigured) {
        return authService.createOfflineSession(email);
    }

    // 2. Try Cloud Login
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        return {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || undefined
        };
    } catch (error: any) {
        console.warn("Firebase Auth Error:", error.code, error.message);

        // 3. Fallback for specific API errors
        // If the key is invalid or blocked, use offline session
        if (isApiKeyError(error)) {
            return authService.createOfflineSession(email);
        }
        throw error;
    }
  },

  // Sign Up with Aggressive Fallback
  signup: async (name: string, email: string, password: string): Promise<UserSession> => {
    // 1. Short-circuit if not configured
    if (!isFirebaseConfigured) {
        const mockUser = authService.createOfflineSession(email, name);
        // Initialize defaults for local user
        const defaultSettings = {
            name: name,
            avgCycleLength: 28,
            avgPeriodLength: 5,
            theme: 'light' as const,
            dob: ''
        };
        storageService.saveSettings(defaultSettings);
        return mockUser;
    }

    // 2. Try Cloud Signup
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        
        storageService.setActiveUser(user.uid);
        
        // Initialize default settings for cloud user
        const defaultSettings = {
            name: name,
            avgCycleLength: 28,
            avgPeriodLength: 5,
            theme: 'light' as const,
            dob: ''
        };
        storageService.saveSettings(defaultSettings);
        
        return {
            id: user.uid,
            email: user.email || '',
            name: name
        };
    } catch (error: any) {
        console.warn("Firebase Auth Error:", error.code, error.message);

        // 3. Fallback for specific API errors
        if (isApiKeyError(error)) {
            const mockUser = authService.createOfflineSession(email, name);
            const defaultSettings = {
                name: name,
                avgCycleLength: 28,
                avgPeriodLength: 5,
                theme: 'light' as const,
                dob: ''
            };
            storageService.saveSettings(defaultSettings);
            return mockUser;
        }
        throw error;
    }
  },

  logout: async (): Promise<void> => {
      try {
          if (isFirebaseConfigured) {
              await signOut(auth);
          }
      } catch (e) {
          // Ignore signout errors
      }
      localStorage.removeItem(MOCK_SESSION_KEY);
      storageService.clearLocalSession();
  }
};