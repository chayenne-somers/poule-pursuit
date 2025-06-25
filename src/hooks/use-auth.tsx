
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/tournament';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSpectator: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  isSpectator: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpectator, setIsSpectator] = useState(false);

  // Check for spectator mode
  useEffect(() => {
    const spectatorMode = localStorage.getItem('spectatorMode');
    setIsSpectator(spectatorMode === 'true');
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('AuthProvider: Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('AuthProvider: Error fetching user profile:', error);
        return null;
      }

      console.log('AuthProvider: Profile fetched successfully');
      return data as UserProfile;
    } catch (error) {
      console.error('AuthProvider: Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('AuthProvider: Initializing auth...');

        // Check for existing session first
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            const userProfile = await fetchUserProfile(initialSession.user.id);
            if (mounted) {
              setProfile(userProfile);
            }
          }
          
          setIsLoading(false);
        }

        // Set up the auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('AuthProvider: Auth state change:', event, !!session);
            
            if (mounted) {
              setSession(session);
              setUser(session?.user ?? null);
              
              if (session?.user) {
                const userProfile = await fetchUserProfile(session.user.id);
                if (mounted) {
                  setProfile(userProfile);
                }
              } else {
                setProfile(null);
              }
              
              if (isLoading) {
                setIsLoading(false);
              }
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('AuthProvider: Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const cleanup = initAuth();

    return () => {
      mounted = false;
      cleanup.then(fn => fn && fn());
    };
  }, []);

  const signOut = async () => {
    console.log('AuthProvider: Signing out...');
    await supabase.auth.signOut();
    
    // Clear spectator mode when signing out
    localStorage.removeItem('spectatorMode');
    setIsSpectator(false);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin';

  const value = {
    user,
    session,
    profile,
    isLoading,
    isAdmin,
    isSpectator,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
