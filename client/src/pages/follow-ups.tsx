import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFollowUpRules, createFollowUpRule, updateFollowUpRule, deleteFollowUpRule, getScheduledFollowUps, toggleFollowUpTemplate, type TemplateWithStatus } from "@/lib/api";
import { Plus, Bell, Clock, Mail, Trash2, Edit, AlertCircle, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useTierEntitlement } from "@/hooks/use-feature-flags";
import { UpgradePrompt } from "@/components/upgrade-prompt";

const triggerTypeLabels: Record<string, string> = {
  no_view: "Patient hasn't viewed content",
  partial_view: "Patient partially viewed content",
  time_based: "Days after sending",
  assessment_complete: "Assessment completed",
};

const actionLabels: Record<string, string> = {
  send_reminder: "Send reminder email",
  send_new_content: "Send additional content",
  send_assessment: "Send assessment invite",
};

export default function FollowUpsPage() {
  const { needsUpgrade, currentTier } = useTierEntitlement('follow_up_automation');
  
  if (needsUpgrade) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12">
          <UpgradePrompt
            feature="Follow-up Automation"
            requiredTier="pro"
            currentTier={currentTier}
            variant="card"
          />
        </div>
      </DashboardLayout>
    );
  }
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    triggerType: "no_view",
    triggerDays: 3,
    action: "send_reminder",
    message: "",
  });
  
  const queryClient = useQueryClient();
  
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ["follow-up-rules"],
    queryFn: getFollowUpRules,
  });
  
  const { data: scheduled, isLoading: scheduledLoading } = useQuery({
    queryKey: ["scheduled-follow-ups"],
    queryFn: getScheduledFollowUps,
  });
  
  const createMutation = useMutation({
    mutationFn: createFollowUpRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-up-rules"] });
      setIsCreateOpen(false);
      setNewRule({ name: "", triggerType: "no_view", triggerDays: 3, action: "send_reminder", message: "" });
    },
  });
  
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateFollowUpRule(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follow-up-rules"] }),
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteFollowUpRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follow-up-rules"] }),
  });

  const templateToggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) => toggleFollowUpTemplate(id, isEnabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["follow-up-rules"] }),
  });
  
  const handleCreate = () => {
    createMutation.mutate(newRule);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold">Automated Follow-ups</h1>
            <p className="text-muted-foreground">Set up rules to automatically follow up with patients based on their engagement.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-rule">
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Follow-up Rule</DialogTitle>
                <DialogDescription>Define when and how to automatically follow up with patients.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input 
                    placeholder="e.g., 3-Day No View Reminder"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    data-testid="input-rule-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trigger When</Label>
                  <Select value={newRule.triggerType} onValueChange={(v) => setNewRule({ ...newRule, triggerType: v })}>
                    <SelectTrigger data-testid="select-trigger-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_view">Patient hasn't viewed content</SelectItem>
                      <SelectItem value="partial_view">Patient partially viewed content</SelectItem>
                      <SelectItem value="time_based">Days after sending</SelectItem>
                      <SelectItem value="assessment_complete">Assessment completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Days After Initial Send</Label>
                  <Input 
                    type="number"
                    min={1}
                    max={30}
                    value={newRule.triggerDays}
                    onChange={(e) => setNewRule({ ...newRule, triggerDays: parseInt(e.target.value) || 3 })}
                    data-testid="input-trigger-days"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Action</Label>
                  <Select value={newRule.action} onValueChange={(v) => setNewRule({ ...newRule, action: v })}>
                    <SelectTrigger data-testid="select-action">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_reminder">Send reminder email</SelectItem>
                      <SelectItem value="send_new_content">Send additional content</SelectItem>
                      <SelectItem value="send_assessment">Send assessment invite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Custom Message (Optional)</Label>
                  <Input 
                    placeholder="Add a personal note..."
                    value={newRule.message}
                    onChange={(e) => setNewRule({ ...newRule, message: e.target.value })}
                    data-testid="input-message"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newRule.name || createMutation.isPending} data-testid="button-save-rule">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="templates">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="custom">Custom Rules</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Suggested Follow-up Templates
                </CardTitle>
                <CardDescription>Pre-built follow-up patterns you can enable with one click. Toggle on the ones you want to use.</CardDescription>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : !rules?.templates || rules.templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No template rules available yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {rules.templates.map((template) => (
                      <Card key={template.id} className={`relative transition-all ${template.isEnabled ? 'ring-2 ring-primary bg-primary/5' : 'opacity-75'}`} data-testid={`card-template-${template.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">{triggerTypeLabels[template.triggerType]}</Badge>
                                <Badge variant="secondary" className="text-xs">{template.triggerDays} days</Badge>
                              </div>
                            </div>
                            <Switch
                              checked={template.isEnabled}
                              onCheckedChange={(checked) => templateToggleMutation.mutate({ id: template.id, isEnabled: checked })}
                              data-testid={`switch-template-${template.id}`}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground">{template.message}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="custom" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Custom Rules</CardTitle>
                <CardDescription>Custom follow-up rules you've created for your practice.</CardDescription>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : !rules?.custom || rules.custom.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No custom follow-up rules created yet.</p>
                    <p className="text-sm mt-1">Create your first rule to start automating patient follow-ups.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule Name</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.custom.map((rule) => (
                        <TableRow key={rule.id} data-testid={`row-rule-${rule.id}`}>
                          <TableCell className="font-medium">{rule.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{triggerTypeLabels[rule.triggerType] || rule.triggerType}</Badge>
                          </TableCell>
                          <TableCell>{rule.triggerDays} days</TableCell>
                          <TableCell>{actionLabels[rule.action] || rule.action}</TableCell>
                          <TableCell>
                            <Switch
                              checked={rule.isActive ?? false}
                              onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isActive: checked })}
                              data-testid={`switch-active-${rule.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(rule.id)}
                              data-testid={`button-delete-${rule.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
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
          
          <TabsContent value="scheduled" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Follow-ups</CardTitle>
                <CardDescription>Upcoming automated follow-ups based on your rules.</CardDescription>
              </CardHeader>
              <CardContent>
                {scheduledLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : !scheduled || scheduled.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No scheduled follow-ups.</p>
                    <p className="text-sm mt-1">Follow-ups will appear here when rules are triggered.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Scheduled For</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduled.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.patientEmail}</TableCell>
                          <TableCell>{format(new Date(item.scheduledFor), "MMM d, yyyy 'at' h:mm a")}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === 'sent' ? 'default' : item.status === 'pending' ? 'secondary' : 'outline'}>
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
