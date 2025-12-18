import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assessmentInvites, internalScreenings } from "@/lib/mockData";
import { Plus, Search, Mail, Eye, CheckCircle, Clock, Stethoscope, FileText, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function AssessmentsPage() {
  const { toast } = useToast();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isScreeningOpen, setIsScreeningOpen] = useState(false);

  const handleInvite = () => {
    setIsInviteOpen(false);
    toast({
      title: "Invite Sent",
      description: "Patient has been emailed the assessment link.",
    });
  };

  const handleScreening = () => {
    setIsScreeningOpen(false);
    toast({
      title: "Screening Saved",
      description: "Internal assessment recorded. Recommendations generated.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none"><CheckCircle className="w-3 h-3 mr-1"/> Completed</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none"><Mail className="w-3 h-3 mr-1"/> Sent</Badge>;
      case 'opened':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50"><Eye className="w-3 h-3 mr-1"/> Opened</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-serif font-bold">Assessments</h1>
          <p className="text-muted-foreground">Manage patient invites and internal screenings.</p>
        </div>

        <Tabs defaultValue="external" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="external" className="gap-2">
                <Send className="w-4 h-4" />
                Patient Invites
              </TabsTrigger>
              <TabsTrigger value="internal" className="gap-2">
                <Stethoscope className="w-4 h-4" />
                Internal Screenings
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Dialog open={isScreeningOpen} onOpenChange={setIsScreeningOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Stethoscope className="w-4 h-4 mr-2" />
                    New Internal Screening
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Internal Screening</DialogTitle>
                    <DialogDescription>
                      Record assessment results during a patient visit to generate recommendations.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Patient Name</Label>
                      <Input placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label>Clinical Notes</Label>
                      <Textarea placeholder="Patient reports..." />
                    </div>
                    <div className="p-4 bg-muted rounded-md border border-dashed">
                      <p className="text-sm text-center text-muted-foreground">
                        Questionnaire form would appear here...
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsScreeningOpen(false)}>Cancel</Button>
                    <Button onClick={handleScreening}>Save & Recommend</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Assessment Invite</DialogTitle>
                    <DialogDescription>
                      This will send a secure, unique link to the patient to complete the intake assessment.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Patient Email</Label>
                      <Input placeholder="patient@example.com" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                    <Button onClick={handleInvite}>Send Invite</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="external" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sent Invites</CardTitle>
                    <CardDescription>Assessments sent to patients for at-home completion</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search invites..." className="pl-9 h-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Result / Flag</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessmentInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.patientEmail}</TableCell>
                        <TableCell>{getStatusBadge(invite.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{invite.date}</TableCell>
                        <TableCell>
                          {invite.result !== '-' && (
                            <span className="font-medium text-primary">{invite.result}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="internal" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Internal Screenings</CardTitle>
                    <CardDescription>Assessments performed by clinician during visits</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search screenings..." className="pl-9 h-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Date Recorded</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Primary Outcome</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {internalScreenings.map((screen) => (
                      <TableRow key={screen.id}>
                        <TableCell className="font-medium">{screen.patientName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{screen.date}</TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">{screen.notes}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                            {screen.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View Report</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
