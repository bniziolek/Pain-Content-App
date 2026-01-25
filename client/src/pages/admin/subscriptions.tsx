import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CreditCard, 
  Loader2, 
  Filter, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { listSubscriptions, type SubscriptionListItem } from "@/api/admin";
import { formatDistanceToNow, format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-700 border-gray-200", icon: XCircle },
  past_due: { label: "Past Due", className: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertTriangle },
  canceled: { label: "Canceled", className: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  trial: { label: "Trial", className: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
};

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-gray-100 text-gray-700" },
  basic: { label: "Basic", className: "bg-blue-100 text-blue-700" },
  pro: { label: "Pro", className: "bg-purple-100 text-purple-700" },
  enterprise: { label: "Enterprise", className: "bg-amber-100 text-amber-700" },
};

export default function AdminSubscriptionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["admin-subscriptions", statusFilter, tierFilter, searchQuery],
    queryFn: async () => {
      return listSubscriptions({
        status: statusFilter !== "all" ? statusFilter : undefined,
        tier: tierFilter !== "all" ? tierFilter : undefined,
        searchQuery: searchQuery || undefined,
      });
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const activeCount = subscriptions.filter(s => s.subscriptionStatus === "active").length;
    const pastDueCount = subscriptions.filter(s => s.subscriptionStatus === "past_due").length;
    const canceledCount = subscriptions.filter(s => s.subscriptionStatus === "canceled").length;
    
    // Trial users (active with period end within next 14 days)
    const now = new Date();
    const trialCount = subscriptions.filter(s => {
      if (s.subscriptionStatus !== "active" || !s.subscriptionPeriodEnd) return false;
      const periodEnd = new Date(s.subscriptionPeriodEnd);
      const daysUntilEnd = (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilEnd <= 14 && daysUntilEnd > 0;
    }).length;

    return {
      total: subscriptions.length,
      active: activeCount,
      pastDue: pastDueCount,
      canceled: canceledCount,
      trial: trialCount,
    };
  }, [subscriptions]);

  // Helper to check if expiring soon
  const isExpiringSoon = (periodEnd: string | null) => {
    if (!periodEnd) return false;
    const end = new Date(periodEnd);
    const now = new Date();
    const daysUntilEnd = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilEnd <= 7 && daysUntilEnd > 0;
  };

  if (isLoading) {
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
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Subscription Management</h1>
          <p className="text-muted-foreground">View and manage all user subscriptions and billing.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial Ending Soon</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trial}</div>
              <p className="text-xs text-muted-foreground">Next 14 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Past Due</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pastDue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canceled</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.canceled}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Subscriptions</CardTitle>
                <CardDescription>
                  {subscriptions.length} subscription{subscriptions.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-[200px]"
                    data-testid="input-search-subscriptions"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-tier-filter">
                    <Filter className="w-4 h-4 mr-2" />
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Renewal Date</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => {
                  const statusConfig = STATUS_CONFIG[sub.subscriptionStatus || "inactive"];
                  const tierConfig = TIER_CONFIG[sub.subscriptionTier || "basic"];
                  const StatusIcon = statusConfig?.icon || XCircle;
                  const expiringSoon = isExpiringSoon(sub.subscriptionPeriodEnd);

                  return (
                    <TableRow 
                      key={sub.userId}
                      data-testid={`subscription-row-${sub.userId}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/subscriptions/${sub.userId}`)}
                    >
                      <TableCell className="font-medium">{sub.name || "—"}</TableCell>
                      <TableCell>{sub.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig?.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig?.label || sub.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={tierConfig?.className}>
                          {tierConfig?.label || sub.subscriptionTier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.subscriptionPeriodEnd ? (
                          <div className="flex items-center gap-2">
                            <span>{format(new Date(sub.subscriptionPeriodEnd), "MMM d, yyyy")}</span>
                            {expiringSoon && (
                              <AlertTriangle className="w-4 h-4 text-orange-500" title="Expiring soon" />
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {sub.stripeCustomerId ? sub.stripeCustomerId.slice(-8) : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/subscriptions/${sub.userId}`);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {subscriptions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No subscriptions match your filters</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
