import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Loader2, ArrowLeft, Check, X } from "lucide-react";

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

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const token = new URLSearchParams(searchString).get('token');
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; general?: string }>({});

  const isPasswordValid = PASSWORD_REQUIREMENTS.every(req => req.test(password));

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reset email');
      }
      
      setEmailSent(true);
    } catch (error: any) {
      setErrors({ general: error.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!password) {
      setErrors({ password: "Password is required" });
      return;
    }
    if (!isPasswordValid) {
      setErrors({ password: "Password does not meet all requirements" });
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset password');
      }
      
      setResetComplete(true);
    } catch (error: any) {
      setErrors({ general: error.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-8">
            <Activity className="w-6 h-6" />
            <span>RehabPilot</span>
          </div>
          
          <Card className="border-none shadow-none">
            <CardHeader className="px-0">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-serif">Password reset</CardTitle>
              <CardDescription>
                Your password has been successfully reset. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Link href="/auth">
                <Button className="w-full h-11" data-testid="button-signin">
                  Sign in
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-8">
            <Activity className="w-6 h-6" />
            <span>RehabPilot</span>
          </div>
          
          <Card className="border-none shadow-none">
            <CardHeader className="px-0">
              <CardTitle className="text-3xl font-serif">Set new password</CardTitle>
              <CardDescription>
                Create a strong password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleResetPassword} className="space-y-4">
                {errors.general && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm" data-testid="error-general">
                    {errors.general}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
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
                  <PasswordStrengthIndicator password={password} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    className={errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                    data-testid="input-confirm-password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive" data-testid="error-confirm-password">{errors.confirmPassword}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11" 
                  disabled={isLoading || !isPasswordValid}
                  data-testid="button-reset"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset password
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <div className="text-center">
            <Link href="/auth" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-8">
            <Activity className="w-6 h-6" />
            <span>RehabPilot</span>
          </div>
          
          <Card className="border-none shadow-none">
            <CardHeader className="px-0">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-serif">Check your email</CardTitle>
              <CardDescription>
                If an account exists with <strong>{email}</strong>, we've sent password reset instructions.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                The link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>
              <Link href="/auth">
                <Button variant="outline" className="w-full h-11" data-testid="button-back">
                  Back to sign in
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-8">
          <Activity className="w-6 h-6" />
          <span>RehabPilot</span>
        </div>
        
        <Card className="border-none shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-3xl font-serif">Forgot password?</CardTitle>
            <CardDescription>
              No worries, we'll send you reset instructions.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <form onSubmit={handleRequestReset} className="space-y-4">
              {errors.general && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm" data-testid="error-general">
                  {errors.general}
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
              <Button type="submit" className="w-full h-11" disabled={isLoading} data-testid="button-submit">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <Link href="/auth" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
