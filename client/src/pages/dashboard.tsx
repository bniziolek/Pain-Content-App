import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, Users, FileText, TrendingUp, Plus, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const chartData = [
  { name: 'Mon', sends: 4 },
  { name: 'Tue', sends: 7 },
  { name: 'Wed', sends: 5 },
  { name: 'Thu', sends: 12 },
  { name: 'Fri', sends: 8 },
  { name: 'Sat', sends: 2 },
  { name: 'Sun', sends: 1 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back{user?.name ? `, ${user.name}` : ""}.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/library">
              <Button>
                <Send className="w-4 h-4 mr-2" />
                Send Content
              </Button>
            </Link>
            <Link href="/assessments">
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Assessment
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Sends</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.sendsThisWeek || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 font-medium">{stats?.sendsGrowth || "+0%"}</span> from last week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeAssessments || 0}</div>
              <p className="text-xs text-muted-foreground">Currently monitoring</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completionRate || "0%"}</div>
              <p className="text-xs text-muted-foreground">Avg. assessment finish</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Focus Area</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate" title={stats?.topTags?.[0] || "N/A"}>{stats?.topTags?.[0] || "N/A"}</div>
              <p className="text-xs text-muted-foreground">Most frequent result</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Recent */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>Content sends over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`} 
                  />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted)/0.2)'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar 
                    dataKey="sends" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions / Recent */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { user: "James Wilson", action: "Completed assessment", time: "2h ago" },
                  { user: "Elena Rodriguez", action: "Opened content module", time: "4h ago" },
                  { user: "Michael Chang", action: "Invite sent", time: "5h ago" },
                  { user: "Sarah Connor", action: "Completed assessment", time: "1d ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0 border-border/50">
                    <div className="w-2 h-2 mt-2 rounded-full bg-secondary" />
                    <div>
                      <div className="font-medium text-sm">{item.user}</div>
                      <div className="text-sm text-muted-foreground">{item.action}</div>
                      <div className="text-xs text-muted-foreground/60 mt-1">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-xs">
                View All History <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
