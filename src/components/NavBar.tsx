
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex-shrink-0 flex items-center text-primary font-medium text-lg"
            >
              Tournament Manager
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link 
              to="/" 
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive('/') 
                  ? "text-primary" 
                  : "text-foreground/80 hover:text-primary"
              )}
            >
              Overview
            </Link>
            <Link 
              to="/admin" 
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive('/admin') 
                  ? "text-primary" 
                  : "text-foreground/80 hover:text-primary"
              )}
            >
              Admin
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} animate-fade-in`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg rounded-b-lg">
          <Link
            to="/"
            className={cn(
              "block px-3 py-2 rounded-md text-base font-medium transition-colors",
              isActive('/') 
                ? "text-primary" 
                : "text-foreground/80 hover:text-primary"
            )}
            onClick={() => setIsOpen(false)}
          >
            Overview
          </Link>
          <Link
            to="/admin"
            className={cn(
              "block px-3 py-2 rounded-md text-base font-medium transition-colors",
              isActive('/admin') 
                ? "text-primary" 
                : "text-foreground/80 hover:text-primary"
            )}
            onClick={() => setIsOpen(false)}
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
