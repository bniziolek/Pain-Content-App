import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Mail, Server, TrendingUp, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface HealthOverview {
  system: {
    uptime: number;
    nodeVersion: string;
    environment: string;
  };
  database: {
    status: "healthy" | "degraded" | "error";
    connectionCount?: number;
    maxConnections?: number;
    activeConnections?: number;
    idleConnections?: number;
    responseTime?: number;
    error?: string;
  };
  api: {
    recentRequests: number;
    averageResponseTime?: number;
    p95ResponseTime?: number;
    p99ResponseTime?: number;
    errorRate?: number;
    errorCount?: number;
    successCount?: number;
  };
  email: {
    totalSent: number;
    delivered: number;
    bounced: number;
    deliveryRate: number;
    bounceRate: number;
  };
  externalServices: {
    stripe: { status: "healthy" | "unknown"; lastChecked?: string };
    contentful: { status: "healthy" | "unknown"; lastChecked?: string };
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

function StatusBadge({ status }: { status: "healthy" | "degraded" | "error" | "unknown" }) {
  const variants = {
    healthy: { icon: CheckCircle2, className: "bg-green-100 text-green-800 border-green-200", label: "Healthy" },
    degraded: { icon: AlertCircle, className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Degraded" },
    error: { icon: XCircle, className: "bg-red-100 text-red-800 border-red-200", label: "Error" },
    unknown: { icon: AlertCircle, className: "bg-gray-100 text-gray-800 border-gray-200", label: "Unknown" },
  };
  
  const variant = variants[status];
  const Icon = variant.icon;
  
  return (
    <Badge className={`${variant.className} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
}

export default function HealthDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const isAdmin = !!user && user.role === "admin";

  const { data: health, isLoading } = useQuery<HealthOverview>({
    queryKey: ["admin-health-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/health/overview", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch health overview");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !loading && isAdmin,
  });

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Loading health metrics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!health) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Failed to load health data</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">System Health Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor platform health and performance metrics
          </p>
        </div>

        {/* System Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUptime(health.system.uptime)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {health.system.environment} • {health.system.nodeVersion}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={health.database.status} />
              </div>
              {health.database.responseTime && (
                <p className="text-xs text-muted-foreground">
                  Response time: {health.database.responseTime}ms
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Requests</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.api.recentRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last hour
                {health.api.errorRate != null && ` • ${health.api.errorRate.toFixed(2)}% error rate`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Delivery</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.email.deliveryRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {health.email.totalSent} sent • {health.email.delivered} delivered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Database Details */}
        <Card>
          <CardHeader>
            <CardTitle>Database Health</CardTitle>
            <CardDescription>Connection pool and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {health.database.status === "error" ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <p className="font-medium text-red-900">Database Error</p>
                </div>
                <p className="text-sm text-red-700">{health.database.error}</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Connection Pool</p>
                  <p className="text-2xl font-bold">
                    {health.database.connectionCount} / {health.database.maxConnections}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active: {health.database.activeConnections} • Idle: {health.database.idleConnections}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Response Time</p>
                  <p className="text-2xl font-bold">{health.database.responseTime}ms</p>
                  <p className="text-xs text-muted-foreground">Health check query</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={health.database.status} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Performance */}
        <Card>
          <CardHeader>
            <CardTitle>API Performance</CardTitle>
            <CardDescription>Request metrics from the last hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{health.api.recentRequests.toLocaleString()}</p>
                <p className="text-xs text-green-600">
                  ✓ {health.api.successCount?.toLocaleString() || 0} successful
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Avg Response (p50)</p>
                <p className="text-2xl font-bold">{health.api.averageResponseTime || 0}ms</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">95th Percentile</p>
                <p className="text-2xl font-bold">{health.api.p95ResponseTime || 0}ms</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">99th Percentile</p>
                <p className="text-2xl font-bold">{health.api.p99ResponseTime || 0}ms</p>
              </div>
            </div>

            {health.api.errorCount && health.api.errorCount > 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <p className="font-medium text-yellow-900">
                    {health.api.errorCount} errors ({health.api.errorRate?.toFixed(2)}% error rate)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Email Delivery Health</CardTitle>
            <CardDescription>Email performance over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{health.email.totalSent.toLocaleString()}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{health.email.delivered.toLocaleString()}</p>
                <p className="text-xs text-green-600">
                  {health.email.deliveryRate.toFixed(1)}% delivery rate
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Bounced</p>
                <p className="text-2xl font-bold">{health.email.bounced.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {health.email.bounceRate.toFixed(1)}% bounce rate
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Health Status</p>
                {health.email.deliveryRate >= 95 ? (
                  <StatusBadge status="healthy" />
                ) : health.email.deliveryRate >= 85 ? (
                  <StatusBadge status="degraded" />
                ) : (
                  <StatusBadge status="error" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* External Services */}
        <Card>
          <CardHeader>
            <CardTitle>External Services</CardTitle>
            <CardDescription>Status of third-party integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Stripe</p>
                    <p className="text-sm text-muted-foreground">Payment processing</p>
                  </div>
                </div>
                <StatusBadge status={health.externalServices.stripe.status} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Contentful</p>
                    <p className="text-sm text-muted-foreground">Content management</p>
                  </div>
                </div>
                <StatusBadge status={health.externalServices.contentful.status} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
