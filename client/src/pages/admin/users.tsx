import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, UserPlus, Loader2, Key, Clock, MoreHorizontal, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userDetailDialogOpen, setUserDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Create user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserSubscriptionMonths, setNewUserSubscriptionMonths] = useState("");

  // Extend subscription state
  const [extendMonths, setExtendMonths] = useState("");

  // Reset password state
  const [newPassword, setNewPassword] = useState("");

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json() as Promise<User[]>;
    },
  });

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

  const extendSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error("No user selected");
      const res = await fetch(`/api/admin/users/${selectedUser.id}/extend-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ months: parseInt(extendMonths) }),
      });
      if (!res.ok) throw new Error("Failed to extend subscription");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setExtendDialogOpen(false);
      setExtendMonths("");
      setSelectedUser(null);
      toast({
        title: "Subscription Extended",
        description: "User subscription has been extended successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to extend subscription.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error("No user selected");
      const res = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: newPassword || "changeme123" }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      return res.json();
    },
    onSuccess: () => {
      setResetPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedUser(null);
      toast({
        title: "Password Reset",
        description: "User password has been reset successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset password.",
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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Create and manage user accounts</p>
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
            <CardTitle>All Users</CardTitle>
            <CardDescription>View and manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sub. End</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow 
                    key={u.id} 
                    data-testid={`user-row-${u.id}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedUser(u);
                      setUserDetailDialogOpen(true);
                    }}
                  >
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
                      {u.subscriptionPeriodEnd 
                        ? new Date(u.subscriptionPeriodEnd).toLocaleDateString()
                        : "—"
                      }
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString()
                        : "Never"
                      }
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={u.role === "admin"}
                            data-testid={`button-actions-${u.id}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(u);
                              setExtendDialogOpen(true);
                            }}
                            data-testid={`action-extend-${u.id}`}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Extend Subscription
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(u);
                              setResetPasswordDialogOpen(true);
                            }}
                            data-testid={`action-reset-password-${u.id}`}
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm(`Delete user ${u.email}?`)) {
                                deleteUserMutation.mutate(u.id);
                              }
                            }}
                            className="text-destructive"
                            data-testid={`action-delete-${u.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Extend Subscription Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
            <DialogDescription>
              Grant additional free months to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="months">Number of Months</Label>
              <Input
                id="months"
                type="number"
                min="1"
                value={extendMonths}
                onChange={(e) => setExtendMonths(e.target.value)}
                placeholder="e.g., 3"
                data-testid="input-extend-months"
              />
              <p className="text-xs text-muted-foreground">
                Current end: {selectedUser?.subscriptionPeriodEnd 
                  ? new Date(selectedUser.subscriptionPeriodEnd).toLocaleDateString()
                  : "Not set"
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => extendSubscriptionMutation.mutate()}
              disabled={!extendMonths || extendSubscriptionMutation.isPending}
              data-testid="button-confirm-extend"
            >
              {extendSubscriptionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Extend Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank for 'changeme123'"
                data-testid="input-new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => resetPasswordMutation.mutate()}
              disabled={resetPasswordMutation.isPending}
              data-testid="button-confirm-reset"
            >
              {resetPasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={userDetailDialogOpen} onOpenChange={setUserDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6 py-4">
              {/* Account Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Account Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedUser.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <Badge variant={selectedUser.role === "admin" ? "destructive" : "secondary"}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs">{selectedUser.id}</p>
                  </div>
                </div>
              </div>

              {/* Activity */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Activity</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Account Created</p>
                    <p className="font-medium">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                      <span className="text-muted-foreground ml-2">
                        ({formatDistanceToNow(new Date(selectedUser.createdAt), { addSuffix: true })})
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Login</p>
                    <p className="font-medium">
                      {selectedUser.lastLogin
                        ? new Date(selectedUser.lastLogin).toLocaleDateString()
                        : "Never"}
                      {selectedUser.lastLogin && (
                        <span className="text-muted-foreground ml-2">
                          ({formatDistanceToNow(new Date(selectedUser.lastLogin), { addSuffix: true })})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {new Date(selectedUser.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subscription & Billing */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Subscription & Billing</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge 
                      variant={selectedUser.subscriptionStatus === "active" ? "default" : "outline"}
                      className={selectedUser.subscriptionStatus === "active" ? "bg-green-600" : ""}
                    >
                      {selectedUser.subscriptionStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Subscription End Date</p>
                    <p className="font-medium">
                      {selectedUser.subscriptionPeriodEnd
                        ? new Date(selectedUser.subscriptionPeriodEnd).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  {selectedUser.stripeCustomerId && (
                    <div>
                      <p className="text-muted-foreground">Stripe Customer</p>
                      <p className="font-mono text-xs">{selectedUser.stripeCustomerId}</p>
                    </div>
                  )}
                  {selectedUser.subscriptionStatus === "active" && selectedUser.subscriptionPeriodEnd && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Time Remaining</p>
                      <p className="font-medium">
                        {new Date(selectedUser.subscriptionPeriodEnd) > new Date()
                          ? formatDistanceToNow(new Date(selectedUser.subscriptionPeriodEnd))
                          : "Expired"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
