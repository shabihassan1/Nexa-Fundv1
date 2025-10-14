import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import WalletConnect from './WalletConnect';
import RoleBadge from './RoleBadge';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    logout();
  };

  // Check if user is admin or super admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <header className="py-4 border-b">
      <div className="container flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-green-600">Nexa Fund</h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-base font-medium text-gray-700 hover:text-green-600">
            Home
          </Link>
          <Link to="/features" className="text-base font-medium text-gray-700 hover:text-green-600">
            Features
          </Link>
          <Link to="/browse" className="text-base font-medium text-gray-700 hover:text-green-600">
            Browse
          </Link>
          <Link to="/blog" className="text-base font-medium text-gray-700 hover:text-green-600">
            Blog
          </Link>
          <Link to="/pricing" className="text-base font-medium text-gray-700 hover:text-green-600">
            Pricing
          </Link>
          <Link to="/about" className="text-base font-medium text-gray-700 hover:text-green-600">
            About
          </Link>
          <Link to="/contact" className="text-base font-medium text-gray-700 hover:text-green-600">
            Contact
          </Link>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <User className="h-5 w-5" />
                    {/* Admin indicator - small badge on avatar */}
                    {isAdmin && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                        <Shield className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium leading-none">{user?.name}</p>
                          <p className="text-xs leading-none text-muted-foreground mt-1">{user?.email}</p>
                        </div>
                        {user?.role && (
                          <RoleBadge role={user.role} size="sm" />
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/preferences" className="flex items-center">
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      Preferences
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="text-red-600 font-medium flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <WalletConnect />
              <Link to="/start-campaign">
                <Button className="text-base font-medium bg-green-500 hover:bg-green-600">
                  Start Campaign
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" className="text-base font-medium">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="text-base font-medium bg-green-500 hover:bg-green-600">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button onClick={toggleMenu} className="md:hidden">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden py-4 px-4 bg-white absolute top-16 left-0 right-0 z-50 border-b animate-fade-in">
          <nav className="flex flex-col space-y-4">
            <Link to="/" className="text-base font-medium text-gray-700 hover:text-green-600">
              Home
            </Link>
            <Link to="/features" className="text-base font-medium text-gray-700 hover:text-green-600">
              Features
            </Link>
            <Link to="/browse" className="text-base font-medium text-gray-700 hover:text-green-600">
              Browse
            </Link>
            <Link to="/blog" className="text-base font-medium text-gray-700 hover:text-green-600">
              Blog
            </Link>
            <Link to="/pricing" className="text-base font-medium text-gray-700 hover:text-green-600">
              Pricing
            </Link>
            <Link to="/about" className="text-base font-medium text-gray-700 hover:text-green-600">
              About
            </Link>
            <Link to="/contact" className="text-base font-medium text-gray-700 hover:text-green-600">
              Contact
            </Link>
            
            {isAuthenticated ? (
              <>
                {/* Mobile User Info with Role Badge */}
                <div className="py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    {user?.role && (
                      <RoleBadge role={user.role} size="sm" />
                    )}
                  </div>
                </div>
                
                <Link to="/profile" className="text-base font-medium text-gray-700 hover:text-green-600">
                  Profile
                </Link>
                <Link to="/dashboard" className="text-base font-medium text-gray-700 hover:text-green-600">
                  Dashboard
                </Link>
                
                {/* Mobile Admin Panel Link */}
                {isAdmin && (
                  <Link to="/admin" className="text-base font-medium text-red-600 hover:text-red-700 flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="text-left text-base font-medium text-red-500 hover:text-red-600"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-base font-medium text-gray-700 hover:text-green-600">
                  Sign In
                </Link>
                <Link to="/register" className="text-base font-medium text-gray-700 hover:text-green-600">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
