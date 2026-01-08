import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Loader2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
];

function PasswordStrengthIndicator({ password }: { password: string }) {
  const metRequirements = PASSWORD_REQUIREMENTS.filter(req => req.test(password));
  const strength = metRequirements.length;
  
  const getStrengthLabel = () => {
    if (password.length === 0) return '';
    if (strength <= 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    return 'Strong';
  };
  
  const getStrengthColor = () => {
    if (strength <= 1) return 'bg-red-500';
    if (strength === 2) return 'bg-orange-500';
    if (strength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="space-y-2">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <div key={req.id} className="flex items-center gap-2 text-sm">
              {met ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground/50" />
              )}
              <span className={met ? 'text-green-600' : 'text-muted-foreground'}>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {password.length > 0 && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  level <= strength ? getStrengthColor() : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className={`text-xs font-medium ${
            strength <= 1 ? 'text-red-500' : 
            strength === 2 ? 'text-orange-500' : 
            strength === 3 ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            Password strength: {getStrengthLabel()}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const isSignup = searchString.includes("signup=true");
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const { toast } = useToast();
  const { login, register } = useAuth();

  useEffect(() => {
    setErrors({});
  }, [isSignup]);

  const isPasswordValid = useMemo(() => {
    return PASSWORD_REQUIREMENTS.every(req => req.test(password));
  }, [password]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (isSignup && !isPasswordValid) {
      newErrors.password = "Password does not meet all requirements";
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
      } else if (isSignup) {
        setErrors({ general: errorMessage });
      } else {
        setErrors({ general: "Invalid email or password. Need an account? Try signing up below." });
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
                    placeholder="email@example.com" 
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
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
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
                  {isSignup && <PasswordStrengthIndicator password={password} />}
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11" 
                  disabled={isLoading || (isSignup && !isPasswordValid && password.length > 0)} 
                  data-testid="button-submit"
                >
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
