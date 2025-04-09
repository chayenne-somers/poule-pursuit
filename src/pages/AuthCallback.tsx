
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        toast({
          title: "Authentication error",
          description: error.message,
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
      
      // If we get here, the user was authenticated
      toast({
        title: "Authentication successful",
        description: "Your account has been verified"
      });
      
      navigate('/');
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-16 w-16 mb-4 flex items-center justify-center">
          <div className="h-10 w-10 bg-primary rounded-full"></div>
        </div>
        <p className="text-lg font-medium">Verifying your account...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
