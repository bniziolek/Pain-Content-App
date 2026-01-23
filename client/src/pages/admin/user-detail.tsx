import { useState } from "react";
import { useRoute, Link } from "wouter";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit2, Save, X, Key, Clock, Trash2, Loader2, Calendar, Download, Plus, MessageSquare, FileText, LogIn, CheckCircle, XCircle, Crown, Sparkles, Activity, AlertTriangle, CreditCard, UserCheck, Unlock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { PublicUser as User, AdminNote, LoginHistory } from "@shared/api-types";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ContentActivity {
  contentId: string;
  contentTitle: string;
  patientEmail: string;
  sentAt: string;
  status: string;
}

interface TimelineEvent {
  id: string;
  type: 'login' | 'login_failed' | 'content_sent' | 'assessment' | 'subscription' | 'admin_action' | 'error' | 'other';
  action: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'success';
}

const TIMELINE_ICON_MAP: Record<TimelineEvent['type'], typeof Activity> = {
  login: LogIn,
  login_failed: AlertTriangle,
  content_sent: FileText,
  assessment: CheckCircle,
  subscription: CreditCard,
  admin_action: UserCheck,
  error: AlertTriangle,
  other: Activity,
};

const SEVERITY_COLORS: Record<TimelineEvent['severity'], string> = {
  info: 'text-blue-600 bg-blue-50',
  warning: 'text-amber-600 bg-amber-50',
  error: 'text-red-600 bg-red-50',
  success: 'text-green-600 bg-green-50',
};

interface UserFeatureFlag {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  defaultEnabled: boolean;
  hasOverride: boolean;
  description: string | null;
  category: string | null;
}

export default function UserDetailPage() {
  const [, params] = useRoute("/admin/users/:id");
  const userId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedRole, setEditedRole] = useState<"clinician" | "admin">("clinician");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedClinicName, setEditedClinicName] = useState("");
  const [editedCredentials, setEditedCredentials] = useState("");
  const [editedAddress, setEditedAddress] = useState("");
  const [isDemographicsEditing, setIsDemographicsEditing] = useState(false);

  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendMonths, setExtendMonths] = useState("");
  
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [newNote, setNewNote] = useState("");
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);

  const [changeTierDialogOpen, setChangeTierDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("");

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      const userData = await res.json() as User;
      setEditedName(userData.name || "");
      setEditedEmail(userData.email);
      setEditedRole(userData.role as "clinician" | "admin");
      setEditedPhone(userData.phone || "");
      setEditedClinicName(userData.clinicName || "");
      setEditedCredentials(userData.credentials || "");
      setEditedAddress(userData.address || "");
      return userData;
    },
    enabled: !!userId,
  });

  const { data: adminNotes = [] } = useQuery<AdminNote[]>({
    queryKey: ["admin-user-notes", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/notes`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: loginHistory = [] } = useQuery<LoginHistory[]>({
    queryKey: ["admin-user-login-history", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/login-history`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch login history");
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: contentActivity = [] } = useQuery<ContentActivity[]>({
    queryKey: ["admin-user-content-activity", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/content-activity`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch content activity");
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: timeline = [], isLoading: timelineLoading } = useQuery<TimelineEvent[]>({
    queryKey: ["admin-user-timeline", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/support-timeline`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch timeline");
      const data = await res.json();
      return data.events || [];
    },
    enabled: !!userId,
  });

  const { data: userFeatureFlags = [], isLoading: flagsLoading } = useQuery<UserFeatureFlag[]>({
    queryKey: ["admin-user-feature-flags", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/feature-flags`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch feature flags");
      return res.json();
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
          phone: editedPhone,
          clinicName: editedClinicName,
          credentials: editedCredentials,
          address: editedAddress,
        }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsEditing(false);
      setIsDemographicsEditing(false);
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

  const changeTierMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tier: selectedTier }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to change tier");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setChangeTierDialogOpen(false);
      setSelectedTier("");
      toast({
        title: "Tier Changed",
        description: `User tier updated to ${selectedTier}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Tier Change Failed",
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

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note: newNote }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-notes", userId] });
      setAddNoteDialogOpen(false);
      setNewNote("");
      toast({
        title: "Note Added",
        description: "Admin note has been added to this user.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/admin/notes/${noteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-notes", userId] });
      toast({
        title: "Note Deleted",
        description: "Admin note has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleFeatureFlagMutation = useMutation({
    mutationFn: async ({ flagId, enabled }: { flagId: string; enabled: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}/feature-flags/${flagId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to toggle feature flag");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-feature-flags", userId] });
      toast({
        title: "Feature Flag Updated",
        description: "User's feature flag has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Flag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetFeatureFlagMutation = useMutation({
    mutationFn: async (flagId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/feature-flags/${flagId}/override`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reset feature flag");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-feature-flags", userId] });
      toast({
        title: "Flag Reset",
        description: "Feature flag has been reset to default.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Reset Flag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/export`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to export user data");
      
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-export-${userId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "User data has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export user data.",
        variant: "destructive",
      });
    }
  };

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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Badge variant={user.role === "admin" ? "destructive" : "secondary"} className="text-sm">
                {user.role}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="subscription" data-testid="tab-subscription">Subscription</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
            <TabsTrigger value="notes" data-testid="tab-notes">Notes</TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">Billing</TabsTrigger>
            <TabsTrigger value="flags" data-testid="tab-flags">Feature Flags</TabsTrigger>
          </TabsList>

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
                        setEditedRole(user.role as "clinician" | "admin");
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Clinician Demographics</CardTitle>
                  <CardDescription>Professional and contact information for identity verification</CardDescription>
                </div>
                {!isDemographicsEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDemographicsEditing(true)}
                    data-testid="button-edit-demographics"
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
                        setIsDemographicsEditing(false);
                        setEditedPhone(user.phone || "");
                        setEditedClinicName(user.clinicName || "");
                        setEditedCredentials(user.credentials || "");
                        setEditedAddress(user.address || "");
                      }}
                      data-testid="button-cancel-demographics"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateUserMutation.mutate()}
                      disabled={updateUserMutation.isPending}
                      data-testid="button-save-demographics"
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
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Clinic Name</Label>
                    {isDemographicsEditing ? (
                      <Input
                        value={editedClinicName}
                        onChange={(e) => setEditedClinicName(e.target.value)}
                        placeholder="Enter clinic name"
                        data-testid="input-clinic-name"
                      />
                    ) : (
                      <p className="text-sm font-medium" data-testid="text-clinic-name">{user.clinicName || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Credentials</Label>
                    {isDemographicsEditing ? (
                      <Input
                        value={editedCredentials}
                        onChange={(e) => setEditedCredentials(e.target.value)}
                        placeholder="e.g., DPT, PT, OT"
                        data-testid="input-credentials"
                      />
                    ) : (
                      <p className="text-sm font-medium" data-testid="text-credentials">{user.credentials || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Phone</Label>
                    {isDemographicsEditing ? (
                      <Input
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        placeholder="Enter phone number"
                        data-testid="input-phone"
                      />
                    ) : (
                      <p className="text-sm font-medium" data-testid="text-phone">{user.phone || "—"}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Address</Label>
                    {isDemographicsEditing ? (
                      <Input
                        value={editedAddress}
                        onChange={(e) => setEditedAddress(e.target.value)}
                        placeholder="Enter address"
                        data-testid="input-address"
                      />
                    ) : (
                      <p className="text-sm font-medium" data-testid="text-address">{user.address || "—"}</p>
                    )}
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
                    <Label>Tier</Label>
                    <div>
                      {(() => {
                        const tier = user.subscriptionTier || "basic";
                        const tierConfig: Record<string, { className: string; icon?: typeof Crown }> = {
                          free: { className: "bg-gray-100 text-gray-600" },
                          basic: { className: "bg-blue-100 text-blue-600", icon: Sparkles },
                          pro: { className: "bg-amber-100 text-amber-600", icon: Crown },
                          enterprise: { className: "bg-purple-100 text-purple-600", icon: Crown },
                        };
                        const config = tierConfig[tier] || tierConfig.basic;
                        const Icon = config.icon;
                        return (
                          <Badge variant="outline" className={config.className}>
                            {Icon && <Icon className="w-3 h-3 mr-1" />}
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </Badge>
                        );
                      })()}
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
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Subscription Actions</h3>
                  <div className="flex flex-wrap gap-3">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTier(user.subscriptionTier || "basic");
                        setChangeTierDialogOpen(true);
                      }}
                      disabled={user.role === "admin"}
                      data-testid="button-change-tier"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Change Tier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Unified Timeline
                </CardTitle>
                <CardDescription>Complete activity history from the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {timelineLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : timeline.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      {timeline.slice(0, 50).map((event) => {
                        const Icon = TIMELINE_ICON_MAP[event.type] || Activity;
                        const colorClass = SEVERITY_COLORS[event.severity];
                        return (
                          <div key={event.id} className="relative pl-10" data-testid={`timeline-event-${event.id}`}>
                            <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${colorClass}`}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <div className="bg-card border rounded-lg p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-sm">{event.description}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                                  </p>
                                </div>
                                <Badge variant="outline" className={`text-xs ${colorClass}`}>
                                  {event.action.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              {event.metadata && 'ipAddress' in event.metadata && event.metadata.ipAddress ? (
                                <div className="mt-2 text-xs text-muted-foreground font-mono">
                                  IP: {String(event.metadata.ipAddress)}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {timeline.length > 50 && (
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        Showing 50 of {timeline.length} events
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No activity recorded in the last 30 days</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Login History
                </CardTitle>
                <CardDescription>Recent login attempts for this user</CardDescription>
              </CardHeader>
              <CardContent>
                {loginHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>User Agent</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginHistory.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {entry.outcome === "success" ? (
                              <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Success</Badge>
                            ) : (
                              <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{entry.ipAddress || "—"}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{entry.userAgent || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No login history available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Activity
                </CardTitle>
                <CardDescription>Content sent to patients by this user</CardDescription>
              </CardHeader>
              <CardContent>
                {contentActivity.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Content</TableHead>
                        <TableHead>Patient Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentActivity.slice(0, 20).map((activity, idx) => (
                        <TableRow key={`${activity.contentId}-${idx}`}>
                          <TableCell className="font-medium">{activity.contentTitle}</TableCell>
                          <TableCell>{activity.patientEmail}</TableCell>
                          <TableCell>
                            <Badge variant={activity.status === "clicked" ? "default" : "outline"}>
                              {activity.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.sentAt), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No content activity found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Admin Notes
                  </CardTitle>
                  <CardDescription>Internal notes about this user</CardDescription>
                </div>
                <Button size="sm" onClick={() => setAddNoteDialogOpen(true)} data-testid="button-add-note">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </CardHeader>
              <CardContent>
                {adminNotes.length > 0 ? (
                  <div className="space-y-4">
                    {adminNotes.map((note) => (
                      <div key={note.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Delete this note?")) {
                                deleteNoteMutation.mutate(note.id);
                              }
                            }}
                            data-testid={`button-delete-note-${note.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No notes added yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                      {user.stripeSubscriptionId && (
                        <div className="space-y-2">
                          <Label>Stripe Subscription</Label>
                          <p className="text-sm font-mono">{user.stripeSubscriptionId}</p>
                        </div>
                      )}
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

          <TabsContent value="flags" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription>Feature flags enabled for this user based on their subscription tier</CardDescription>
              </CardHeader>
              <CardContent>
                {flagsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : userFeatureFlags.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(
                      userFeatureFlags.reduce((acc, flag) => {
                        const category = flag.category || 'Uncategorized';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(flag);
                        return acc;
                      }, {} as Record<string, UserFeatureFlag[]>)
                    ).map(([category, flags]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
                        <div className="grid gap-2">
                          {flags.map((flag) => (
                            <div
                              key={flag.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${flag.hasOverride ? 'border-amber-300 bg-amber-50' : flag.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                              data-testid={`flag-${flag.key}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{flag.name}</p>
                                  {flag.hasOverride && (
                                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                                      Override
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{flag.key}</p>
                                {flag.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{flag.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {flag.hasOverride && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => resetFeatureFlagMutation.mutate(flag.id)}
                                    disabled={resetFeatureFlagMutation.isPending}
                                    data-testid={`button-reset-flag-${flag.key}`}
                                  >
                                    Reset
                                  </Button>
                                )}
                                <Switch
                                  checked={flag.enabled}
                                  onCheckedChange={(checked) => toggleFeatureFlagMutation.mutate({ flagId: flag.id, enabled: checked })}
                                  disabled={toggleFeatureFlagMutation.isPending}
                                  data-testid={`switch-flag-${flag.key}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No feature flags configured for this user</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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

        <Dialog open={addNoteDialogOpen} onOpenChange={setAddNoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Admin Note</DialogTitle>
              <DialogDescription>
                Add an internal note about {user.name || user.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-note">Note</Label>
                <Textarea
                  id="new-note"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note..."
                  rows={4}
                  data-testid="input-new-note"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddNoteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => addNoteMutation.mutate()}
                disabled={!newNote.trim() || addNoteMutation.isPending}
                data-testid="button-confirm-add-note"
              >
                {addNoteMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Add Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={changeTierDialogOpen} onOpenChange={setChangeTierDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Subscription Tier</DialogTitle>
              <DialogDescription>
                Update the subscription tier for {user.name || user.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tier-select">Select Tier</Label>
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger id="tier-select" data-testid="select-tier">
                    <SelectValue placeholder="Select a tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Basic
                      </div>
                    </SelectItem>
                    <SelectItem value="pro">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-600" />
                        Pro
                      </div>
                    </SelectItem>
                    <SelectItem value="enterprise">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-purple-600" />
                        Enterprise
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Current tier: <span className="font-medium capitalize">{user.subscriptionTier || "basic"}</span>
              </p>
              <p className="text-xs text-amber-600">
                Note: Changing a tier manually will override any Stripe subscription tier. The user's billing will not be affected.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChangeTierDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => changeTierMutation.mutate()}
                disabled={!selectedTier || selectedTier === (user.subscriptionTier || "basic") || changeTierMutation.isPending}
                data-testid="button-confirm-tier-change"
              >
                {changeTierMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Change Tier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
