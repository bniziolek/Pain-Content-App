import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { internalScreenings } from "@/lib/mockData";
import { Plus, Search, Mail, Eye, CheckCircle, Stethoscope, Send, PenTool, Edit, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface Assessment {
  id: string;
  name: string;
  description: string | null;
  isTemplate: boolean;
  isPublished: boolean;
  createdAt: string;
}

interface AssessmentInvite {
  id: string;
  patientEmail: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  assessmentId: string;
}

export default function AssessmentsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isScreeningOpen, setIsScreeningOpen] = useState(false);

  const { data: assessments = [] } = useQuery<Assessment[]>({
    queryKey: ["assessments"],
    queryFn: async () => {
      const res = await fetch("/api/assessments", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return res.json();
    },
  });

  const { data: invites = [], isLoading: invitesLoading } = useQuery<AssessmentInvite[]>({
    queryKey: ["assessment-invites"],
    queryFn: async () => {
      const res = await fetch("/api/assessment-invites", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invites");
      return res.json();
    },
  });

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

        <Tabs defaultValue="builder" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="builder" className="gap-2" data-testid="tab-builder">
                <PenTool className="w-4 h-4" />
                My Assessments
              </TabsTrigger>
              <TabsTrigger value="external" className="gap-2" data-testid="tab-invites">
                <Send className="w-4 h-4" />
                Patient Invites
              </TabsTrigger>
              <TabsTrigger value="internal" className="gap-2" data-testid="tab-screenings">
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
              <Button 
                onClick={() => setLocation("/assessments/builder")}
                data-testid="button-build-assessment"
              >
                <PenTool className="w-4 h-4 mr-2" />
                Build Assessment
              </Button>
            </div>
          </div>

          <TabsContent value="builder" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Assessments</CardTitle>
                    <CardDescription>Custom assessments you've created using the visual builder</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search assessments..." className="pl-9 h-9" data-testid="input-search-assessments" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {assessments.length === 0 ? (
                  <div className="text-center py-12">
                    <PenTool className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No assessments yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first custom assessment using our visual builder.
                    </p>
                    <Button onClick={() => setLocation("/assessments/builder")} data-testid="button-create-first">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Assessment
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assessments.map((assessment) => (
                        <TableRow key={assessment.id} data-testid={`row-assessment-${assessment.id}`}>
                          <TableCell className="font-medium">{assessment.name}</TableCell>
                          <TableCell>
                            {assessment.isPublished ? (
                              <Badge className="bg-green-100 text-green-700 border-none">Published</Badge>
                            ) : (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {assessment.isTemplate ? (
                              <Badge variant="outline">Template</Badge>
                            ) : (
                              <Badge variant="outline">Custom</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(assessment.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setLocation(`/assessments/builder/${assessment.id}`)}
                              data-testid={`button-edit-${assessment.id}`}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                    <Input placeholder="Search invites..." className="pl-9 h-9" data-testid="input-search-invites" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {invitesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : invites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No assessment invites sent yet.</p>
                    <p className="text-sm">Send an assessment to a patient to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent Date</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invites.map((invite) => (
                        <TableRow key={invite.id} data-testid={`invite-row-${invite.id}`}>
                          <TableCell className="font-medium">{invite.patientEmail}</TableCell>
                          <TableCell>{getStatusBadge(invite.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(invite.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {invite.completedAt 
                              ? format(new Date(invite.completedAt), "MMM d, yyyy")
                              : "-"
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {invite.status === "completed" ? (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => setLocation(`/assessments/results/${invite.id}`)}
                                data-testid={`button-view-results-${invite.id}`}
                              >
                                <Sparkles className="w-4 h-4 mr-1" />
                                View Results
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" disabled>
                                Pending
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
