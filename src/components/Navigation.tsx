import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { User, Menu, X, LogOut, LayoutDashboard, Shield } from "lucide-react"; 
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { User as SupabaseUser } from "@supabase/supabase-js";
import UncleSamLogo from "./UncleSamLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth State
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); 

  // Check if we are on an Auth Page
  const isAuthPage = ["/signin", "/signup"].includes(location.pathname);

  // --- HELPER: Check Admin Role ---
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) return false;
      return profile?.role === 'admin';
    } catch (error) {
      console.error("Error fetching profile role:", error);
      return false;
    }
  };

  // --- AUTO-LOGOUT FUNCTION ---
  const forceLogout = () => {
    console.log("⚠️ Detecting stale session. Auto-cleaning...");
    localStorage.clear(); 
    sessionStorage.clear();
    setUser(null);
    setIsAdmin(false);
    // Do not redirect automatically here, just clear state so UI updates
  };

  // --- AUTH LISTENER ---
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // 1. TIMEOUT GUARD: Force stop loading after 3 seconds
      // This prevents the button from "disappearing" if the network hangs
      const timer = setTimeout(() => {
        if (mounted && isLoading) {
          console.log("⚠️ Auth check timed out. Showing default state.");
          setIsLoading(false);
        }
      }, 3000);

      try {
        // 2. Try to get the session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        const session = data.session;

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            const isOwner = await checkAdminStatus(session.user.id);
            if (mounted) setIsAdmin(isOwner);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
        if (mounted) forceLogout();
      } finally {
        if (mounted) {
          setIsLoading(false);
          clearTimeout(timer); // Clear the safety timer if we finished successfully
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        navigate("/signin");
        return;
      }

      setUser(session?.user ?? null);
      
      if (session?.user) {
        const isOwner = await checkAdminStatus(session.user.id);
        if (mounted) setIsAdmin(isOwner);
      } else {
        if (mounted) setIsAdmin(false);
      }
      
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- MANUAL SIGN OUT ---
  const handleSignOut = async (e?: Event | React.SyntheticEvent) => {
    if (e) e.preventDefault();
    
    // 1. FORCE CLEAR BROWSER MEMORY
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. Clear UI State Immediately
    setUser(null);
    setIsAdmin(false);
    setIsMenuOpen(false);
    
    // 3. Redirect Immediately
    navigate("/signin");

    // 4. Tell Server (Fire and Forget)
    supabase.auth.signOut();
  };

  const navLinks = [
    { path: "/", label: "HOME" },
    { path: "/offers", label: "TOUR OFFERS" },
    { path: "/custom", label: "CUSTOM TOURS" },
    { path: "/about", label: "ABOUT" },
    { path: "/contact", label: "CONTACT" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-red-600 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <UncleSamLogo size="md" className="hidden sm:flex" />
            <UncleSamLogo size="sm" className="sm:hidden" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors hover:text-red-200 ${
                  isActive(link.path)
                    ? "text-white border-b-2 border-white pb-1"
                    : "text-red-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions (User Menu / Sign In) */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
               // Loading State: Simple placeholder
               <div className="w-10 h-10 animate-pulse bg-red-500 rounded-full" /> 
            ) : user ? (
              // LOGGED IN STATE
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-10 w-10 rounded-full border border-white/30 hover:bg-red-700 text-white p-0"
                  >
                    {isAdmin ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">My Account</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>

                  {isAdmin && (
                    <DropdownMenuItem onSelect={() => navigate("/dashboard")} className="cursor-pointer bg-red-50 focus:bg-red-100">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-red-600" />
                      <span className="text-red-600 font-medium">Owner Dashboard</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut} className="text-red-600 cursor-pointer focus:text-red-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // LOGGED OUT STATE
              // Check specifically if user is NULL to ensure button renders
              (!isAuthPage) && (
                <Link to="/signin">
                  <Button
                    variant="outline"
                    className="bg-transparent border-white text-white hover:bg-white hover:text-red-600 transition-colors"
                  >
                    <User className="w-4 h-4 mr-2" />
                    SIGN IN
                  </Button>
                </Link>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-white hover:bg-red-700 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-red-500 bg-red-600 shadow-inner">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-red-800 text-white"
                      : "text-red-100 hover:bg-red-700 hover:text-white"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {!isLoading && user && (
                <div className="border-t border-red-500 my-2 pt-2">
                  <p className="px-3 text-xs text-red-200 mb-1 font-semibold uppercase tracking-wider">Account</p>
                  <p className="px-3 text-xs text-white/70 mb-3 truncate">{user.email}</p>
                  
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-red-100 hover:bg-red-700 hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/dashboard"
                      className="block px-3 py-2 rounded-md text-base font-bold text-white bg-red-700 hover:bg-red-800 mt-1 mb-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="inline w-4 h-4 mr-2" />
                      Owner Dashboard
                    </Link>
                  )}

                  <button
                    onClick={(e) => handleSignOut(e)}
                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-100 hover:bg-red-700 hover:text-white"
                  >
                    Sign Out
                  </button>
                </div>
              )}
              
              {/* Force show Sign In if not loading and no user */}
              {!isLoading && !user && !isAuthPage && (
                 <Link
                   to="/signin"
                   className="block px-3 py-2 rounded-md text-base font-medium text-red-100 hover:bg-red-700 hover:text-white border-t border-red-500 mt-2"
                   onClick={() => setIsMenuOpen(false)}
                 >
                   Sign In
                 </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}