import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isSignup = searchParams.get("signup") === "true";
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: isSignup ? "Account created!" : "Welcome back",
        description: "Redirecting to dashboard...",
      });
      setLocation("/dashboard");
    }, 1500);
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
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" required />
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
                  <Input id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
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
