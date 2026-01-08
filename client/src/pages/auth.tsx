import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isSignup = searchParams.get("signup") === "true";
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const { toast } = useToast();
  const { login, register } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (isSignup && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isSignup) {
        await register(email, password, name || undefined);
        toast({
          title: "Account created!",
          description: "Please complete your subscription setup.",
        });
        setLocation("/subscription");
      } else {
        const user = await login(email, password);
        
        if (user && !user.onboardingCompleted && user.role !== 'admin') {
          toast({
            title: "Welcome!",
            description: "Let's get you set up...",
          });
          setLocation("/onboarding");
        } else {
          toast({
            title: "Welcome back",
            description: "Redirecting to dashboard...",
          });
          setLocation("/dashboard");
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || "Authentication failed";
      
      if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("exist")) {
        setErrors({ email: "An account with this email already exists" });
      } else if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("user not found")) {
        setErrors({ email: "Invalid email or password" });
      } else if (errorMessage.toLowerCase().includes("password") || errorMessage.toLowerCase().includes("invalid")) {
        setErrors({ general: "Invalid email or password" });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-8">
            <Activity className="w-6 h-6" />
            <span>RehabPilot</span>
          </div>

          <Card className="border-none shadow-none">
            <CardHeader className="px-0">
              <CardTitle className="text-3xl font-serif">
                {isSignup ? "Create an account" : "Welcome back"}
              </CardTitle>
              <CardDescription>
                {isSignup 
                  ? "Enter your email below to start your free trial" 
                  : "Enter your email to sign in to your account"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm" data-testid="error-general">
                    {errors.general}
                  </div>
                )}
                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (optional)</Label>
                    <Input 
                      id="name" 
                      type="text" 
                      placeholder="Dr. Jane Smith" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-testid="input-name"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="text"
                    placeholder="m@example.com" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                    data-testid="input-email"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive" data-testid="error-email">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {!isSignup && (
                      <a href="#" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                    data-testid="input-password"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive" data-testid="error-password">{errors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading} data-testid="button-submit">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSignup ? "Create Account" : "Sign In"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="px-0 flex justify-center">
              <p className="text-sm text-muted-foreground">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <Link href={isSignup ? "/auth" : "/auth?signup=true"}>
                  <Button variant="link" className="p-0 h-auto font-semibold">
                    {isSignup ? "Sign in" : "Sign up"}
                  </Button>
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Right: Visual */}
      <div className="hidden lg:flex bg-muted items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/90" />
        <div className="relative z-10 max-w-lg text-white p-12">
          <blockquote className="text-2xl font-serif italic mb-6">
            "RehabPilot has completely transformed how I educate my patients. The automated assessments save me hours every week."
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              SM
            </div>
            <div>
              <div className="font-semibold">Dr. Sarah Mitchell</div>
              <div className="text-primary-foreground/70 text-sm">Physical Therapist, DPT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
