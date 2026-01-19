import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, FileText, TrendingUp, Loader2, ArrowRight, Inbox, Mail, CheckCircle, Eye, ExternalLink, AlertCircle, BookOpen, Download, ClipboardList, Package, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTour, shouldShowTour } from "@/components/product-tour";
import { usePatientFeatures } from "@/hooks/use-feature-flags";
import { useFavorites, useFrequentlyUsed } from "@/hooks/use-favorites";

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
  const { favorites } = useFavorites();
  const { data: frequentlyUsed = [] } = useFrequentlyUsed(5);
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
            {patientMessagingEnabled ? (
              <>
                <Link href="/library">
                  <Button data-tour="send-content">
                    <Send className="w-4 h-4 mr-2" />
                    Send Content
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
              </>
            ) : assessmentsEnabled ? (
              <>
                <Link href="/content-packet-guide">
                  <Button data-tour="send-content">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Packet
                  </Button>
                </Link>
                <Link href="/library">
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Content Library
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/library">
                <Button data-tour="send-content">
                  <Download className="w-4 h-4 mr-2" />
                  Browse Library
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Concierge Hero Card - Only in MVP mode with assessments */}
        {!patientMessagingEnabled && assessmentsEnabled && (
          <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-amber-500/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">Content Concierge</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Personalized Content, Curated for You</h2>
                  <p className="text-muted-foreground mb-4">
                    Answer a few clinical questions and our intelligent system matches you to the most relevant educational modules. No more manual searching.
                  </p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</div>
                      <span className="text-sm font-medium">Answer</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</div>
                      <span className="text-sm font-medium">Match</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</div>
                      <span className="text-sm font-medium">Deliver</span>
                    </div>
                  </div>
                  
                  <Link href="/content-packet-guide">
                    <Button size="lg" className="gap-2" data-testid="button-concierge-start">
                      <Sparkles className="w-4 h-4" />
                      Start Content Curation
                    </Button>
                  </Link>
                </div>
                
                <div className="hidden lg:block w-px h-32 bg-border" />
                
                <div className="lg:w-72 space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Evidence-Based Matching</p>
                      <p className="text-xs text-muted-foreground">Content aligned with clinical findings</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Save Hours of Curation</p>
                      <p className="text-xs text-muted-foreground">Skip manual content selection</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Printable Packets</p>
                      <p className="text-xs text-muted-foreground">Ready-to-use patient handouts</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid - Adaptive based on feature flags */}
        {patientMessagingEnabled ? (
          // Full mode: Patient engagement stats
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
        ) : assessmentsEnabled ? (
          // MVP mode with assessments: Packet-focused stats
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Packets Created</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.packetsThisWeek || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 font-medium">{stats?.packetsGrowth || "+0%"}</span> from last week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Packets</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.packetsTotal || 0}</div>
                <p className="text-xs text-muted-foreground">All time created</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Library</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalContent || 0}</div>
                <p className="text-xs text-muted-foreground">Educational modules</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Focus Area</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate" title={stats?.topScreeningTags?.[0] || stats?.topTags?.[0] || "N/A"}>
                  {stats?.topScreeningTags?.[0] || stats?.topTags?.[0] || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Most common result</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Minimal mode: No assessments, just content browsing
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
                <CardTitle className="text-sm font-medium">Total Packets</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.packetsTotal || 0}</div>
                <p className="text-xs text-muted-foreground">Curated content packets</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Popular Topics</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate" title={stats?.topTags?.[0] || "Pain Science"}>
                  {stats?.topTags?.[0] || "Pain Science"}
                </div>
                <p className="text-xs text-muted-foreground">Most used content</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Access - Favorites and Frequently Used */}
        {(favorites.length > 0 || frequentlyUsed.length > 0) && (
          <div className="grid lg:grid-cols-2 gap-6">
            {favorites.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      Favorite Content
                    </CardTitle>
                    <Link href="/library?favorites=true">
                      <Button variant="ghost" size="sm" data-testid="link-view-all-favorites">
                        View All <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {favorites.slice(0, 5).map((fav) => (
                      <Link key={fav.contentId} href={`/library`}>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" data-testid={`favorite-item-${fav.contentId}`}>
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          <span className="text-sm truncate">{fav.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {frequentlyUsed.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Frequently Used
                    </CardTitle>
                    <Link href="/library">
                      <Button variant="ghost" size="sm" data-testid="link-go-to-library">
                        Library <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {frequentlyUsed.slice(0, 5).map((item) => (
                      <Link key={item.contentId} href={`/library`}>
                        <div className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" data-testid={`frequent-item-${item.contentId}`}>
                          <span className="text-sm truncate">{item.title}</span>
                          <Badge variant="secondary" className="text-xs">{item.sendCount} sends</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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

        {/* Provider-only mode: Recent Packets and Quick Actions */}
        {!patientMessagingEnabled && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Packets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Recent Packets
                </CardTitle>
                <CardDescription>Your recently created content packets</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentPackets && stats.recentPackets.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentPackets.map((packet) => (
                      <div key={packet.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0 border-border/50">
                        <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{packet.patientName}</div>
                          <div className="text-sm text-muted-foreground">{packet.assessmentName}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {packet.outcome && (
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                {packet.outcome}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {packet.contentCount} items
                            </span>
                            <span className="text-xs text-muted-foreground/60">{packet.timeAgo}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Package className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm">No packets created yet</p>
                    <p className="text-xs mt-1">Use the guide to create your first packet</p>
                  </div>
                )}
                <Link href="/history">
                  <Button variant="ghost" className="w-full mt-4 text-xs">
                    View All Packets <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Actions / Getting Started */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Create personalized content for your patients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assessmentsEnabled && (
                    <Link href="/content-packet-guide">
                      <div className="p-4 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-8 h-8 text-primary" />
                          <div>
                            <h3 className="font-medium">Guide Me to Content</h3>
                            <p className="text-sm text-muted-foreground">Use an assessment to get personalized recommendations</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
                  <Link href="/library">
                    <div className="p-4 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Download className="w-8 h-8 text-primary" />
                        <div>
                          <h3 className="font-medium">Browse Content Library</h3>
                          <p className="text-sm text-muted-foreground">Explore educational modules and create packets manually</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  {assessmentsEnabled && (
                    <Link href="/assessments">
                      <div className="p-4 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <ClipboardList className="w-8 h-8 text-primary" />
                          <div>
                            <h3 className="font-medium">View Assessments</h3>
                            <p className="text-sm text-muted-foreground">See all available clinician assessments</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
