
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
        console.log('Auth callback triggered');
        console.log('Current URL:', window.location.href);
        console.log('Location search:', location.search);
        console.log('Location hash:', location.hash);

        // Extract any error message from the URL if present
        const urlParams = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.substring(1));
        
        const errorMessage = urlParams.get('error_description') || hashParams.get('error_description');
        const errorCode = urlParams.get('error') || hashParams.get('error');
        
        if (errorMessage || errorCode) {
          console.error('Auth callback error:', { errorCode, errorMessage });
          setError(errorMessage || errorCode || 'Authentication error');
          toast({
            title: "Authentication error",
            description: errorMessage || errorCode || 'Authentication failed',
            variant: "destructive"
          });
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        // Handle the auth callback - this processes tokens from the URL
        const { data, error: callbackError } = await supabase.auth.getSession();
        
        console.log('Session data:', data);
        
        if (callbackError) {
          console.error('Session error:', callbackError);
          setError(callbackError.message);
          toast({
            title: "Authentication error",
            description: callbackError.message,
            variant: "destructive"
          });
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }
        
        if (data.session) {
          console.log('Valid session found, user authenticated');
          // If we have a session, the user was authenticated successfully
          toast({
            title: "Authentication successful",
            description: "Your account has been verified successfully!"
          });
          
          // Navigate to home page
          navigate('/', { replace: true });
        } else {
          console.log('No session found');
          // No session means the verification link might be invalid/expired
          toast({
            title: "Verification link expired",
            description: "Please try signing in again or request a new verification link",
            variant: "destructive"
          });
          setTimeout(() => navigate('/auth'), 3000);
        }
      } catch (err: any) {
        console.error("Error in auth callback:", err);
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
