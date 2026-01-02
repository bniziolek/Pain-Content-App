import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Mail, FileText, CheckCircle, ExternalLink, Inbox, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getEmailLogs, getContent } from "@/lib/api";
import { useState, useMemo } from "react";

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
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
  
  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none"><CheckCircle className="w-3 h-3 mr-1"/> Completed</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"><Mail className="w-3 h-3 mr-1"/> Sent</Badge>;
      case 'opened':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50"><ExternalLink className="w-3 h-3 mr-1"/> Opened</Badge>;
      case 'clicked':
        return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50"><ExternalLink className="w-3 h-3 mr-1"/> Clicked</Badge>;
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
                <CardDescription>Recent email activity</CardDescription>
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
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Content / Details</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-email-log-${log.id}`}>
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {log.contentIds && log.contentIds.length > 0 ? (
                            log.contentIds.map((contentId, idx) => (
                              <span key={idx} className="text-sm text-muted-foreground truncate max-w-[200px]" title={contentMap[contentId] || contentId}>
                                {contentMap[contentId] || contentId}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">{log.subject}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status || 'sent')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
