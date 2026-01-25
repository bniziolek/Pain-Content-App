import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CreditCard, 
  Loader2, 
  ArrowLeft, 
  FileText,
  Gift,
  XCircle,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  getSubscriptionDetails, 
  applyCouponToSubscription, 
  cancelUserSubscription,
  extendUserSubscription
} from "@/api/admin";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-700 border-gray-200", icon: XCircle },
  past_due: { label: "Past Due", className: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertTriangle },
  canceled: { label: "Canceled", className: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

export default function SubscriptionDetailPage() {
  const [, params] = useRoute("/admin/subscriptions/:userId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = params?.userId || "";

  // Dialog states
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Form states
  const [extendDays, setExtendDays] = useState("30");
  const [couponCode, setCouponCode] = useState("");
  const [cancelImmediate, setCancelImmediate] = useState(false);

  const { data: details, isLoading } = useQuery({
    queryKey: ["subscription-details", userId],
    queryFn: () => getSubscriptionDetails(userId),
    enabled: !!userId,
  });

  const extendMutation = useMutation({
    mutationFn: async () => {
      return extendUserSubscription(userId, parseInt(extendDays));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-details", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      setExtendDialogOpen(false);
      setExtendDays("30");
      toast({
        title: "Subscription Extended",
        description: `Subscription extended by ${extendDays} days.`,
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

  const couponMutation = useMutation({
    mutationFn: async () => {
      return applyCouponToSubscription(userId, couponCode);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["subscription-details", userId] });
      setCouponDialogOpen(false);
      setCouponCode("");
      toast({
        title: result.success ? "Coupon Applied" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
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

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return cancelUserSubscription(userId, cancelImmediate);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["subscription-details", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      setCancelDialogOpen(false);
      toast({
        title: result.success ? "Subscription Canceled" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!details) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Button variant="ghost" onClick={() => navigate("/admin/subscriptions")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subscriptions
          </Button>
          <p className="text-center text-muted-foreground mt-8">Subscription not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[details.subscriptionStatus || "inactive"];
  const StatusIcon = statusConfig?.icon || XCircle;

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin/subscriptions")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">{details.name || details.email}</h1>
              <p className="text-muted-foreground">{details.email}</p>
            </div>
          </div>
          <Badge variant="outline" className={statusConfig?.className}>
            <StatusIcon className="w-4 h-4 mr-1" />
            {statusConfig?.label || details.subscriptionStatus}
          </Badge>
        </div>

        {/* Subscription Overview */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Current Plan</Label>
                  <p className="font-medium capitalize">{details.subscriptionTier || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium capitalize">{details.subscriptionStatus || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="font-medium">
                    {details.subscriptionStartDate 
                      ? format(new Date(details.subscriptionStartDate), "MMM d, yyyy")
                      : "—"
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Next Billing Date</Label>
                  <p className="font-medium">
                    {details.subscriptionPeriodEnd 
                      ? format(new Date(details.subscriptionPeriodEnd), "MMM d, yyyy")
                      : "—"
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Stripe Customer ID</Label>
                  <p className="font-mono text-sm">{details.stripeCustomerId || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Stripe Subscription ID</Label>
                  <p className="font-mono text-sm">{details.stripeSubscriptionId || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              {details.paymentMethod ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium capitalize">{details.paymentMethod.brand}</span>
                    <span className="text-muted-foreground">•••• {details.paymentMethod.last4}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Expires {details.paymentMethod.expMonth}/{details.paymentMethod.expYear}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No payment method on file</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
            <CardDescription>Manage this subscription</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => setExtendDialogOpen(true)} data-testid="button-extend-subscription">
              <Clock className="w-4 h-4 mr-2" />
              Extend Trial
            </Button>
            <Button onClick={() => setCouponDialogOpen(true)} variant="outline" data-testid="button-apply-coupon">
              <Gift className="w-4 h-4 mr-2" />
              Apply Coupon
            </Button>
            <Button 
              onClick={() => setCancelDialogOpen(true)} 
              variant="destructive" 
              data-testid="button-cancel-subscription"
              disabled={details.subscriptionStatus === "canceled"}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Subscription
            </Button>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Billing History
            </CardTitle>
            <CardDescription>Last 12 invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {details.billingHistory && details.billingHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.billingHistory.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                      <TableCell>{format(new Date(invoice.date * 1000), "MMM d, yyyy")}</TableCell>
                      <TableCell>${(invoice.amount / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === "paid" ? "default" : "outline"}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.pdfUrl && (
                          <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <Download className="w-3 h-3 mr-1" />
                              PDF
                            </Button>
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No billing history available</p>
            )}
          </CardContent>
        </Card>

        {/* Extend Dialog */}
        <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend Subscription</DialogTitle>
              <DialogDescription>
                Extend the subscription period for this user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="extend-days">Number of Days</Label>
                <Input
                  id="extend-days"
                  type="number"
                  min="1"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  data-testid="input-extend-days"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => extendMutation.mutate()}
                disabled={extendMutation.isPending || !extendDays}
                data-testid="button-confirm-extend"
              >
                {extendMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Extend
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Coupon Dialog */}
        <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply Coupon</DialogTitle>
              <DialogDescription>
                Apply a discount code to this subscription
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">Coupon Code</Label>
                <Input
                  id="coupon-code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="DISCOUNT20"
                  data-testid="input-coupon-code"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCouponDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => couponMutation.mutate()}
                disabled={couponMutation.isPending || !couponCode}
                data-testid="button-confirm-coupon"
              >
                {couponMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Subscription</DialogTitle>
              <DialogDescription>
                This action will cancel the user's subscription. Are you sure?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cancel-immediate"
                  checked={cancelImmediate}
                  onChange={(e) => setCancelImmediate(e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-cancel-immediate"
                />
                <Label htmlFor="cancel-immediate" className="cursor-pointer">
                  Cancel immediately (otherwise, cancel at period end)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                data-testid="button-confirm-cancel"
              >
                {cancelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cancel Subscription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
