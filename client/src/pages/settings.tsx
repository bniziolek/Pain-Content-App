import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, CheckCircle, AlertTriangle, Mail, ExternalLink, Loader2, HelpCircle, Play, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useTour, resetTour } from "@/components/product-tour";
import { useLocation } from "wouter";
import type { EmailSettings } from "@shared/api-types";

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  clinicName: string;
  credentials: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { startTour } = useTour();
  const [, navigate] = useLocation();
  const isSubscriptionActive = user?.subscriptionStatus === 'active';

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    clinicName: '',
    credentials: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        clinicName: user.clinicName || '',
        credentials: user.credentials || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
      });
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<ProfileFormData>) => {
      const res = await apiRequest("PATCH", "/api/user/profile", updates);
      return res.json();
    },
    onSuccess: () => {
      refreshUser();
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update profile",
        variant: "destructive" 
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(profileForm);
  };

  const handleReplayTour = () => {
    resetTour();
    navigate("/dashboard");
    setTimeout(() => {
      startTour();
    }, 300);
  };

  const { data: emailSettings, isLoading: emailLoading } = useQuery<EmailSettings>({
    queryKey: ["/api/email-settings"],
  });

  const updateEmailMode = useMutation({
    mutationFn: async (mode: 'central' | 'personal') => {
      const res = await apiRequest("PATCH", "/api/email-settings/mode", { mode });
      return res.json();
    },
    onSuccess: () => {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/email-settings"] });
      toast({ title: "Email settings updated" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update email settings",
        variant: "destructive" 
      });
    },
  });

  const disconnectEmail = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/email-settings/connection");
      return res.json();
    },
    onSuccess: () => {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/email-settings"] });
      toast({ title: "Gmail disconnected" });
    },
  });

  const currentMode = emailSettings?.emailDeliveryMode || 'central';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="email" data-testid="tab-email">Email Delivery</TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">Subscription & Billing</TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
            <TabsTrigger value="help" data-testid="tab-help">Help & Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <form onSubmit={handleProfileSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal and practice details. This information may appear on content packets sent to patients.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                          data-testid="input-name" 
                          autoComplete="name"
                          placeholder="Dr. Jane Smith"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="credentials">Credentials</Label>
                        <Input 
                          id="credentials"
                          value={profileForm.credentials}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, credentials: e.target.value }))}
                          data-testid="input-credentials" 
                          placeholder="DPT, OCS"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                          data-testid="input-email"
                          autoComplete="email"
                          placeholder="jane.smith@example.com"
                        />
                        <p className="text-xs text-muted-foreground">This is used for login. Changing it will update your login credentials.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone"
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                          data-testid="input-phone"
                          autoComplete="tel"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Practice Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="clinicName">Clinic / Practice Name</Label>
                      <Input 
                        id="clinicName"
                        value={profileForm.clinicName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, clinicName: e.target.value }))}
                        data-testid="input-clinic-name"
                        autoComplete="organization"
                        placeholder="Summit Physical Therapy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input 
                        id="address"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                        data-testid="input-address"
                        autoComplete="street-address"
                        placeholder="123 Main Street, Suite 100"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="city">City</Label>
                        <Input 
                          id="city"
                          value={profileForm.city}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                          data-testid="input-city"
                          autoComplete="address-level2"
                          placeholder="Denver"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input 
                          id="state"
                          value={profileForm.state}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, state: e.target.value }))}
                          data-testid="input-state"
                          autoComplete="address-level1"
                          placeholder="CO"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input 
                          id="zipCode"
                          value={profileForm.zipCode}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, zipCode: e.target.value }))}
                          data-testid="input-zip-code"
                          autoComplete="postal-code"
                          placeholder="80202"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={updateProfile.isPending} data-testid="button-save-profile">
                    {updateProfile.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          <TabsContent value="email">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Delivery Method</CardTitle>
                  <CardDescription>Choose how emails are sent to your patients</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {emailLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <button
                        type="button"
                        onClick={() => updateEmailMode.mutate('central')}
                        disabled={updateEmailMode.isPending}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          currentMode === 'central' 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'border-muted hover:border-muted-foreground/30'
                        }`}
                        data-testid="button-mode-central"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                            currentMode === 'central' ? 'border-primary' : 'border-muted-foreground/40'
                          }`}>
                            {currentMode === 'central' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <div className="font-medium">DriverPath sends on your behalf</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Emails are sent from DriverPath's secure email service. Your name is included so patients know who sent them.
                            </div>
                            {currentMode === 'central' && (
                              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Currently active</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (emailSettings?.connection?.status === 'active') {
                            updateEmailMode.mutate('personal');
                          } else {
                            toast({
                              title: "Gmail not connected",
                              description: "Connect your Gmail account first to use personal email delivery.",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={updateEmailMode.isPending}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          currentMode === 'personal' 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'border-muted hover:border-muted-foreground/30'
                        }`}
                        data-testid="button-mode-personal"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                            currentMode === 'personal' ? 'border-primary' : 'border-muted-foreground/40'
                          }`}>
                            {currentMode === 'personal' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <div className="font-medium">Send from my own Gmail</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Emails are sent directly from your Gmail account.
                            </div>
                            {currentMode === 'personal' && emailSettings?.connection && (
                              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Sending from {emailSettings.connection.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gmail Connection</CardTitle>
                  <CardDescription>Connect your Gmail to send emails from your own account</CardDescription>
                </CardHeader>
                <CardContent>
                  {emailSettings?.connection ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-2 rounded">
                          <Mail className="w-6 h-6 text-gray-700" />
                        </div>
                        <div>
                          <div className="font-medium">{emailSettings.connection.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {emailSettings.connection.status === 'active' ? (
                              <span className="text-green-600">Connected</span>
                            ) : (
                              <span className="text-amber-600">
                                {emailSettings.connection.status === 'error' ? 'Error - Reconnection needed' : 'Inactive'}
                              </span>
                            )}
                          </div>
                          {emailSettings.connection.lastError && (
                            <div className="text-xs text-red-500 mt-1">{emailSettings.connection.lastError}</div>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => disconnectEmail.mutate()}
                        disabled={disconnectEmail.isPending}
                        data-testid="button-disconnect-gmail"
                      >
                        {disconnectEmail.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No Gmail account connected</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Gmail connection will be available soon. For now, emails are sent from DriverPath on your behalf.
                      </p>
                      <Button disabled variant="outline" data-testid="button-connect-gmail">
                        <Mail className="w-4 h-4 mr-2" />
                        Connect Gmail (Coming Soon)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <div className="grid gap-6">
              <Card className={isSubscriptionActive ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle>Subscription Status</CardTitle>
                    <CardDescription>Your current plan information</CardDescription>
                  </div>
                  {isSubscriptionActive ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none px-3 py-1">
                      <CheckCircle className="w-3 h-3 mr-2" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="px-3 py-1">
                      <AlertTriangle className="w-3 h-3 mr-2" /> {user?.subscriptionStatus || 'Inactive'}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">
                    {user?.subscriptionTier === 'pro' ? 'Professional Plan' : 
                     user?.subscriptionTier === 'enterprise' ? 'Enterprise Plan' : 'Basic Plan'}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {isSubscriptionActive 
                      ? `Next billing date: ${user?.subscriptionPeriodEnd ? new Date(user.subscriptionPeriodEnd).toLocaleDateString() : 'N/A'}` 
                      : "Your subscription has lapsed. Please update your payment method to restore access."}
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  {!isSubscriptionActive && <Button variant="destructive" data-testid="button-pay-now">Pay Now</Button>}
                  {isSubscriptionActive && user?.subscriptionTier === 'basic' && (
                    <Button 
                      onClick={() => navigate('/subscription?upgrade=true')} 
                      className="bg-amber-500 hover:bg-amber-600"
                      data-testid="button-upgrade-to-pro"
                    >
                      Upgrade to Pro
                    </Button>
                  )}
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Manage your billing details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-100 p-2 rounded">
                        <CreditCard className="w-6 h-6 text-gray-700" />
                      </div>
                      <div>
                        <div className="font-medium">Visa ending in 4242</div>
                        <div className="text-sm text-muted-foreground">Expires 12/28</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" data-testid="button-update-payment">Update</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { date: "May 18, 2024", amount: "$29.00", status: "Paid" },
                      { date: "Apr 18, 2024", amount: "$29.00", status: "Paid" },
                      { date: "Mar 18, 2024", amount: "$29.00", status: "Paid" },
                    ].map((invoice, i) => (
                      <div key={i} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                        <div>
                          <div className="font-medium">Invoice #{1000 + i}</div>
                          <div className="text-sm text-muted-foreground">{invoice.date}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">{invoice.amount}</span>
                          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                            {invoice.status}
                          </Badge>
                          <Button variant="ghost" size="sm" data-testid={`button-invoice-pdf-${i}`}>PDF</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Notification settings coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <CardTitle>Quick Start Guide</CardTitle>
                  </div>
                  <CardDescription>
                    Take an interactive tour of DriverPath to learn how to use the platform effectively.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-6 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 text-center">
                    <Play className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">Interactive Walkthrough</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get a guided tour of the dashboard, content library, assessments, and more. 
                      Perfect for getting started or as a refresher.
                    </p>
                    <Button onClick={handleReplayTour} data-testid="button-replay-tour">
                      <Play className="w-4 h-4 mr-2" />
                      Show me how this works
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Features</CardTitle>
                  <CardDescription>Quick overview of what you can do with DriverPath</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">Send Educational Content</div>
                        <div className="text-sm text-muted-foreground">
                          Browse the content library and send evidence-based materials to patients via email.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">Create Assessments</div>
                        <div className="text-sm text-muted-foreground">
                          Build custom questionnaires to understand patient needs and track progress.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <ExternalLink className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">Track Engagement</div>
                        <div className="text-sm text-muted-foreground">
                          See who opened content, completed assessments, and who needs follow-up.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
