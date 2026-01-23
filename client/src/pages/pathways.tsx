import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPathways, createPathway, getPatientPathways, createPatientPathway, getPathwayById } from "@/lib/api";
import { Plus, Route, Users, Calendar, ChevronRight, Loader2, Play, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import type { CarePathway, PatientPathway } from "@shared/api-types";
import { useTierEntitlement } from "@/hooks/use-feature-flags";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export default function PathwaysPage() {
  const { needsUpgrade, currentTier } = useTierEntitlement('care_pathways');
  
  if (needsUpgrade) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12">
          <UpgradePrompt
            feature="Care Pathways"
            requiredTier="pro"
            currentTier={currentTier}
            variant="card"
          />
        </div>
      </DashboardLayout>
    );
  }
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedPathway, setSelectedPathway] = useState<CarePathway | null>(null);
  const [newPathway, setNewPathway] = useState({
    name: "",
    description: "",
    condition: "",
    durationWeeks: 8,
  });
  const [enrollment, setEnrollment] = useState({
    pathwayId: "",
    patientEmail: "",
    patientName: "",
    startDate: new Date().toISOString().split('T')[0],
  });
  
  const queryClient = useQueryClient();
  
  const { data: pathways, isLoading: pathwaysLoading } = useQuery({
    queryKey: ["pathways"],
    queryFn: getPathways,
  });
  
  const { data: patientPathways, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["patient-pathways"],
    queryFn: getPatientPathways,
  });
  
  const createMutation = useMutation({
    mutationFn: createPathway,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pathways"] });
      setIsCreateOpen(false);
      setNewPathway({ name: "", description: "", condition: "", durationWeeks: 8 });
    },
  });
  
  const enrollMutation = useMutation({
    mutationFn: createPatientPathway,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-pathways"] });
      setIsEnrollOpen(false);
      setEnrollment({ pathwayId: "", patientEmail: "", patientName: "", startDate: new Date().toISOString().split('T')[0] });
    },
  });
  
  const allPathways = [...(pathways?.custom || []), ...(pathways?.templates || [])];
  
  const getProgressPercent = (pp: PatientPathway) => {
    const pathway = allPathways.find(p => p.id === pp.pathwayId);
    if (!pathway?.durationWeeks) return 0;
    return Math.min(100, Math.round(((pp.currentWeek || 1) / pathway.durationWeeks) * 100));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold">Care Pathways</h1>
            <p className="text-muted-foreground">Create structured treatment protocols and track patient progress through their journey.</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-enroll-patient">
                  <Users className="w-4 h-4 mr-2" />
                  Enroll Patient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enroll Patient in Pathway</DialogTitle>
                  <DialogDescription>Start a patient on a structured care pathway.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Pathway</Label>
                    <Select value={enrollment.pathwayId} onValueChange={(v) => setEnrollment({ ...enrollment, pathwayId: v })}>
                      <SelectTrigger data-testid="select-pathway">
                        <SelectValue placeholder="Choose a pathway..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allPathways.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Patient Email</Label>
                    <Input 
                      type="email"
                      placeholder="patient@example.com"
                      value={enrollment.patientEmail}
                      onChange={(e) => setEnrollment({ ...enrollment, patientEmail: e.target.value })}
                      data-testid="input-patient-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Patient Name (Optional)</Label>
                    <Input 
                      placeholder="John Doe"
                      value={enrollment.patientName}
                      onChange={(e) => setEnrollment({ ...enrollment, patientName: e.target.value })}
                      data-testid="input-patient-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input 
                      type="date"
                      value={enrollment.startDate}
                      onChange={(e) => setEnrollment({ ...enrollment, startDate: e.target.value })}
                      data-testid="input-start-date"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEnrollOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={() => enrollMutation.mutate(enrollment)} 
                    disabled={!enrollment.pathwayId || !enrollment.patientEmail || enrollMutation.isPending}
                    data-testid="button-confirm-enroll"
                  >
                    {enrollMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    Enroll Patient
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-pathway">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Pathway
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Care Pathway</DialogTitle>
                  <DialogDescription>Define a structured treatment protocol for patients.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Pathway Name</Label>
                    <Input 
                      placeholder="e.g., Low Back Pain Recovery"
                      value={newPathway.name}
                      onChange={(e) => setNewPathway({ ...newPathway, name: e.target.value })}
                      data-testid="input-pathway-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Input 
                      placeholder="e.g., Chronic Low Back Pain"
                      value={newPathway.condition}
                      onChange={(e) => setNewPathway({ ...newPathway, condition: e.target.value })}
                      data-testid="input-condition"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (Weeks)</Label>
                    <Input 
                      type="number"
                      min={1}
                      max={52}
                      value={newPathway.durationWeeks}
                      onChange={(e) => setNewPathway({ ...newPathway, durationWeeks: parseInt(e.target.value) || 8 })}
                      data-testid="input-duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="Describe the treatment approach..."
                      value={newPathway.description}
                      onChange={(e) => setNewPathway({ ...newPathway, description: e.target.value })}
                      data-testid="input-description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={() => createMutation.mutate(newPathway)} disabled={!newPathway.name || createMutation.isPending} data-testid="button-save-pathway">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Pathway
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="enrollments">
          <TabsList>
            <TabsTrigger value="enrollments">Active Patients</TabsTrigger>
            <TabsTrigger value="pathways">Pathway Library</TabsTrigger>
          </TabsList>
          
          <TabsContent value="enrollments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient Enrollments</CardTitle>
                <CardDescription>Track patients progressing through care pathways.</CardDescription>
              </CardHeader>
              <CardContent>
                {enrollmentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : !patientPathways || patientPathways.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No patients enrolled yet.</p>
                    <p className="text-sm mt-1">Enroll a patient in a pathway to start tracking their progress.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientPathways.map((pp) => {
                      const pathway = allPathways.find(p => p.id === pp.pathwayId);
                      const progress = getProgressPercent(pp);
                      
                      return (
                        <div key={pp.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors" data-testid={`enrollment-${pp.id}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-medium">{pp.patientName || pp.patientEmail}</div>
                              <div className="text-sm text-muted-foreground">{pp.patientEmail}</div>
                            </div>
                            <Badge variant={pp.status === 'active' ? 'default' : pp.status === 'completed' ? 'secondary' : 'outline'}>
                              {pp.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Route className="w-4 h-4" />
                            <span>{pathway?.name || 'Unknown Pathway'}</span>
                            <span className="mx-2">|</span>
                            <Calendar className="w-4 h-4" />
                            <span>Week {pp.currentWeek} of {pathway?.durationWeeks || '?'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress value={progress} className="flex-1" />
                            <span className="text-sm font-medium">{progress}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pathways" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              {pathwaysLoading ? (
                <div className="col-span-2 flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : allPathways.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  <Route className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No pathways created yet.</p>
                  <p className="text-sm mt-1">Create your first care pathway to get started.</p>
                </div>
              ) : (
                allPathways.map((pathway) => (
                  <Card key={pathway.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`pathway-card-${pathway.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{pathway.name}</CardTitle>
                          {pathway.condition && (
                            <Badge variant="outline" className="mt-1">{pathway.condition}</Badge>
                          )}
                        </div>
                        {pathway.isTemplate && (
                          <Badge variant="secondary">Template</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{pathway.description || 'No description'}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{pathway.durationWeeks} weeks</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
