import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { toast } = useToast();
  const { login } = useAuth();

  const isAdminEmail = email === "admin@rehabpilot.com";
  const isCreatingTrialUser = email && !isAdminEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isAdminEmail) {
        // Admin login
        await login(email, password);
        toast({
          title: "Access Granted",
          description: "Redirecting to admin dashboard...",
        });
        setLocation("/admin/dashboard");
      } else {
        // Create trial user - first login as admin
        await login("admin@rehabpilot.com", "admin123");
        
        // Then create the trial user
        const res = await fetch("/api/admin/create-trial-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, name: name || email.split("@")[0] }),
        });
        
        if (!res.ok) throw new Error("Failed to create trial user");
        const user = await res.json();
        
        toast({
          title: "Trial User Created",
          description: `${user.email} now has premium access until 12/31/9999. Default password: changeme123`,
        });
        
        // Redirect to admin dashboard to manage users
        setLocation("/admin/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Operation failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-sm border-gray-800 bg-gray-950 text-gray-100">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span className="text-sm font-bold tracking-wider text-red-500 uppercase">Admin Access</span>
          </div>
          <CardTitle className="text-2xl font-serif text-white">
            {isCreatingTrialUser ? "Create Trial User" : "System Login"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isCreatingTrialUser 
              ? "Create a new user with extended trial access" 
              : "Enter your administrative credentials"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                {isCreatingTrialUser ? "User Email" : "Admin Email"}
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder={isCreatingTrialUser ? "user@example.com" : "admin@rehabpilot.com"}
                className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600 focus-visible:ring-red-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                data-testid="input-admin-email"
              />
            </div>

            {isCreatingTrialUser && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">User Name (Optional)</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="Leave blank to use email prefix"
                  className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600 focus-visible:ring-red-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-user-name"
                />
              </div>
            )}

            {isAdminEmail && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  className="bg-gray-900 border-gray-800 text-white focus-visible:ring-red-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  data-testid="input-admin-password"
                />
              </div>
            )}

            {isCreatingTrialUser && (
              <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-md">
                <p className="text-xs text-gray-400">
                  • Trial until: <span className="text-white font-mono">12/31/9999</span><br />
                  • Default password: <span className="text-white font-mono">changeme123</span><br />
                  • Can be changed in admin dashboard
                </p>
              </div>
            )}

            {!email && (
              <p className="text-xs text-gray-500 italic">
                Admin login: admin@rehabpilot.com / admin123
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 text-white" 
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreatingTrialUser ? "Create Trial User" : "Access Dashboard"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Link href="/">
            <Button variant="link" className="w-full text-gray-500 hover:text-gray-300">
              Return to Public Site
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
