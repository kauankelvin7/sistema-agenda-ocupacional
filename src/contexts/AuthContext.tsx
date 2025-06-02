
import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { User } from "@/types";
import { auth, connectionMonitor } from "@/lib/firebase";
import { 
  onAuthStateChange, 
  getCurrentUser, 
  signIn as authSignIn, 
  signOut as authSignOut, 
  signUp as authSignUp,
  updateUserProfile as updateProfile,
  deleteUserAccount
} from "@/services/auth-service";
import { updateCompany, getCompany } from "@/services/company-service";

interface ConnectionStatus {
  status: string;
  percentUsed: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  signUp: typeof authSignUp;
  updateUserProfile: typeof updateProfile;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateCompanyLogo: (logoUrl: string) => Promise<void>;
  lastAuthenticated: number | null;
  connectionStatus: ConnectionStatus;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component that manages authentication state and user data
 * Provides comprehensive user management with company data integration
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastAuthenticated, setLastAuthenticated] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(() => connectionMonitor.getStatus());
  const intervalRef = useRef<number | null>(null);
  const connectionIntervalRef = useRef<number | null>(null);

  // Monitor connection status every 5 seconds
  useEffect(() => {
    connectionIntervalRef.current = window.setInterval(() => {
      setConnectionStatus(connectionMonitor.getStatus());
    }, 5000);
    
    return () => {
      if (connectionIntervalRef.current) {
        window.clearInterval(connectionIntervalRef.current);
        connectionIntervalRef.current = null;
      }
    };
  }, []);

  /**
   * Loads complete user data including company information with error handling
   * @param firebaseUser Firebase user object
   * @returns Complete user data or null if failed
   */
  const loadUserWithCompanyData = useCallback(async (firebaseUser: any): Promise<User | null> => {
    if (!firebaseUser?.uid) {
      console.warn('loadUserWithCompanyData: No valid Firebase user provided');
      return null;
    }

    try {
      console.log(`Loading complete user data for: ${firebaseUser.uid}`);
      
      // Get basic user data first
      const userData = await getCurrentUser();
      if (!userData) {
        console.warn('loadUserWithCompanyData: No user data found');
        return null;
      }

      // Fetch company data for logo and additional info
      let companyData = null;
      try {
        companyData = await getCompany(firebaseUser.uid);
      } catch (companyError) {
        console.warn('loadUserWithCompanyData: Failed to load company data', companyError);
        // Continue with basic user data if company data fails
      }
      
      // Combine user data with company data safely
      const completeUserData: User = {
        ...userData,
        photoURL: companyData?.photoURL || userData.photoURL || "",
        displayName: companyData?.name || userData.displayName || "",
      };

      console.log("Complete user data loaded successfully:", { 
        userId: completeUserData.id, 
        hasLogo: !!completeUserData.photoURL,
        hasDisplayName: !!completeUserData.displayName
      });

      return completeUserData;
    } catch (error) {
      console.error("Error loading complete user data:", error);
      
      // Fallback to basic user data on error
      try {
        return await getCurrentUser();
      } catch (fallbackError) {
        console.error("Error loading basic user data:", fallbackError);
        return null;
      }
    }
  }, []);

  /**
   * Refreshes current user data from server
   */
  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) {
      console.warn('refreshUser: No authenticated user');
      return;
    }

    try {
      console.log('Refreshing user data...');
      const completeUserData = await loadUserWithCompanyData(auth.currentUser);
      
      if (completeUserData) {
        setUser(completeUserData);
        setLastAuthenticated(Date.now());
        console.log('User data refreshed successfully');
      } else {
        console.warn('Failed to refresh user data, signing out...');
        await authSignOut();
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      // Don't sign out on refresh errors to avoid disrupting user experience
    }
  }, [loadUserWithCompanyData]);

  /**
   * Updates company logo with comprehensive error handling
   * @param logoUrl New logo URL (base64 or HTTP URL)
   */
  const updateCompanyLogo = useCallback(async (logoUrl: string): Promise<void> => {
    if (!user?.id) {
      throw new Error("Usuário não encontrado para atualizar logo");
    }

    if (!logoUrl || typeof logoUrl !== 'string') {
      throw new Error("URL da logo inválida");
    }

    try {
      console.log("Updating company logo", { 
        userId: user.id, 
        logoType: logoUrl.startsWith('data:') ? 'base64' : 'url',
        logoSize: logoUrl.length 
      });
      
      // Update company data in Firestore (primary storage)
      await updateCompany(user.id, {
        photoURL: logoUrl
      });

      // Try to update Firebase Auth profile (optional, with constraints)
      const isBase64 = logoUrl.startsWith('data:');
      const isTooLong = logoUrl.length > 2000; // Firebase Auth URL limit
      
      if (!isBase64 || !isTooLong) {
        try {
          await updateProfile({
            photoURL: logoUrl
          });
          console.log("Logo updated in Firebase Auth successfully");
        } catch (profileError) {
          console.warn("Could not update logo in Firebase Auth (saved in Firestore):", profileError);
          // Not critical - Firestore is the source of truth
        }
      } else {
        console.log("Logo saved only in Firestore (base64 too long for Firebase Auth)");
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, photoURL: logoUrl } : null);
      
      console.log("Company logo updated successfully");
    } catch (error) {
      console.error("Error updating company logo:", error);
      throw new Error("Falha ao atualizar logo da empresa");
    }
  }, [user?.id]);

  /**
   * Signs in user with rate limiting and complete data loading
   */
  const signIn = useCallback(async (email: string, password: string): Promise<User | null> => {
    try {
      // Rate limiting check
      const lastAttempt = localStorage.getItem('lastLoginAttempt');
      const now = Date.now();
      if (lastAttempt && now - parseInt(lastAttempt) < 1000) {
        throw new Error("Por favor, aguarde antes de tentar novamente");
      }
      localStorage.setItem('lastLoginAttempt', now.toString());
      
      console.log('Attempting to sign in user...');
      const userData = await authSignIn(email, password);
      
      if (userData && auth.currentUser) {
        // Load complete user data including company logo
        const completeUserData = await loadUserWithCompanyData(auth.currentUser);
        
        if (completeUserData) {
          setUser(completeUserData);
          setLastAuthenticated(Date.now());
          
          // Set up periodic refresh
          if (!intervalRef.current) {
            intervalRef.current = window.setInterval(refreshUser, 15 * 60 * 1000);
          }
          
          console.log('User signed in successfully');
          return completeUserData;
        }
      }
      
      return userData;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, [loadUserWithCompanyData, refreshUser]);

  /**
   * Signs out user and cleans up resources
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      console.log('Signing out user...');
      await authSignOut();
      
      setUser(null);
      setLastAuthenticated(null);
      
      // Clean up refresh interval
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, []);

  /**
   * Deletes user account and cleans up all data
   */
  const deleteAccount = useCallback(async (): Promise<void> => {
    try {
      console.log('Deleting user account...');
      await deleteUserAccount();
      
      setUser(null);
      setLastAuthenticated(null);
      
      // Clean up refresh interval
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      console.log('User account deleted successfully');
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }, []);

  // Monitor auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        console.log('Auth state changed: user authenticated');
        const completeUserData = await loadUserWithCompanyData(firebaseUser);
        
        if (completeUserData) {
          setUser(completeUserData);
          setLastAuthenticated(Date.now());
          
          // Set up periodic refresh
          if (!intervalRef.current) {
            intervalRef.current = window.setInterval(refreshUser, 15 * 60 * 1000);
          }
        } else {
          console.warn('Failed to load user data after auth change');
          setUser(null);
        }
      } else {
        console.log('Auth state changed: user not authenticated');
        setUser(null);
        setLastAuthenticated(null);
        
        // Clean up refresh interval
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener...');
      unsubscribe();
      
      // Clean up intervals
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (connectionIntervalRef.current) {
        window.clearInterval(connectionIntervalRef.current);
        connectionIntervalRef.current = null;
      }
    };
  }, [loadUserWithCompanyData, refreshUser]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signOut,
    signUp: authSignUp,
    updateUserProfile: updateProfile,
    refreshUser,
    deleteAccount,
    updateCompanyLogo,
    lastAuthenticated,
    connectionStatus,
  }), [user, loading, signIn, signOut, refreshUser, deleteAccount, updateCompanyLogo, lastAuthenticated, connectionStatus]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
