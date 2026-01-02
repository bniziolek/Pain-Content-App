import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const isSubscriptionActive = true; // Toggle this to simulate lapsed state

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>

        <Tabs defaultValue="billing" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="billing">Subscription & Billing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input defaultValue="Sarah" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input defaultValue="Mitchell" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="sarah.mitchell@clinic.com" disabled />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <div className="grid gap-6">
              {/* Status Card */}
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
                      <AlertTriangle className="w-3 h-3 mr-2" /> Past Due
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">Professional Plan</div>
                  <p className="text-muted-foreground text-sm">
                    {isSubscriptionActive 
                      ? "Next billing date: June 18, 2024" 
                      : "Your subscription has lapsed. Please update your payment method to restore access."}
                  </p>
                </CardContent>
                <CardFooter>
                  {!isSubscriptionActive && <Button variant="destructive">Pay Now</Button>}
                </CardFooter>
              </Card>

              {/* Payment Method */}
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
                    <Button variant="ghost" size="sm">Update</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Invoices */}
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
                          <Button variant="ghost" size="sm">PDF</Button>
                        </div>
                      </div>
                    ))}
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
