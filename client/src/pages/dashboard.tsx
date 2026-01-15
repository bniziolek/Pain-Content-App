import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, FileText, TrendingUp, Plus, Loader2, ArrowRight, Inbox, Mail, CheckCircle, Eye, ExternalLink, AlertCircle, BookOpen, Download, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTour, shouldShowTour } from "@/components/product-tour";
import { usePatientFeatures } from "@/hooks/use-feature-flags";

function getStatusBadge(status: string) {
  switch(status?.toLowerCase()) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none text-xs"><CheckCircle className="w-3 h-3 mr-1"/> Completed</Badge>;
    case 'sent':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none text-xs"><Mail className="w-3 h-3 mr-1"/> Sent</Badge>;
    case 'opened':
      return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs"><ExternalLink className="w-3 h-3 mr-1"/> Opened</Badge>;
    case 'clicked':
      return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 text-xs"><Eye className="w-3 h-3 mr-1"/> Clicked</Badge>;
    default:
      return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none text-xs"><Mail className="w-3 h-3 mr-1"/> Sent</Badge>;
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const { startTour } = useTour();
  const { patientMessagingEnabled, sendHistoryEnabled, assessmentsEnabled, isLoading: featuresLoading } = usePatientFeatures();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  });

  useEffect(() => {
    if (!isLoading && shouldShowTour()) {
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, startTour]);

  if (isLoading || featuresLoading) {
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" data-tour="dashboard">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back{user?.name ? `, ${user.name}` : ""}.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/library">
              <Button data-tour="send-content">
                {patientMessagingEnabled ? (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Content
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Create Packet
                  </>
                )}
              </Button>
            </Link>
            {assessmentsEnabled && (
              <Link href="/assessments">
                <Button variant="outline">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Assessments
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid - Only show patient engagement stats when messaging is enabled */}
        {patientMessagingEnabled ? (
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
                <CardTitle className="text-sm font-medium">Content Read Rate</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.contentReadRate || "0%"}</div>
                <p className="text-xs text-muted-foreground">Emails opened by patients</p>
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
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Library</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalContent || 0}</div>
                <p className="text-xs text-muted-foreground">Educational modules available</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assessments</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAssessments || 0}</div>
                <p className="text-xs text-muted-foreground">Available for content curation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Focus Area</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate" title={stats?.topTags?.[0] || "N/A"}>{stats?.topTags?.[0] || "N/A"}</div>
                <p className="text-xs text-muted-foreground">Most frequent result</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chart and Activity sections - only when patient messaging is enabled */}
        {patientMessagingEnabled && (
          <>
            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Content sends over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {stats?.chartData && stats.chartData.some(d => d.sends > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData}>
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
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Inbox className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">No activity yet this week</p>
                    <p className="text-xs mt-1">Send content to patients to see your activity here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity & Action Needed */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentActivity.map((item, i) => (
                        <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0 border-border/50">
                          <div className="w-2 h-2 mt-2 rounded-full bg-secondary" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate max-w-[200px]" title={item.email}>{item.email}</div>
                            <div className="text-sm text-muted-foreground">{item.action}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(item.status)}
                              <span className="text-xs text-muted-foreground/60">{item.timeAgo}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Inbox className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                  {sendHistoryEnabled && (
                    <Link href="/history">
                      <Button variant="ghost" className="w-full mt-4 text-xs">
                        View All History <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              {/* Action Needed */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <CardTitle>Action Needed</CardTitle>
                  </div>
                  <CardDescription>Patients who haven't opened content</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.actionNeeded && stats.actionNeeded.length > 0 ? (
                    <div className="space-y-4">
                      {stats.actionNeeded.map((item, i) => (
                        <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0 border-border/50">
                          <div className="w-2 h-2 mt-2 rounded-full bg-amber-500" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate max-w-[200px]" title={item.email}>{item.email}</div>
                            <div className="text-sm text-muted-foreground truncate" title={item.subject}>{item.subject}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">
                                <Mail className="w-3 h-3 mr-1" /> Unopened
                              </Badge>
                              <span className="text-xs text-muted-foreground/60">{item.daysSinceSent}d ago</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle className="w-10 h-10 mb-2 opacity-50 text-green-500" />
                      <p className="text-sm">All caught up!</p>
                      <p className="text-xs mt-1 text-center">No patients need follow-up right now</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Provider-only mode: Quick actions */}
        {!patientMessagingEnabled && (
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Create personalized content packets for your patients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid ${assessmentsEnabled ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4`}>
                <Link href="/library">
                  <div className="p-4 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                    <Download className="w-8 h-8 text-primary mb-2" />
                    <h3 className="font-medium">Browse Content</h3>
                    <p className="text-sm text-muted-foreground">Explore educational modules and create downloadable packets</p>
                  </div>
                </Link>
                {assessmentsEnabled && (
                  <Link href="/assessments">
                    <div className="p-4 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                      <ClipboardList className="w-8 h-8 text-primary mb-2" />
                      <h3 className="font-medium">Take an Assessment</h3>
                      <p className="text-sm text-muted-foreground">Complete an assessment to get personalized content recommendations</p>
                    </div>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
