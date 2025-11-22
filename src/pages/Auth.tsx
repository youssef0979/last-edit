import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";
import { passwordSchema, emailSchema, fullNameSchema, usernameSchema } from "@/lib/validations";
import { handleError } from "@/lib/error-handler";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  
  // Rate limiting state
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [signupAttempts, setSignupAttempts] = useState(0);
  const [signupLockoutUntil, setSignupLockoutUntil] = useState<Date | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Reset lockout when time expires
  useEffect(() => {
    if (lockoutUntil && new Date() >= lockoutUntil) {
      setLoginAttempts(0);
      setLockoutUntil(null);
    }
    if (signupLockoutUntil && new Date() >= signupLockoutUntil) {
      setSignupAttempts(0);
      setSignupLockoutUntil(null);
    }
  }, [lockoutUntil, signupLockoutUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limiting
    if (lockoutUntil && new Date() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000);
      toast({
        title: "Too many attempts",
        description: `Please wait ${remainingSeconds} seconds before trying again.`,
        variant: "destructive",
      });
      return;
    }

    // Validate email
    const emailResult = emailSchema.safeParse(loginEmail);
    if (!emailResult.success) {
      toast({
        title: "Invalid email",
        description: emailResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      // Reset attempts on success
      setLoginAttempts(0);
      setLockoutUntil(null);

      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
    } catch (error: any) {
      // Increment failed attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Lock out after 5 failed attempts for 5 minutes
      if (newAttempts >= 5) {
        const lockoutTime = new Date(Date.now() + 5 * 60 * 1000);
        setLockoutUntil(lockoutTime);
        toast({
          title: "Account temporarily locked",
          description: "Too many failed login attempts. Please try again in 5 minutes.",
          variant: "destructive",
        });
      } else {
        const remainingAttempts = 5 - newAttempts;
        toast({
          title: "Login failed",
          description: `${handleError(error, "auth")} ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limiting
    if (signupLockoutUntil && new Date() < signupLockoutUntil) {
      const remainingSeconds = Math.ceil((signupLockoutUntil.getTime() - Date.now()) / 1000);
      toast({
        title: "Too many attempts",
        description: `Please wait ${remainingSeconds} seconds before trying again.`,
        variant: "destructive",
      });
      return;
    }

    // Validate inputs
    const emailResult = emailSchema.safeParse(signupEmail);
    if (!emailResult.success) {
      toast({
        title: "Invalid email",
        description: emailResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const nameResult = fullNameSchema.safeParse(signupFullName);
    if (!nameResult.success) {
      toast({
        title: "Invalid name",
        description: nameResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const usernameResult = usernameSchema.safeParse(signupUsername);
    if (!usernameResult.success) {
      toast({
        title: "Invalid username",
        description: usernameResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const passwordResult = passwordSchema.safeParse(signupPassword);
    if (!passwordResult.success) {
      toast({
        title: "Weak password",
        description: passwordResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signupFullName,
            username: signupUsername,
          },
        },
      });

      if (error) throw error;

      // Reset attempts on success
      setSignupAttempts(0);
      setSignupLockoutUntil(null);

      toast({
        title: "Account created!",
        description: "Welcome to Resolve. You're now logged in.",
      });
    } catch (error: any) {
      // Increment failed attempts
      const newAttempts = signupAttempts + 1;
      setSignupAttempts(newAttempts);

      // Lock out after 3 failed signup attempts for 10 minutes
      if (newAttempts >= 3) {
        const lockoutTime = new Date(Date.now() + 10 * 60 * 1000);
        setSignupLockoutUntil(lockoutTime);
        toast({
          title: "Too many signup attempts",
          description: "Please try again in 10 minutes.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signup failed",
          description: handleError(error, "auth"),
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isLoginLocked = lockoutUntil && new Date() < lockoutUntil;
  const isSignupLocked = signupLockoutUntil && new Date() < signupLockoutUntil;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary p-3">
              <Activity className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Resolve</CardTitle>
          <CardDescription>Track your wellness and productivity journey</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoading || isLoginLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoading || isLoginLocked}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || isLoginLocked}
                >
                  {isLoading ? "Logging in..." : "Log In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    required
                    disabled={isLoading || isSignupLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="johndoe"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value.toLowerCase())}
                    required
                    disabled={isLoading || isSignupLocked}
                  />
                  <p className="text-xs text-muted-foreground">
                    3-20 characters, letters, numbers, dashes and underscores only
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={isLoading || isSignupLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    disabled={isLoading || isSignupLocked}
                  />
                  <PasswordStrengthIndicator password={signupPassword} />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || isSignupLocked}
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
