import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/admin/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-sm border-gray-800 bg-gray-950 text-gray-100">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span className="text-sm font-bold tracking-wider text-red-500 uppercase">Admin Access</span>
          </div>
          <CardTitle className="text-2xl font-serif text-white">System Login</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your administrative credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Admin Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@rehabpilot.internal" 
                className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600 focus-visible:ring-red-500"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input 
                id="password" 
                type="password" 
                className="bg-gray-900 border-gray-800 text-white focus-visible:ring-red-500"
                required 
              />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Access Dashboard
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
