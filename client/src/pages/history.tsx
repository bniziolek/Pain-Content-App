import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Mail, FileText, CheckCircle, ExternalLink, Inbox, Loader2, ChevronDown, ChevronRight, Clock, Eye, ClipboardList, ShieldX, RefreshCw, AlertTriangle, Repeat, Package, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmailLogs, getContent, getContentViewsByEmailLog, resendEmailContent, getInternalScreenings } from "@/lib/api";
import { useState, useMemo, Fragment } from "react";
import { Link } from "wouter";
import type { ContentView, InternalScreening } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useContentDeliveryMode } from "@/hooks/use-feature-flags";

function formatTimeSpent(seconds: number | null | undefined): string {
  if (!seconds || seconds === 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

function ContentViewsRow({ emailLogId, contentMap }: { emailLogId: string; contentMap: Record<string, string> }) {
  const { data: views, isLoading } = useQuery({
    queryKey: ["content-views", emailLogId],
    queryFn: () => getContentViewsByEmailLog(emailLogId),
  });

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="bg-muted/30">
          <div className="flex items-center gap-2 pl-8 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading content views...</span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (!views || views.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="bg-muted/30">
          <div className="pl-8 py-2 text-sm text-muted-foreground">
            No content tracking data available
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      <TableRow className="bg-muted/50 border-b-0">
        <TableCell colSpan={2} className="pl-10 py-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Content</span>
        </TableCell>
        <TableCell className="py-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Accessed</span>
        </TableCell>
        <TableCell className="py-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time Spent</span>
        </TableCell>
        <TableCell className="py-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</span>
        </TableCell>
        <TableCell className="py-2"></TableCell>
      </TableRow>
      {views.map((view: ContentView) => (
        <TableRow key={view.id} className="bg-muted/30">
          <TableCell colSpan={2} className="pl-10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {contentMap[view.contentId] || view.contentId}
              </span>
            </div>
          </TableCell>
          <TableCell>
            {view.viewedAt ? (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Eye className="w-3 h-3" />
                <span>{format(new Date(view.viewedAt), "MMM d, h:mm a")}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className={view.timeSpentSeconds ? "text-primary font-medium" : "text-muted-foreground"}>
                {formatTimeSpent(view.timeSpentSeconds)}
              </span>
            </div>
          </TableCell>
          <TableCell>
            {view.viewedAt ? (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                <Eye className="w-3 h-3 mr-1" /> Viewed
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                Pending
              </Badge>
            )}
          </TableCell>
          <TableCell></TableCell>
        </TableRow>
      ))}
    </>
  );
}

interface TagScore {
  tag: string;
  score: number;
  maxPossible: number;
  percentage: number;
}

function PacketDetailsRow({ screening, contentMap, assessmentMap }: { 
  screening: InternalScreening; 
  contentMap: Record<string, string>;
  assessmentMap: Record<string, string>;
}) {
  const answers = screening.answers as Record<string, any> || {};
  const tagScores = (screening.tagScores as TagScore[]) || [];
  const recommendedContentIds = screening.recommendedContentIds || [];

  return (
    <TableRow className="bg-muted/30">
      <TableCell colSpan={5} className="p-0">
        <div className="p-4 pl-10 space-y-4">
          {Object.keys(answers).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Assessment Responses</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(answers).map(([question, answer]) => (
                  <div key={question} className="bg-background rounded-md p-2 border">
                    <p className="text-xs text-muted-foreground">{question}</p>
                    <p className="text-sm font-medium">{String(answer)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tagScores.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Score Results</h4>
              <div className="flex flex-wrap gap-2">
                {tagScores.map((score) => (
                  <Badge key={score.tag} variant="secondary" className="text-xs">
                    {score.tag}: {score.percentage}%
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {recommendedContentIds.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Recommended Content
              </h4>
              <div className="flex flex-wrap gap-2">
                {recommendedContentIds.map((contentId) => (
                  <Badge key={contentId} variant="outline" className="text-xs border-primary/30 bg-primary/5 text-primary">
                    <FileText className="w-3 h-3 mr-1" />
                    {contentMap[contentId] || contentId}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [packetSearchQuery, setPacketSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedPacketRows, setExpandedPacketRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isEmailMode, isLoading: flagsLoading } = useContentDeliveryMode();
  
  const { data: emailLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["email-logs"],
    queryFn: getEmailLogs,
    enabled: isEmailMode,
  });
  
  const { data: internalScreenings, isLoading: screeningsLoading } = useQuery({
    queryKey: ["internal-screenings"],
    queryFn: getInternalScreenings,
  });

  const { data: assessments } = useQuery({
    queryKey: ["assessments"],
    queryFn: async () => {
      const res = await fetch("/api/assessments", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return res.json();
    },
  });
  
  const { data: contentItems } = useQuery({
    queryKey: ["content"],
    queryFn: getContent,
  });

  const resendMutation = useMutation({
    mutationFn: resendEmailContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
      toast({
        title: "Content Resent",
        description: "A new email with a fresh access code has been sent to the patient.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Resend",
        description: error.message || "Could not resend the content. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const contentMap = useMemo(() => {
    const map: Record<string, string> = {};
    contentItems?.forEach(item => {
      map[item.id] = item.title;
    });
    return map;
  }, [contentItems]);

  const assessmentMap = useMemo(() => {
    const map: Record<string, string> = {};
    assessments?.forEach((a: any) => {
      map[a.id] = a.name;
    });
    return map;
  }, [assessments]);
  
  const filteredLogs = useMemo(() => {
    if (!emailLogs) return [];
    if (!searchQuery) return emailLogs;
    const q = searchQuery.toLowerCase();
    return emailLogs.filter(log => 
      log.patientEmail.toLowerCase().includes(q) ||
      log.subject.toLowerCase().includes(q) ||
      log.type.toLowerCase().includes(q)
    );
  }, [emailLogs, searchQuery]);

  const filteredScreenings = useMemo(() => {
    if (!internalScreenings) return [];
    if (!packetSearchQuery) return internalScreenings;
    const q = packetSearchQuery.toLowerCase();
    return internalScreenings.filter((s: InternalScreening) => 
      (s.patientName?.toLowerCase() || "").includes(q) ||
      (s.primaryOutcome?.toLowerCase() || "").includes(q) ||
      (s.assessmentId && assessmentMap[s.assessmentId]?.toLowerCase() || "").includes(q)
    );
  }, [internalScreenings, packetSearchQuery, assessmentMap]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const togglePacketRow = (id: string) => {
    setExpandedPacketRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none"><CheckCircle className="w-3 h-3 mr-1"/> Completed</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"><Mail className="w-3 h-3 mr-1"/> Sent</Badge>;
      case 'opened':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50"><ExternalLink className="w-3 h-3 mr-1"/> Opened</Badge>;
      case 'clicked':
        return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50"><Eye className="w-3 h-3 mr-1"/> Clicked</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"><Mail className="w-3 h-3 mr-1"/> Sent</Badge>;
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'content_bundle': return 'Content Bundle';
      case 'assessment_invite': return 'Assessment Invite';
      case 'assessment_results': return 'Assessment Results';
      case 'follow_up_reminder': return 'Follow-up Reminder';
      default: return type;
    }
  };

  const defaultTab = isEmailMode ? "send" : "packets";

  if (flagsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold">History</h1>
            <p className="text-muted-foreground">Track your content delivery and packet history.</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="mb-4">
                {isEmailMode && (
                  <TabsTrigger value="send" className="flex items-center gap-2" data-testid="tab-send-history">
                    <Mail className="w-4 h-4" />
                    Send History
                  </TabsTrigger>
                )}
                <TabsTrigger value="packets" className="flex items-center gap-2" data-testid="tab-packet-history">
                  <Package className="w-4 h-4" />
                  Packet History
                </TabsTrigger>
              </TabsList>

              {isEmailMode && (
                <TabsContent value="send">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Transmission Log</h3>
                        <p className="text-sm text-muted-foreground">Recent email activity with engagement tracking</p>
                      </div>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search logs..." 
                          className="pl-9 h-9" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          data-testid="input-search-logs"
                        />
                      </div>
                    </div>

                    {logsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : filteredLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Inbox className="w-12 h-12 mb-3 opacity-50" />
                        <p className="font-medium">No emails sent yet</p>
                        <p className="text-sm mt-1">Send content to patients from the library to see your history here.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLogs.map((log) => {
                            const isExpanded = expandedRows.has(log.id);
                            const hasContentItems = log.type === 'content_bundle' && log.contentIds && log.contentIds.length > 0;
                            
                            return (
                              <Fragment key={log.id}>
                                <TableRow 
                                  data-testid={`row-email-log-${log.id}`}
                                  className={hasContentItems ? "cursor-pointer hover:bg-muted/50" : ""}
                                  onClick={() => hasContentItems && toggleRow(log.id)}
                                >
                                  <TableCell className="w-8">
                                    {hasContentItems && (
                                      <button className="p-1 hover:bg-muted rounded" data-testid={`expand-log-${log.id}`}>
                                        {isExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        )}
                                      </button>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm font-medium">
                                    {format(new Date(log.sentAt), "MMM d, h:mm a")}
                                  </TableCell>
                                  <TableCell className="font-medium">{log.patientEmail}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {log.type === 'assessment_invite' ? (
                                        <FileText className="w-4 h-4 text-primary" />
                                      ) : log.isFollowUp || log.type === 'follow_up_reminder' ? (
                                        <Repeat className="w-4 h-4 text-amber-600" />
                                      ) : (
                                        <Mail className="w-4 h-4 text-secondary-foreground" />
                                      )}
                                      <span>{getTypeLabel(log.type)}</span>
                                      {(log.isFollowUp || log.type === 'follow_up_reminder') && (
                                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">
                                          Follow-up
                                        </Badge>
                                      )}
                                      {hasContentItems && (
                                        <span className="text-xs text-muted-foreground">
                                          ({log.contentIds?.length} items)
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {getStatusBadge(log.status || 'sent')}
                                      {log.permanentlyLocked && (
                                        <Badge variant="destructive" className="text-xs" data-testid={`badge-locked-${log.id}`}>
                                          <ShieldX className="w-3 h-3 mr-1" />
                                          Locked
                                        </Badge>
                                      )}
                                      {!log.permanentlyLocked && log.lockedUntil && new Date(log.lockedUntil) > new Date() && (
                                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          Temp Lock
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      {log.permanentlyLocked && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-7 text-xs border-primary text-primary hover:bg-primary hover:text-white"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            resendMutation.mutate(log.id);
                                          }}
                                          disabled={resendMutation.isPending}
                                          data-testid={`button-resend-${log.id}`}
                                        >
                                          <RefreshCw className={`w-3 h-3 mr-1 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
                                          Resend
                                        </Button>
                                      )}
                                      <Link href={`/patient/${encodeURIComponent(log.patientEmail)}`}>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-7 text-xs"
                                          onClick={(e) => e.stopPropagation()}
                                          data-testid={`button-emr-${log.id}`}
                                        >
                                          <ClipboardList className="w-3 h-3 mr-1" />
                                          EMR
                                        </Button>
                                      </Link>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                {isExpanded && hasContentItems && (
                                  <ContentViewsRow emailLogId={log.id} contentMap={contentMap} />
                                )}
                              </Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="packets">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Content Packets</h3>
                      <p className="text-sm text-muted-foreground">Created packets with assessment Q&A and recommendations</p>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search packets..." 
                        className="pl-9 h-9" 
                        value={packetSearchQuery}
                        onChange={(e) => setPacketSearchQuery(e.target.value)}
                        data-testid="input-search-packets"
                      />
                    </div>
                  </div>

                  {screeningsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : filteredScreenings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Package className="w-12 h-12 mb-3 opacity-50" />
                      <p className="font-medium">No packets created yet</p>
                      <p className="text-sm mt-1">Use the "Guide Me" feature to create content packets based on assessments.</p>
                      <Link href="/content-packet-guide">
                        <Button variant="outline" className="mt-4" data-testid="button-create-packet">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Create a Packet
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Patient Name</TableHead>
                          <TableHead>Assessment</TableHead>
                          <TableHead>Outcome</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredScreenings.map((screening: InternalScreening) => {
                          const isExpanded = expandedPacketRows.has(screening.id);
                          
                          return (
                            <Fragment key={screening.id}>
                              <TableRow 
                                data-testid={`row-packet-${screening.id}`}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => togglePacketRow(screening.id)}
                              >
                                <TableCell className="w-8">
                                  <button className="p-1 hover:bg-muted rounded" data-testid={`expand-packet-${screening.id}`}>
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </button>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm font-medium">
                                  {format(new Date(screening.createdAt), "MMM d, h:mm a")}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {screening.patientName || "—"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-primary" />
                                    <span>{assessmentMap[screening.assessmentId] || "Assessment"}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {screening.primaryOutcome ? (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                                      {screening.primaryOutcome}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <PacketDetailsRow 
                                  screening={screening} 
                                  contentMap={contentMap}
                                  assessmentMap={assessmentMap}
                                />
                              )}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
