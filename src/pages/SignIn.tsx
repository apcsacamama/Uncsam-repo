import Navigation from "../components/Navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const cleanEmail = email.trim();

      // 1. SECURITY CHECK (Optional - Safe to fail)
      // Check if account is locked due to too many attempts
      try {
        const { data: isLocked } = await supabase.rpc('check_lockout', {
            user_email: cleanEmail
        });
        if (isLocked) {
            setErrorMsg("Account locked. Too many failed attempts. Try again in 30 mins.");
            setIsLoading(false);
            return;
        }
      } catch (err) {
        // If this fails (function missing), allow login to proceed
        console.warn("Lockout check skipped");
      }

      // 2. ATTEMPT REAL LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // --- LOGIN FAILED ---
        // Log the failure in DB (Fire and forget)
        supabase.rpc('handle_failed_login', { user_email: cleanEmail });
        
        setErrorMsg("Invalid email or password.");
      } else {
        // --- LOGIN SUCCESS ---
        
        if (data.user) {
           // Reset failure counters (Fire and forget)
           supabase.rpc('handle_successful_login', { user_id: data.user.id });
           
           // 3. CHECK ROLE & REDIRECT
           const { data: profile } = await supabase
             .from('profiles')
             .select('role')
             .eq('id', data.user.id)
             .single();

           if (profile?.role === 'admin') {
             navigate("/dashboard");
           } else {
             // 4. FIX: Send customer to Profile Page
             navigate("/profile"); 
           }
        }
      }

    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div
        className="min-h-screen relative flex items-center justify-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1920&h=1080&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />

        <div className="relative z-10 w-full max-w-md px-4">
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Sign In
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start text-sm">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors duration-200"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-red-600 hover:text-red-700 font-medium">
                    Create one here
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}