
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import AuthNavBar from './AuthNavBar';
import { useAuth } from '@/hooks/use-auth';

const NavBar = () => {
  const { user, isAdmin, isSpectator } = useAuth();
  const location = useLocation();
  const isPouleRoute = location.pathname.startsWith('/poule/');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Poule Pursuit</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {/* Show Home button for authenticated users and spectators */}
            {(user || isSpectator) && (
              <Button variant="ghost" asChild>
                <Link to="/">Home</Link>
              </Button>
            )}
            
            {/* Only show Admin button for admin users (not spectators) */}
            {user && isAdmin && !isSpectator && (
              <Button variant="ghost" asChild>
                <Link to="/admin">Admin</Link>
              </Button>
            )}
            
            {/* Show spectator indicator */}
            {isSpectator && (
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                Spectator Mode
              </span>
            )}
            
            {/* Always show Auth section */}
            <AuthNavBar />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
