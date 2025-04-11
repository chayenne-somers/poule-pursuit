
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
    // First, set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Debug auth state
  useEffect(() => {
    console.log("AuthCheck: Auth state updated", { 
      user: user ? "Authenticated" : "Unauthenticated", 
      path: location.pathname,
      allowAccess: location.pathname.startsWith('/poule/')
    });
  }, [user, location.pathname]);

  // All poule routes are public
  const isPouleRoute = location.pathname.startsWith('/poule/');
  
  // Special case: always show loading indicator until auth check completes
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 bg-primary rounded-full"></div>
          <div className="h-3 w-3 bg-primary rounded-full"></div>
          <div className="h-3 w-3 bg-primary rounded-full"></div>
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
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AuthCheck;
