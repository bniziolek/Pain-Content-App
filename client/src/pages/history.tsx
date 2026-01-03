import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Mail, FileText, CheckCircle, ExternalLink, Inbox, Loader2, ChevronDown, ChevronRight, Clock, Eye, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getEmailLogs, getContent, getContentViewsByEmailLog } from "@/lib/api";
import { useState, useMemo, Fragment } from "react";
import { Link } from "wouter";
import type { ContentView } from "@shared/schema";

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

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const { data: emailLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["email-logs"],
    queryFn: getEmailLogs,
  });
  
  const { data: contentItems } = useQuery({
    queryKey: ["content"],
    queryFn: getContent,
  });
  
  const contentMap = useMemo(() => {
    const map: Record<string, string> = {};
    contentItems?.forEach(item => {
      map[item.id] = item.title;
    });
    return map;
  }, [contentItems]);
  
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
      default: return type;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold">Send History</h1>
            <p className="text-muted-foreground">Track all content and invites sent to patients.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transmission Log</CardTitle>
                <CardDescription>Recent email activity with engagement tracking</CardDescription>
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
          </CardHeader>
          <CardContent>
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
                              ) : (
                                <Mail className="w-4 h-4 text-secondary-foreground" />
                              )}
                              <span>{getTypeLabel(log.type)}</span>
                              {hasContentItems && (
                                <span className="text-xs text-muted-foreground">
                                  ({log.contentIds?.length} items)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status || 'sent')}</TableCell>
                          <TableCell>
                            <Link href={`/patient/${encodeURIComponent(log.patientEmail)}`}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`button-emr-${log.id}`}
                              >
                                <ClipboardList className="w-3 h-3 mr-1" />
                                EMR Note
                              </Button>
                            </Link>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
