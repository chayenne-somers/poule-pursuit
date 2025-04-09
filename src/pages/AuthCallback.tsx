
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
    // Extract any error message from the URL if present
    const params = new URLSearchParams(location.search);
    const errorMessage = params.get('error_description');
    
    if (errorMessage) {
      setError(errorMessage);
      toast({
        title: "Authentication error",
        description: errorMessage,
        variant: "destructive"
      });
    }

    // Handle the auth callback
    const handleAuthCallback = async () => {
      try {
        // Get the current session (will be set if the callback URL contained a valid token)
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(sessionError.message);
          toast({
            title: "Authentication error",
            description: sessionError.message,
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }
        
        if (data.session) {
          // If we have a session, the user was authenticated
          toast({
            title: "Authentication successful",
            description: "Your account has been verified"
          });
          
          navigate('/');
        } else if (!errorMessage) {
          // No session and no error means the token was invalid/expired
          toast({
            title: "Verification link expired",
            description: "Please try signing in or request a new verification link",
            variant: "destructive"
          });
          navigate('/auth');
        }
      } catch (err: any) {
        console.error("Error in auth callback:", err);
        setError(err.message);
        toast({
          title: "Authentication error",
          description: err.message,
          variant: "destructive"
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, toast, location.search]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-16 w-16 mb-4 flex items-center justify-center">
          <div className="h-10 w-10 bg-primary rounded-full"></div>
        </div>
        <p className="text-lg font-medium">
          {error ? "Authentication error..." : "Verifying your account..."}
        </p>
        {error && (
          <p className="text-sm text-destructive mt-2">
            Error: {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
