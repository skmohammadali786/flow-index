import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    updateProfile, 
    onAuthStateChanged,
    User 
} from "firebase/auth";
import { auth } from "./firebase";
import { UserSession } from '../types';
import { storageService } from './storageService';

export const authService = {
  // Listen to auth state changes (Real-time)
  onAuthStateChanged: (callback: (user: User | null) => void) => {
      return onAuthStateChanged(auth, callback);
  },

  // Get current synchronous user (if already initialized)
  getCurrentUser: (): UserSession | null => {
    const user = auth.currentUser;
    if (user) {
        return {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || undefined
        };
    }
    return null;
  },

  // Login
  login: async (email: string, password: string): Promise<UserSession> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    return {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || undefined
    };
  },

  // Sign Up
  signup: async (name: string, email: string, password: string): Promise<UserSession> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with name
    await updateProfile(user, { displayName: name });
    
    // Set active user immediately so storageService knows where to write
    storageService.setActiveUser(user.uid);

    // Initialize default settings in Firebase
    // This is crucial so the 'subscribeToUserData' has something to fetch immediately
    const defaultSettings = {
        name: name,
        avgCycleLength: 28,
        avgPeriodLength: 5,
        theme: 'light' as const,
        dob: ''
    };
    
    // We call saveSettings directly to push to cloud
    storageService.saveSettings(defaultSettings);
    
    return {
        id: user.uid,
        email: user.email || '',
        name: name
    };
  },

  logout: async (): Promise<void> => {
      await signOut(auth);
      storageService.clearLocalSession();
  }
};