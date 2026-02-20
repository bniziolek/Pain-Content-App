import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Shield,
  Eye,
  Database,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AdminPersona = "content_admin" | "usage_monitor";

interface AdminLayoutProps {
  children: React.ReactNode;
  persona: AdminPersona;
  onPersonaChange: (value: AdminPersona) => void;
}

export function AdminLayout({ children, persona, onPersonaChange }: AdminLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-gray-900 text-white border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-1.5 rounded">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif text-lg font-bold tracking-tight">DriverPath Admin</span>
            <span className="text-gray-600 mx-2">|</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Current View:</span>
              <Select value={persona} onValueChange={(v) => onPersonaChange(v as AdminPersona)}>
                <SelectTrigger className="w-[180px] h-8 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content_admin">
                    <div className="flex items-center gap-2">
                      <Database className="w-3 h-3" /> Content Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="usage_monitor">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3" /> Usage Monitor
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-red-900 text-red-200 text-xs">AD</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-200">System Admin</span>
            </div>
            <Link href="/admin/login">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
