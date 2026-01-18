import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, DollarSign, FileText, TrendingUp, Trash2, CheckCircle2, XCircle, Loader2, Search, ArrowUpDown, UserPlus, Activity, AlertTriangle, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

type SortField = "name" | "email" | "createdAt" | "lastLogin";
type SortDirection = "asc" | "desc";

interface EnhancedStats {
  activeUsersDaily: number;
  activeUsersWeekly: number;
  activeUsersMonthly: number;
  recentSignups: Array<{ id: string; email: string; name: string | null; createdAt: string }>;
  churned: number;
  subscriptionBreakdown: { tier: string; count: number }[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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

  const { data: enhancedStats, isLoading: enhancedStatsLoading } = useQuery<EnhancedStats>({
    queryKey: ["admin-enhanced-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/enhanced-stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch enhanced stats");
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
      queryClient.invalidateQueries({ queryKey: ["admin-enhanced-stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-enhanced-stats"] });
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedUsers = users
    .filter((u) => {
      const matchesSearch = 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      const matchesTier = tierFilter === "all" || u.subscriptionTier === tierFilter;
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && u.subscriptionStatus === "active") ||
        (statusFilter === "inactive" && u.subscriptionStatus !== "active") ||
        (statusFilter === "churned" && u.subscriptionStatus === "canceled");
      
      return matchesSearch && matchesTier && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "lastLogin":
          const aLogin = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
          const bLogin = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
          comparison = aLogin - bLogin;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  if (statsLoading || usersLoading || enhancedStatsLoading) {
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
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, subscriptions, and system settings.</p>
        </div>

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
              <div className="text-2xl font-bold">${stats?.mrr || 0}</div>
              <p className="text-xs text-muted-foreground">MRR this month</p>
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enhancedStats?.activeUsersDaily || 0}</div>
              <p className="text-xs text-muted-foreground">Logged in last 24h</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enhancedStats?.activeUsersWeekly || 0}</div>
              <p className="text-xs text-muted-foreground">Logged in last 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enhancedStats?.activeUsersMonthly || 0}</div>
              <p className="text-xs text-muted-foreground">Logged in last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churned Users</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enhancedStats?.churned || 0}</div>
              <p className="text-xs text-muted-foreground">Canceled subscriptions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Recent Signups
              </CardTitle>
              <CardDescription>New users in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enhancedStats?.recentSignups.slice(0, 5).map((signup) => (
                  <div key={signup.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{signup.name || "—"}</p>
                      <p className="text-sm text-muted-foreground">{signup.email}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(signup.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}
                {(!enhancedStats?.recentSignups || enhancedStats.recentSignups.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent signups</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Subscription Breakdown
              </CardTitle>
              <CardDescription>Users by subscription tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enhancedStats?.subscriptionBreakdown.map((tier) => (
                  <div key={tier.tier} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{tier.tier}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">{tier.count}</span>
                      <span className="text-sm text-muted-foreground">users</span>
                    </div>
                  </div>
                ))}
                {(!enhancedStats?.subscriptionBreakdown || enhancedStats.subscriptionBreakdown.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No subscription data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-filter-tier">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("name")} className="flex items-center gap-1" data-testid="button-sort-name">
                      User
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("email")} className="flex items-center gap-1" data-testid="button-sort-email">
                      Email
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("createdAt")} className="flex items-center gap-1" data-testid="button-sort-created">
                      Created
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("lastLogin")} className="flex items-center gap-1" data-testid="button-sort-login">
                      Last Login
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedUsers.map((u) => (
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
                    <TableCell className="text-sm text-muted-foreground">
                      {u.lastLogin 
                        ? formatDistanceToNow(new Date(u.lastLogin), { addSuffix: true })
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/admin/users/${u.id}`}>
                        <Button variant="ghost" size="sm" data-testid={`button-view-user-${u.id}`}>
                          <Eye className="w-3 h-3" />
                        </Button>
                      </Link>
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
            {filteredAndSortedUsers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No users match your filters</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
