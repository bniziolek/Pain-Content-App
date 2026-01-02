import { useState } from "react";
import { useRoute, Link } from "wouter";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Edit2, Save, X, Key, Clock, Trash2, Loader2, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UserDetailPage() {
  const [, params] = useRoute("/admin/users/:id");
  const userId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedRole, setEditedRole] = useState<"clinician" | "admin">("clinician");

  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendMonths, setExtendMonths] = useState("");
  
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      const userData = await res.json() as User;
      setEditedName(userData.name || "");
      setEditedEmail(userData.email);
      setEditedRole(userData.role as "clinician" | "admin");
      return userData;
    },
    enabled: !!userId,
  });

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editedName,
          email: editedEmail,
          role: editedRole,
        }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsEditing(false);
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const extendSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/extend-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ months: parseInt(extendMonths) }),
      });
      if (!res.ok) throw new Error("Failed to extend subscription");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setExtendDialogOpen(false);
      setExtendMonths("");
      toast({
        title: "Subscription Extended",
        description: `Added ${extendMonths} month(s) to subscription.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Extension Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      return res.json();
    },
    onSuccess: () => {
      setResetPasswordDialogOpen(false);
      setNewPassword("");
      toast({
        title: "Password Reset",
        description: "User password has been reset successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
            <Link href="/admin/users">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Users
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{user.name || "Unnamed User"}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant={user.role === "admin" ? "destructive" : "secondary"} className="text-sm">
              {user.role}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="subscription" data-testid="tab-subscription">Subscription</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">Billing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Basic user account details</CardDescription>
                </div>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    disabled={user.role === "admin"}
                    data-testid="button-edit-user"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedName(user.name || "");
                        setEditedEmail(user.email);
                        setEditedRole(user.role);
                      }}
                      data-testid="button-cancel-edit"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateUserMutation.mutate()}
                      disabled={updateUserMutation.isPending}
                      data-testid="button-save-user"
                    >
                      {updateUserMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        data-testid="input-edit-name"
                      />
                    ) : (
                      <p className="text-sm font-medium">{user.name || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        data-testid="input-edit-email"
                      />
                    ) : (
                      <p className="text-sm font-medium">{user.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    {isEditing ? (
                      <Select value={editedRole} onValueChange={(value) => setEditedRole(value as "clinician" | "admin")}>
                        <SelectTrigger data-testid="select-edit-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clinician">Clinician</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                        {user.role}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <p className="text-sm font-mono text-muted-foreground">{user.id}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="font-semibold">Account Actions</h3>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResetPasswordDialogOpen(true)}
                      disabled={user.role === "admin"}
                      data-testid="button-reset-password"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Reset Password
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Timeline</CardTitle>
                <CardDescription>Key dates and activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Created</Label>
                    <p className="text-sm font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Last Login</Label>
                    <p className="text-sm font-medium">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "Never"}
                    </p>
                    {user.lastLogin && (
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <p className="text-sm font-medium">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
                <CardDescription>Current subscription and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div>
                      <Badge 
                        variant={user.subscriptionStatus === "active" ? "default" : "outline"}
                        className={user.subscriptionStatus === "active" ? "bg-green-600" : ""}
                      >
                        {user.subscriptionStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subscription End Date</Label>
                    <p className="text-sm font-medium">
                      {user.subscriptionPeriodEnd
                        ? new Date(user.subscriptionPeriodEnd).toLocaleDateString()
                        : "—"}
                    </p>
                    {user.subscriptionPeriodEnd && new Date(user.subscriptionPeriodEnd) > new Date() && (
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.subscriptionPeriodEnd))} remaining
                      </p>
                    )}
                  </div>
                  {user.stripeCustomerId && (
                    <div className="space-y-2">
                      <Label>Stripe Customer ID</Label>
                      <p className="text-sm font-mono text-muted-foreground">{user.stripeCustomerId}</p>
                    </div>
                  )}
                  {user.stripeSubscriptionId && (
                    <div className="space-y-2">
                      <Label>Stripe Subscription ID</Label>
                      <p className="text-sm font-mono text-muted-foreground">{user.stripeSubscriptionId}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Subscription Actions</h3>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExtendDialogOpen(true)}
                      disabled={user.role === "admin"}
                      data-testid="button-extend-subscription"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Extend Subscription
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent user actions and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 text-sm">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="font-medium">Account Created</p>
                      <p className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {user.lastLogin && (
                    <div className="flex items-start gap-4 text-sm">
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Last Login</p>
                        <p className="text-muted-foreground">
                          {new Date(user.lastLogin).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {user.subscriptionPeriodEnd && (
                    <div className="flex items-start gap-4 text-sm">
                      <div className="w-2 h-2 mt-2 rounded-full bg-green-600" />
                      <div className="flex-1">
                        <p className="font-medium">Subscription Active</p>
                        <p className="text-muted-foreground">
                          Until {new Date(user.subscriptionPeriodEnd).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>Payment history and billing details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.stripeCustomerId ? (
                    <>
                      <div className="space-y-2">
                        <Label>Stripe Customer</Label>
                        <p className="text-sm font-mono">{user.stripeCustomerId}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Detailed billing statements will appear here once Stripe integration is fully configured.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No billing information available. User has not connected to Stripe.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Extend Subscription Dialog */}
        <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend Subscription</DialogTitle>
              <DialogDescription>
                Add free months to {user.name || user.email}'s subscription
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="extend-months">Number of Months</Label>
                <Input
                  id="extend-months"
                  type="number"
                  min="1"
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(e.target.value)}
                  placeholder="Enter number of months"
                  data-testid="input-extend-months"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Current end date: {user.subscriptionPeriodEnd
                  ? new Date(user.subscriptionPeriodEnd).toLocaleDateString()
                  : "None"}
              </p>
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
                {extendSubscriptionMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
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
                Set a new password for {user.name || user.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
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
                disabled={!newPassword || resetPasswordMutation.isPending}
                data-testid="button-confirm-reset"
              >
                {resetPasswordMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
