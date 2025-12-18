import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sentHistory } from "@/lib/mockHistoryData";
import { Search, Mail, FileText, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function HistoryPage() {
  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none"><CheckCircle className="w-3 h-3 mr-1"/> Completed</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"><Mail className="w-3 h-3 mr-1"/> Sent</Badge>;
      case 'opened':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50"><ExternalLink className="w-3 h-3 mr-1"/> Opened</Badge>;
      case 'clicked':
        return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50"><ExternalLink className="w-3 h-3 mr-1"/> Clicked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
                <Input placeholder="Search logs..." className="pl-9 h-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content / Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sentHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground text-sm font-medium">
                      {format(new Date(item.sentDate), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell className="font-medium">{item.patientEmail}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.type.includes('Assessment') ? (
                          <FileText className="w-4 h-4 text-primary" />
                        ) : (
                          <Mail className="w-4 h-4 text-secondary-foreground" />
                        )}
                        <span>{item.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {item.items.map((content, idx) => (
                          <span key={idx} className="text-sm text-muted-foreground truncate max-w-[200px]" title={content}>
                            • {content}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
