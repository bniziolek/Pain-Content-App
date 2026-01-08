import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, DollarSign, FileText, TrendingUp, Trash2, CheckCircle2, XCircle, Loader2, Settings2, Mail, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { User, FeatureFlag } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json() as Promise<User[]>;
    },
  });

  const toggleSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, currentStatus }: { userId: string; currentStatus: string }) => {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const periodEnd = newStatus === "active" 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const res = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subscriptionStatus: newStatus,
          subscriptionPeriodEnd: periodEnd,
        }),
      });

      if (!res.ok) throw new Error("Failed to update subscription");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: "Subscription Updated",
        description: "User subscription status has been changed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update subscription.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: "User Deleted",
        description: "User has been removed from the system.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  const { data: featureFlags = [], isLoading: flagsLoading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: async () => {
      const res = await fetch("/api/admin/feature-flags", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch feature flags");
      return res.json() as Promise<FeatureFlag[]>;
    },
  });

  const updateFeatureFlagMutation = useMutation({
    mutationFn: async ({ key, updates }: { key: string; updates: { isEnabled?: boolean; value?: string } }) => {
      const res = await fetch(`/api/admin/feature-flags/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update feature flag");
      return res.json();
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      toast({
        title: "Feature Flag Updated",
        description: `Feature flag "${key}" has been updated.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feature flag.",
        variant: "destructive",
      });
    },
  });

  if (statsLoading || usersLoading || flagsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, subscriptions, and system settings.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
              <p className="text-xs text-muted-foreground">Paying customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.monthlyRevenue || 0}</div>
              <p className="text-xs text-muted-foreground">Billing this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Items</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalContent || 0}</div>
              <p className="text-xs text-muted-foreground">Education modules</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                    <TableCell className="font-medium">{u.name || "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "destructive" : "secondary"}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={u.subscriptionStatus === "active" ? "default" : "outline"}
                        className={u.subscriptionStatus === "active" ? "bg-green-600" : ""}
                      >
                        {u.subscriptionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSubscriptionMutation.mutate({ 
                          userId: u.id, 
                          currentStatus: u.subscriptionStatus || "inactive" 
                        })}
                        disabled={u.role === "admin"}
                        data-testid={`button-toggle-subscription-${u.id}`}
                      >
                        {u.subscriptionStatus === "active" ? (
                          <><XCircle className="w-3 h-3 mr-1" /> Deactivate</>
                        ) : (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Activate</>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete user ${u.email}?`)) {
                            deleteUserMutation.mutate(u.id);
                          }
                        }}
                        disabled={u.role === "admin"}
                        data-testid={`button-delete-user-${u.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              <CardTitle>Feature Flags</CardTitle>
            </div>
            <CardDescription>Control system-wide features and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {featureFlags.map((flag) => (
              <div key={flag.key} className="border rounded-lg p-4" data-testid={`feature-flag-${flag.key}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{flag.name}</h4>
                      <Badge variant={flag.isEnabled ? "default" : "secondary"} className={flag.isEnabled ? "bg-green-600" : ""}>
                        {flag.isEnabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {flag.description && (
                      <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                    )}
                  </div>
                  <Switch
                    checked={flag.isEnabled}
                    onCheckedChange={(checked) => {
                      updateFeatureFlagMutation.mutate({
                        key: flag.key,
                        updates: { isEnabled: checked },
                      });
                    }}
                    data-testid={`toggle-flag-${flag.key}`}
                  />
                </div>
                
                {flag.key === 'content_delivery_mode' && flag.isEnabled && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-sm font-medium mb-2 block">Content Delivery Method</Label>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <button
                        type="button"
                        onClick={() => updateFeatureFlagMutation.mutate({
                          key: flag.key,
                          updates: { value: 'email' },
                        })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          flag.value === 'email' 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'border-muted hover:border-muted-foreground/30'
                        }`}
                        data-testid="select-email-mode"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">Email Delivery</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Send content via email with tracking
                        </p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => updateFeatureFlagMutation.mutate({
                          key: flag.key,
                          updates: { value: 'packet' },
                        })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          flag.value === 'packet' 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'border-muted hover:border-muted-foreground/30'
                        }`}
                        data-testid="select-packet-mode"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Download className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">Download Packet</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Printable content, no PHI tracking
                        </p>
                      </button>
                    </div>
                    
                    {flag.value === 'packet' && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                        <strong>Packet Mode Active:</strong> Email delivery is disabled. Clinicians will download/print content bundles without patient identifiers or tracking.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {featureFlags.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No feature flags configured</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
