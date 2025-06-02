
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Processing auth callback...');
        console.log('AuthCallback: Current URL:', window.location.href);
        console.log('AuthCallback: Location search:', location.search);
        console.log('AuthCallback: Location hash:', location.hash);

        // Extract any error message from the URL if present
        const urlParams = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.substring(1));
        
        const errorMessage = urlParams.get('error_description') || hashParams.get('error_description');
        const errorCode = urlParams.get('error') || hashParams.get('error');
        
        if (errorMessage || errorCode) {
          console.error('AuthCallback: Auth callback error:', { errorCode, errorMessage });
          setError(errorMessage || errorCode || 'Authentication error');
          toast({
            title: "Authentication error",
            description: errorMessage || errorCode || 'Authentication failed',
            variant: "destructive"
          });
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        // Get current session after callback processing
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('AuthCallback: Session check result:', !!session);
        
        if (sessionError) {
          console.error('AuthCallback: Session error:', sessionError);
          setError(sessionError.message);
          toast({
            title: "Authentication error",
            description: sessionError.message,
            variant: "destructive"
          });
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }
        
        if (session?.user) {
          console.log('AuthCallback: Valid session found, user authenticated');
          toast({
            title: "Authentication successful",
            description: "Your account has been verified successfully!"
          });
          
          // Navigate to home page
          navigate('/', { replace: true });
        } else {
          console.log('AuthCallback: No session found after callback');
          toast({
            title: "Verification link expired",
            description: "Please try signing in again or request a new verification link",
            variant: "destructive"
          });
          setTimeout(() => navigate('/auth'), 3000);
        }
      } catch (err: any) {
        console.error("AuthCallback: Error in auth callback:", err);
        setError(err.message);
        toast({
          title: "Authentication error",
          description: err.message || "An unexpected error occurred",
          variant: "destructive"
        });
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, toast, location.search, location.hash]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="animate-pulse flex flex-col items-center space-y-4">
        <div className="h-16 w-16 mb-4 flex items-center justify-center">
          <div className="h-10 w-10 bg-primary rounded-full animate-pulse"></div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium mb-2">
            {error ? "Authentication Error" : "Verifying your account..."}
          </p>
          {error ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                {error}
              </p>
              <p className="text-xs text-muted-foreground">
                Redirecting to sign in page...
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your email verification.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
