import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { User, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { path: "/", label: "HOME" },
    { path: "/offers", label: "OFFERS" },
    { path: "/custom", label: "CUSTOM" },
    { path: "/about", label: "ABOUT" },
    { path: "/contact", label: "CONTACT" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-red-600 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-white rounded-full p-1 w-12 h-12 flex items-center justify-center">
              <div className="bg-black rounded-full w-10 h-10 flex items-center justify-center text-white text-xs font-bold">
                <span>US</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-lg leading-tight">
                <div>UNCLE SAM</div>
                <div className="text-sm font-normal text-red-100">TOURS</div>
              </div>
            </div>
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

          {/* Sign In Button & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Link to="/signin">
              <Button
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-red-600 transition-colors"
              >
                <User className="w-4 h-4 mr-2" />
                SIGN IN
              </Button>
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-red-500">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-red-700 text-white"
                      : "text-red-100 hover:bg-red-700 hover:text-white"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
