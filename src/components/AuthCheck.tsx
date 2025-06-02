
import { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AuthCheckProps {
  children?: React.ReactNode;
}

const AuthCheck = ({ children }: AuthCheckProps) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthCheck: Initializing authentication...');

        // Check for existing session first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthCheck: Error getting session:', error);
        }
        
        console.log('AuthCheck: Initial session check:', !!session);
        
        if (mounted) {
          setUser(session?.user || null);
          setLoading(false);
        }

        // Set up the auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('AuthCheck: Auth event:', event, 'Session:', !!session);
            
            if (mounted) {
              setUser(session?.user || null);
              if (loading) {
                setLoading(false);
              }
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('AuthCheck: Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      mounted = false;
      cleanup.then(fn => fn && fn());
    };
  }, []);

  // Debug auth state
  useEffect(() => {
    console.log("AuthCheck: Auth state updated", { 
      user: user ? "Authenticated" : "Unauthenticated", 
      userId: user?.id,
      path: location.pathname,
      isPouleRoute: location.pathname.startsWith('/poule/')
    });
  }, [user, location.pathname]);

  // All poule routes are public
  const isPouleRoute = location.pathname.startsWith('/poule/');
  
  // Show loading indicator until auth check completes
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 bg-primary rounded-full animate-pulse"></div>
          <div className="h-3 w-3 bg-primary rounded-full animate-pulse"></div>
          <div className="h-3 w-3 bg-primary rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Poule pages are accessible without authentication
  if (isPouleRoute) {
    return children ? <>{children}</> : <Outlet />;
  }

  // Require authentication for all other routes
  if (!user) {
    console.log('AuthCheck: Redirecting to /auth, no user found');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('AuthCheck: User authenticated, showing protected content');
  return children ? <>{children}</> : <Outlet />;
};

export default AuthCheck;
