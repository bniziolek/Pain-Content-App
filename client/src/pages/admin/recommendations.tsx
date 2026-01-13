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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, Trash2, Edit, Loader2, Play, FileText, Target, Shield, CheckCircle, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

interface RecommendationConfig {
  id: string;
  clinicianUserId: string | null;
  name: string;
  assessmentId: string | null;
  pathwayId: string | null;
  pathwayWeek: number | null;
  questionName: string | null;
  questionType: string | null;
  matchOperator: string | null;
  matchValues: unknown;
  tag: string;
  minScore: number | null;
  maxScore: number | null;
  priority: number | null;
  contentIds: string[];
  rationale: string | null;
  isActive: boolean | null;
  createdAt: string;
}

interface Assessment {
  id: string;
  name: string;
  surveyJson?: unknown;
}

interface ContentItem {
  id: string;
  title: string;
  tags?: string[];
}

interface AssessmentQuestion {
  name: string;
  title: string;
  type: string;
  choices?: Array<{ value: string | number; text: string } | string | number>;
  rateMax?: number;
  rateMin?: number;
}

interface RuleFormData {
  id?: string;
  name: string;
  assessmentId: string;
  questionName: string;
  questionType: string;
  matchOperator: string;
  matchValues: unknown;
  priority: number;
  contentIds: string[];
  rationale: string;
}

const defaultFormData: RuleFormData = {
  name: "",
  assessmentId: "",
  questionName: "",
  questionType: "",
  matchOperator: "equals",
  matchValues: [],
  priority: 1,
  contentIds: [],
  rationale: "",
};

export default function AdminRecommendationsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<RuleFormData>(defaultFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<AssessmentQuestion | null>(null);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);
  
  const { data: configs, isLoading: configsLoading } = useQuery<RecommendationConfig[]>({
    queryKey: ["admin-recommendation-configs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/recommendation-configs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch configs");
      return res.json();
    },
  });

  const { data: assessments } = useQuery<Assessment[]>({
    queryKey: ["assessments"],
    queryFn: async () => {
      const res = await fetch("/api/assessments", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return res.json();
    },
  });

  const { data: content } = useQuery<ContentItem[]>({
    queryKey: ["content"],
    queryFn: async () => {
      const res = await fetch("/api/content", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
  });

  const { data: questions } = useQuery<AssessmentQuestion[]>({
    queryKey: ["assessment-questions", formData.assessmentId],
    queryFn: async () => {
      if (!formData.assessmentId) return [];
      const res = await fetch(`/api/assessments/${formData.assessmentId}/questions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
    enabled: !!formData.assessmentId,
  });

  useEffect(() => {
    if (formData.questionName && questions) {
      const q = questions.find(q => q.name === formData.questionName);
      setSelectedQuestion(q || null);
      if (q) {
        setFormData(prev => ({ ...prev, questionType: q.type }));
      }
    } else {
      setSelectedQuestion(null);
    }
  }, [formData.questionName, questions]);

  const createMutation = useMutation({
    mutationFn: async (data: RuleFormData) => {
      const res = await fetch("/api/admin/recommendation-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          assessmentId: data.assessmentId || undefined,
          questionName: data.questionName,
          questionType: data.questionType,
          matchOperator: data.matchOperator,
          matchValues: data.matchValues,
          tag: data.questionName,
          priority: data.priority,
          contentIds: data.contentIds,
          rationale: data.rationale,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recommendation-configs"] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: RuleFormData) => {
      const res = await fetch(`/api/admin/recommendation-configs/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          assessmentId: data.assessmentId || undefined,
          questionName: data.questionName,
          questionType: data.questionType,
          matchOperator: data.matchOperator,
          matchValues: data.matchValues,
          tag: data.questionName,
          priority: data.priority,
          contentIds: data.contentIds,
          rationale: data.rationale,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recommendation-configs"] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/recommendation-configs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recommendation-configs"] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/recommendation-configs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recommendation-configs"] });
    },
  });

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setIsEditing(false);
    setSelectedQuestion(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (config: RecommendationConfig) => {
    setFormData({
      id: config.id,
      name: config.name,
      assessmentId: config.assessmentId || "",
      questionName: config.questionName || "",
      questionType: config.questionType || "",
      matchOperator: config.matchOperator || "equals",
      matchValues: config.matchValues || [],
      priority: config.priority || 1,
      contentIds: config.contentIds || [],
      rationale: config.rationale || "",
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setFormData(defaultFormData);
    setIsEditing(false);
    setSelectedQuestion(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.assessmentId || !formData.questionName || formData.contentIds.length === 0) {
      return;
    }
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleContentSelection = (contentId: string) => {
    setFormData(prev => ({
      ...prev,
      contentIds: prev.contentIds.includes(contentId)
        ? prev.contentIds.filter(id => id !== contentId)
        : [...prev.contentIds, contentId],
    }));
  };

  const renderAnswerPicker = () => {
    if (!selectedQuestion) {
      return <p className="text-sm text-muted-foreground">Select a question first to configure the trigger.</p>;
    }

    const { type, choices, rateMax, rateMin } = selectedQuestion;

    if (type === "boolean") {
      return (
        <div className="space-y-3">
          <Label>When the answer is:</Label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={Array.isArray(formData.matchValues) && formData.matchValues.includes(true) ? "default" : "outline"}
              onClick={() => setFormData(prev => ({ ...prev, matchOperator: "equals", matchValues: [true] }))}
              data-testid="btn-match-yes"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Yes
            </Button>
            <Button
              type="button"
              variant={Array.isArray(formData.matchValues) && formData.matchValues.includes(false) ? "default" : "outline"}
              onClick={() => setFormData(prev => ({ ...prev, matchOperator: "equals", matchValues: [false] }))}
              data-testid="btn-match-no"
            >
              No
            </Button>
          </div>
        </div>
      );
    }

    if (type === "radiogroup" || type === "dropdown") {
      const choiceOptions = choices?.map(c => {
        if (typeof c === "object" && c !== null) {
          return { value: c.value, text: c.text };
        }
        return { value: c, text: String(c) };
      }) || [];

      return (
        <div className="space-y-3">
          <Label>When the answer is:</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
            {choiceOptions.map((choice, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Checkbox
                  checked={Array.isArray(formData.matchValues) && formData.matchValues.includes(choice.value)}
                  onCheckedChange={(checked) => {
                    const current = Array.isArray(formData.matchValues) ? formData.matchValues : [];
                    const newValues = checked
                      ? [...current, choice.value]
                      : current.filter(v => v !== choice.value);
                    setFormData(prev => ({ ...prev, matchOperator: newValues.length > 1 ? "in" : "equals", matchValues: newValues }));
                  }}
                  data-testid={`checkbox-choice-${idx}`}
                />
                <span>{choice.text}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Select one or more answers that should trigger this recommendation.</p>
        </div>
      );
    }

    if (type === "rating") {
      const max = rateMax || 5;
      const min = rateMin || 1;
      const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

      return (
        <div className="space-y-3">
          <Label>When the rating is:</Label>
          <Select
            value={formData.matchOperator}
            onValueChange={(v) => setFormData(prev => ({ ...prev, matchOperator: v }))}
          >
            <SelectTrigger data-testid="select-match-operator">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">Exactly</SelectItem>
              <SelectItem value="greater_than">Greater than</SelectItem>
              <SelectItem value="less_than">Less than</SelectItem>
              <SelectItem value="between">Between</SelectItem>
            </SelectContent>
          </Select>
          
          {formData.matchOperator === "between" ? (
            <div className="flex items-center gap-2">
              <Select
                value={String((formData.matchValues as { min?: number })?.min || min)}
                onValueChange={(v) => setFormData(prev => ({
                  ...prev,
                  matchValues: { ...(prev.matchValues as object || {}), min: parseInt(v) }
                }))}
              >
                <SelectTrigger className="w-20" data-testid="select-min-value">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {values.map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <span>and</span>
              <Select
                value={String((formData.matchValues as { max?: number })?.max || max)}
                onValueChange={(v) => setFormData(prev => ({
                  ...prev,
                  matchValues: { ...(prev.matchValues as object || {}), max: parseInt(v) }
                }))}
              >
                <SelectTrigger className="w-20" data-testid="select-max-value">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {values.map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Select
              value={String(Array.isArray(formData.matchValues) ? formData.matchValues[0] : (formData.matchValues as { value?: number })?.value || min)}
              onValueChange={(v) => setFormData(prev => ({
                ...prev,
                matchValues: formData.matchOperator === "equals" ? [parseInt(v)] : { value: parseInt(v) }
              }))}
            >
              <SelectTrigger data-testid="select-match-value">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {values.map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <Label>When the answer contains:</Label>
        <Input
          placeholder="Enter value to match"
          value={Array.isArray(formData.matchValues) ? formData.matchValues[0] || "" : ""}
          onChange={(e) => setFormData(prev => ({ ...prev, matchOperator: "equals", matchValues: [e.target.value] }))}
          data-testid="input-match-value"
        />
      </div>
    );
  };

  const getAssessmentName = (id: string | null) => {
    if (!id) return "Any";
    return assessments?.find(a => a.id === id)?.name || id;
  };

  const formatMatchCondition = (config: RecommendationConfig) => {
    if (!config.questionName) {
      return `${config.tag}: ${config.minScore}%-${config.maxScore}%`;
    }
    
    const operator = config.matchOperator || "equals";
    const values = config.matchValues;
    
    if (operator === "equals" && Array.isArray(values)) {
      const val = values[0];
      if (typeof val === "boolean") return val ? "Yes" : "No";
      return String(val);
    }
    if (operator === "in" && Array.isArray(values)) {
      return values.map(v => typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)).join(" or ");
    }
    if (operator === "between" && typeof values === "object" && values !== null) {
      const { min, max } = values as { min?: number; max?: number };
      return `${min} - ${max}`;
    }
    if ((operator === "greater_than" || operator === "less_than") && typeof values === "object" && values !== null) {
      const threshold = (values as { value?: number }).value;
      return `${operator === "greater_than" ? ">" : "<"} ${threshold}`;
    }
    
    return JSON.stringify(values);
  };

  const isLegacyRule = (config: RecommendationConfig) => !config.questionName;

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-600">Admin Only</span>
            </div>
            <h1 className="text-3xl font-serif font-bold">Recommendation Rules</h1>
            <p className="text-muted-foreground">Connect assessment answers to content recommendations.</p>
          </div>
          <Button onClick={openCreateDialog} data-testid="button-create-rule">
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
        </div>

        <Tabs defaultValue="rules">
          <TabsList>
            <TabsTrigger value="rules" data-testid="tab-rules">
              <Target className="w-4 h-4 mr-2" />
              Active Rules
            </TabsTrigger>
            <TabsTrigger value="guide" data-testid="tab-guide">
              <FileText className="w-4 h-4 mr-2" />
              How It Works
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  All Recommendation Rules
                </CardTitle>
                <CardDescription>
                  When a clinician completes an assessment with matching answers, these rules determine what content to recommend.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {configsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : configs?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recommendation rules yet.</p>
                    <p className="text-sm">Create your first rule to connect assessment answers to content.</p>
                    <Button onClick={openCreateDialog} className="mt-4" data-testid="button-create-first-rule">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Rule
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule Name</TableHead>
                        <TableHead>Assessment</TableHead>
                        <TableHead>Question / Tag</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {configs?.map(config => (
                        <TableRow key={config.id} data-testid={`rule-row-${config.id}`}>
                          <TableCell className="font-medium">{config.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getAssessmentName(config.assessmentId)}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{config.questionName || config.tag}</span>
                          </TableCell>
                          <TableCell>
                            <Badge>{formatMatchCondition(config)}</Badge>
                          </TableCell>
                          <TableCell>{config.contentIds.length} item(s)</TableCell>
                          <TableCell>
                            <Badge variant={isLegacyRule(config) ? "secondary" : "default"}>
                              {isLegacyRule(config) ? "Legacy %" : "Answer"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={config.isActive ?? true}
                              onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: config.id, isActive: checked })}
                              data-testid={`switch-active-${config.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(config)}
                                data-testid={`button-edit-${config.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMutation.mutate(config.id)}
                                data-testid={`button-delete-${config.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guide" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  How Recommendation Rules Work
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                      Select an Assessment
                    </h4>
                    <p className="text-muted-foreground">
                      Choose which assessment this rule applies to. The questions from that assessment will be available to configure.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                      Pick a Question & Answer
                    </h4>
                    <p className="text-muted-foreground">
                      Select the specific question that should trigger content. Then choose which answer(s) should activate the rule:
                    </p>
                    <ul className="list-disc list-inside mt-2 text-muted-foreground">
                      <li><strong>Yes/No questions:</strong> Pick "Yes" or "No"</li>
                      <li><strong>Multiple choice:</strong> Select one or more answers</li>
                      <li><strong>Rating scales:</strong> Set a threshold (e.g., "greater than 3")</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
                      Attach Content
                    </h4>
                    <p className="text-muted-foreground">
                      Select the educational content that should be recommended when this rule triggers. You can attach multiple pieces of content to a single rule.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2 text-amber-800">
                      Legacy Percentage-Based Rules
                    </h4>
                    <p className="text-amber-700">
                      Older rules that use tag/percentage matching are marked as "Legacy %" and still work. New rules use the improved answer-based matching for more precise targeting.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Recommendation Rule" : "Create Recommendation Rule"}</DialogTitle>
              <DialogDescription>
                Define when to recommend specific content based on assessment answers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Rule Name *</Label>
                <Input
                  placeholder="e.g., High Fear - Graded Exposure Content"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="input-rule-name"
                />
              </div>

              <div className="space-y-2">
                <Label>Assessment *</Label>
                <Select
                  value={formData.assessmentId}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, assessmentId: v, questionName: "", questionType: "", matchValues: [] }))}
                >
                  <SelectTrigger data-testid="select-assessment">
                    <SelectValue placeholder="Select an assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments?.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.assessmentId && (
                <div className="space-y-2">
                  <Label>Question *</Label>
                  <Select
                    value={formData.questionName}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, questionName: v, matchValues: [] }))}
                  >
                    <SelectTrigger data-testid="select-question">
                      <SelectValue placeholder="Select a question" />
                    </SelectTrigger>
                    <SelectContent>
                      {questions?.map(q => (
                        <SelectItem key={q.name} value={q.name}>
                          {q.title || q.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.questionName && (
                <div className="p-4 border rounded-lg bg-muted/30">
                  {renderAnswerPicker()}
                </div>
              )}

              <div className="space-y-2">
                <Label>Content to Recommend *</Label>
                <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                  {content?.map(c => (
                    <div
                      key={c.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted ${
                        formData.contentIds.includes(c.id) ? "bg-primary/10 border border-primary/30" : ""
                      }`}
                      onClick={() => toggleContentSelection(c.id)}
                      data-testid={`content-item-${c.id}`}
                    >
                      <Checkbox
                        checked={formData.contentIds.includes(c.id)}
                        onCheckedChange={() => toggleContentSelection(c.id)}
                      />
                      <span className="text-sm">{c.title}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{formData.contentIds.length} item(s) selected</p>
              </div>

              <div className="space-y-2">
                <Label>Priority (1 = highest)</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                  data-testid="input-priority"
                />
              </div>

              <div className="space-y-2">
                <Label>Rationale (optional)</Label>
                <Textarea
                  placeholder="Why is this content recommended for this answer?"
                  value={formData.rationale}
                  onChange={(e) => setFormData(prev => ({ ...prev, rationale: e.target.value }))}
                  data-testid="input-rationale"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.name || !formData.assessmentId || !formData.questionName || formData.contentIds.length === 0 || createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-rule"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
