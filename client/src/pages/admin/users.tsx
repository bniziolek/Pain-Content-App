import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2, Filter, Crown, Sparkles, Lock, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { PublicUser as User } from "@shared/api-types";

const TIER_BADGE_CONFIG: Record<string, { className: string; icon?: typeof Crown }> = {
  free: { className: "bg-gray-100 text-gray-600" },
  basic: { className: "bg-blue-100 text-blue-600", icon: Sparkles },
  pro: { className: "bg-amber-100 text-amber-600", icon: Crown },
  enterprise: { className: "bg-purple-100 text-purple-600", icon: Crown },
};

type UserStatus = "active" | "trial" | "expired" | "inactive";

function getUserStatus(user: User): UserStatus {
  const status = user.subscriptionStatus || "inactive";
  
  if (status === "trialing") {
    return "trial";
  }
  
  if (status === "active") {
    if (user.subscriptionPeriodEnd) {
      const endDate = new Date(user.subscriptionPeriodEnd);
      if (endDate < new Date()) {
        return "expired";
      }
    }
    return "active";
  }
  
  if (status === "past_due" || status === "canceled") {
    return "expired";
  }
  
  return "inactive";
}

const STATUS_CONFIG: Record<UserStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700", icon: CheckCircle2 },
  trial: { label: "Trial", className: "bg-blue-100 text-blue-700", icon: Clock },
  expired: { label: "Expired", className: "bg-red-100 text-red-700", icon: AlertTriangle },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-600", icon: Lock },
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserSubscriptionMonths, setNewUserSubscriptionMonths] = useState("");

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json() as Promise<User[]>;
    },
  });

  // Filter users by tier, status, and search query
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesTier = tierFilter === "all" || (u.subscriptionTier || "basic") === tierFilter;
      const matchesStatus = statusFilter === "all" || getUserStatus(u) === statusFilter;
      const matchesSearch = !searchQuery || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTier && matchesStatus && matchesSearch;
    });
  }, [users, tierFilter, statusFilter, searchQuery]);

  // Count by tier for filter badges
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { all: users.length, free: 0, basic: 0, pro: 0, enterprise: 0 };
    users.forEach((u) => {
      const tier = u.subscriptionTier || "basic";
      counts[tier] = (counts[tier] || 0) + 1;
    });
    return counts;
  }, [users]);

  // Count by status for filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: users.length, active: 0, trial: 0, expired: 0, inactive: 0 };
    users.forEach((u) => {
      const status = getUserStatus(u);
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [users]);

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          password: newUserPassword || "changeme123",
          subscriptionMonths: newUserSubscriptionMonths ? parseInt(newUserSubscriptionMonths) : 0,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreateDialogOpen(false);
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      setNewUserSubscriptionMonths("");
      toast({
        title: "User Created",
        description: "New user account has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (usersLoading) {
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
      <div className="space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">View and manage user accounts. Click on a user to see details and perform actions.</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-user">
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new clinician account with optional subscription
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    data-testid="input-create-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Full Name"
                    data-testid="input-create-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Leave blank for 'changeme123'"
                    data-testid="input-create-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription">Free Subscription Months (optional)</Label>
                  <Input
                    id="subscription"
                    type="number"
                    min="0"
                    value={newUserSubscriptionMonths}
                    onChange={(e) => setNewUserSubscriptionMonths(e.target.value)}
                    placeholder="0"
                    data-testid="input-create-months"
                  />
                  <p className="text-xs text-muted-foreground">Leave as 0 for inactive subscription</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createUserMutation.mutate()}
                  disabled={!newUserEmail || createUserMutation.isPending}
                  data-testid="button-confirm-create"
                >
                  {createUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  {filteredUsers.length} of {users.length} user{users.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px]"
                  data-testid="input-search-users"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
                    <SelectItem value="active">Active ({statusCounts.active})</SelectItem>
                    <SelectItem value="trial">Trial ({statusCounts.trial})</SelectItem>
                    <SelectItem value="expired">Expired ({statusCounts.expired})</SelectItem>
                    <SelectItem value="inactive">Inactive ({statusCounts.inactive})</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-tier-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers ({tierCounts.all})</SelectItem>
                    <SelectItem value="basic">Basic ({tierCounts.basic})</SelectItem>
                    <SelectItem value="pro">Pro ({tierCounts.pro})</SelectItem>
                    <SelectItem value="enterprise">Enterprise ({tierCounts.enterprise})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow 
                    key={u.id}
                    data-testid={`user-row-${u.id}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/users/${u.id}`)}
                  >
                    <TableCell className="font-medium">{u.name || "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "destructive" : "secondary"}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const tier = u.subscriptionTier || "basic";
                        const config = TIER_BADGE_CONFIG[tier] || TIER_BADGE_CONFIG.basic;
                        const Icon = config.icon;
                        return (
                          <Badge variant="outline" className={config.className}>
                            {Icon && <Icon className="w-3 h-3 mr-1" />}
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = getUserStatus(u);
                        const config = STATUS_CONFIG[status];
                        const StatusIcon = config.icon;
                        return (
                          <Badge variant="outline" className={config.className}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {u.subscriptionPeriodEnd
                        ? new Date(u.subscriptionPeriodEnd).toLocaleDateString()
                        : "—"
                      }
                    </TableCell>
                    <TableCell>
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString()
                        : "Never"
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
