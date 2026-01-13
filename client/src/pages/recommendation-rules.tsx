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
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, Trash2, Edit, Loader2, Play, FileText, Route, Target } from "lucide-react";
import { useState } from "react";

interface RecommendationConfig {
  id: string;
  clinicianUserId: string | null;
  name: string;
  assessmentId: string | null;
  pathwayId: string | null;
  pathwayWeek: number | null;
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
}

interface CarePathway {
  id: string;
  name: string;
}

interface PathwaysResponse {
  custom: CarePathway[];
  templates: CarePathway[];
}

interface ContentItem {
  id: string;
  title: string;
}

interface PreviewResult {
  recommendations: Array<{
    contentId: string;
    contentTitle: string;
    tag: string;
    priority: number;
    rationale: string | null;
    source: string;
  }>;
  matchedRuleIds: string[];
}

const commonTags = [
  "fear_avoidance",
  "kinesiophobia",
  "catastrophizing",
  "pain_intensity",
  "functional_limitation",
  "sleep_disturbance",
  "anxiety",
  "depression",
  "self_efficacy",
  "movement_confidence",
];

export default function RecommendationRulesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<RecommendationConfig | null>(null);
  const [newConfig, setNewConfig] = useState({
    name: "",
    assessmentId: "",
    pathwayId: "",
    pathwayWeek: "",
    tag: "",
    minScore: 50,
    maxScore: 100,
    priority: 1,
    contentIds: [] as string[],
    rationale: "",
  });
  const [previewScores, setPreviewScores] = useState<Array<{ tag: string; percentage: number }>>([
    { tag: "fear_avoidance", percentage: 75 },
  ]);
  
  const queryClient = useQueryClient();
  
  const { data: configs, isLoading: configsLoading } = useQuery<RecommendationConfig[]>({
    queryKey: ["recommendation-configs"],
    queryFn: async () => {
      const res = await fetch("/api/recommendation-configs", { credentials: "include" });
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

  const { data: pathwaysData } = useQuery<PathwaysResponse>({
    queryKey: ["pathways"],
    queryFn: async () => {
      const res = await fetch("/api/pathways", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pathways");
      return res.json();
    },
  });
  
  const pathways = [...(pathwaysData?.custom || []), ...(pathwaysData?.templates || [])];

  const { data: content } = useQuery<ContentItem[]>({
    queryKey: ["content"],
    queryFn: async () => {
      const res = await fetch("/api/content", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
  });

  const { data: previewResult, refetch: refetchPreview, isFetching: previewLoading } = useQuery<PreviewResult>({
    queryKey: ["recommendation-preview", previewScores],
    queryFn: async () => {
      const res = await fetch("/api/recommendations/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tagScores: previewScores }),
      });
      if (!res.ok) throw new Error("Failed to preview");
      return res.json();
    },
    enabled: false,
  });

  const createMutation = useMutation({
    mutationFn: async (config: typeof newConfig) => {
      const res = await fetch("/api/recommendation-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...config,
          assessmentId: config.assessmentId || undefined,
          pathwayId: config.pathwayId || undefined,
          pathwayWeek: config.pathwayWeek ? parseInt(config.pathwayWeek) : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendation-configs"] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RecommendationConfig> }) => {
      const res = await fetch(`/api/recommendation-configs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendation-configs"] });
      setEditingConfig(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recommendation-configs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendation-configs"] });
    },
  });

  const resetForm = () => {
    setNewConfig({
      name: "",
      assessmentId: "",
      pathwayId: "",
      pathwayWeek: "",
      tag: "",
      minScore: 50,
      maxScore: 100,
      priority: 1,
      contentIds: [],
      rationale: "",
    });
  };

  const handleCreate = () => {
    if (!newConfig.name || !newConfig.tag || newConfig.contentIds.length === 0) return;
    createMutation.mutate(newConfig);
  };

  const handleToggleActive = (config: RecommendationConfig) => {
    updateMutation.mutate({ id: config.id, updates: { isActive: !config.isActive } });
  };

  const toggleContentSelection = (contentId: string) => {
    setNewConfig(prev => ({
      ...prev,
      contentIds: prev.contentIds.includes(contentId)
        ? prev.contentIds.filter(id => id !== contentId)
        : [...prev.contentIds, contentId],
    }));
  };

  const addPreviewTag = () => {
    setPreviewScores(prev => [...prev, { tag: "", percentage: 50 }]);
  };

  const updatePreviewTag = (index: number, field: "tag" | "percentage", value: string | number) => {
    setPreviewScores(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removePreviewTag = (index: number) => {
    setPreviewScores(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold">Recommendation Rules</h1>
            <p className="text-muted-foreground">Configure how assessment scores map to content recommendations.</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-preview-rules">
                  <Play className="w-4 h-4 mr-2" />
                  Preview Rules
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Preview Recommendations</DialogTitle>
                  <DialogDescription>Test how your rules respond to different assessment scores.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-3">
                    <Label>Simulated Tag Scores</Label>
                    {previewScores.map((score, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Select value={score.tag} onValueChange={(v) => updatePreviewTag(index, "tag", v)}>
                          <SelectTrigger className="w-48" data-testid={`select-preview-tag-${index}`}>
                            <SelectValue placeholder="Select tag" />
                          </SelectTrigger>
                          <SelectContent>
                            {commonTags.map(tag => (
                              <SelectItem key={tag} value={tag}>{tag.replace(/_/g, " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={score.percentage}
                          onChange={(e) => updatePreviewTag(index, "percentage", parseInt(e.target.value) || 0)}
                          className="w-20"
                          data-testid={`input-preview-score-${index}`}
                        />
                        <span className="text-muted-foreground">%</span>
                        <Button variant="ghost" size="sm" onClick={() => removePreviewTag(index)} data-testid={`button-remove-preview-tag-${index}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addPreviewTag} data-testid="button-add-preview-tag">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tag
                    </Button>
                  </div>
                  <Button onClick={() => refetchPreview()} disabled={previewLoading} data-testid="button-run-preview">
                    {previewLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                    Run Preview
                  </Button>
                  {previewResult && (
                    <div className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-medium">Recommended Content ({previewResult.recommendations.length})</h4>
                      {previewResult.recommendations.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No recommendations matched these scores.</p>
                      ) : (
                        <div className="space-y-2">
                          {previewResult.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div>
                                <p className="font-medium">{rec.contentTitle}</p>
                                <p className="text-sm text-muted-foreground">{rec.rationale}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="outline">{rec.source}</Badge>
                                <Badge>{rec.tag}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {previewResult.matchedRuleIds.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Matched {previewResult.matchedRuleIds.length} rule(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-rule">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Recommendation Rule</DialogTitle>
                  <DialogDescription>Define when to recommend specific content based on assessment scores.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input
                      placeholder="e.g., High Fear Avoidance - Graded Exposure"
                      value={newConfig.name}
                      onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                      data-testid="input-rule-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trigger Tag</Label>
                      <Select value={newConfig.tag} onValueChange={(v) => setNewConfig({ ...newConfig, tag: v })}>
                        <SelectTrigger data-testid="select-trigger-tag">
                          <SelectValue placeholder="Select tag" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonTags.map(tag => (
                            <SelectItem key={tag} value={tag}>{tag.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority (1 = highest)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={newConfig.priority}
                        onChange={(e) => setNewConfig({ ...newConfig, priority: parseInt(e.target.value) || 1 })}
                        data-testid="input-priority"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Score Range: {newConfig.minScore}% - {newConfig.maxScore}%</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm w-8">{newConfig.minScore}%</span>
                      <Slider
                        value={[newConfig.minScore, newConfig.maxScore]}
                        onValueChange={([min, max]) => setNewConfig({ ...newConfig, minScore: min, maxScore: max })}
                        min={0}
                        max={100}
                        step={5}
                        className="flex-1"
                        data-testid="slider-score-range"
                      />
                      <span className="text-sm w-8">{newConfig.maxScore}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Scope to Assessment (optional)</Label>
                      <Select value={newConfig.assessmentId} onValueChange={(v) => setNewConfig({ ...newConfig, assessmentId: v === "none" ? "" : v })}>
                        <SelectTrigger data-testid="select-assessment">
                          <SelectValue placeholder="Any assessment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Any assessment</SelectItem>
                          {assessments?.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Scope to Pathway (optional)</Label>
                      <Select value={newConfig.pathwayId} onValueChange={(v) => setNewConfig({ ...newConfig, pathwayId: v === "none" ? "" : v })}>
                        <SelectTrigger data-testid="select-pathway">
                          <SelectValue placeholder="Any pathway" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Any pathway</SelectItem>
                          {pathways?.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newConfig.pathwayId && (
                    <div className="space-y-2">
                      <Label>Pathway Week (optional)</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Any week"
                        value={newConfig.pathwayWeek}
                        onChange={(e) => setNewConfig({ ...newConfig, pathwayWeek: e.target.value })}
                        data-testid="input-pathway-week"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Content to Recommend</Label>
                    <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                      {content?.map(c => (
                        <div
                          key={c.id}
                          className={`p-2 rounded cursor-pointer flex items-center gap-2 ${
                            newConfig.contentIds.includes(c.id) ? "bg-primary/10 border border-primary" : "hover:bg-muted"
                          }`}
                          onClick={() => toggleContentSelection(c.id)}
                          data-testid={`content-item-${c.id}`}
                        >
                          <input
                            type="checkbox"
                            checked={newConfig.contentIds.includes(c.id)}
                            onChange={() => {}}
                            className="pointer-events-none"
                          />
                          <span>{c.title}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{newConfig.contentIds.length} selected</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Rationale (for your reference)</Label>
                    <Textarea
                      placeholder="Why should this content be recommended for this score range?"
                      value={newConfig.rationale}
                      onChange={(e) => setNewConfig({ ...newConfig, rationale: e.target.value })}
                      data-testid="textarea-rationale"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel-create">Cancel</Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending || !newConfig.name || !newConfig.tag || newConfig.contentIds.length === 0}
                    data-testid="button-save-rule"
                  >
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
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
                  Your Recommendation Rules
                </CardTitle>
                <CardDescription>
                  Rules are evaluated in priority order. Lower priority numbers are evaluated first.
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
                    <p className="text-sm">Create your first rule to start personalizing content recommendations.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule Name</TableHead>
                        <TableHead>Tag</TableHead>
                        <TableHead>Score Range</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {configs?.map(config => (
                        <TableRow key={config.id} data-testid={`rule-row-${config.id}`}>
                          <TableCell className="font-medium">{config.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{config.tag.replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell>{config.minScore}% - {config.maxScore}%</TableCell>
                          <TableCell>{config.contentIds.length} item(s)</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {config.assessmentId && <Badge variant="secondary">Assessment</Badge>}
                              {config.pathwayId && <Badge variant="secondary">Pathway</Badge>}
                              {!config.assessmentId && !config.pathwayId && <span className="text-muted-foreground">Global</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={config.isActive ?? true}
                              onCheckedChange={() => handleToggleActive(config)}
                              data-testid={`switch-active-${config.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(config.id)}
                              data-testid={`button-delete-${config.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
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

          <TabsContent value="guide" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>How the Recommendation Engine Works</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                      Your Rules First
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      When a patient completes an assessment, we first check your custom rules. If a patient's tag score falls within your defined range, we recommend the content you've specified.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                      Pathway Context
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      If the patient is enrolled in a care pathway, we consider their current week and prioritize milestone content that matches their elevated tags.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
                      Smart Fallback
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      If rules and pathway context don't provide enough recommendations, we match content tags to the patient's highest-scoring assessment areas.
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold">Example Rule</h4>
                    <p className="text-sm text-muted-foreground">
                      "If <strong>fear_avoidance</strong> score is between <strong>60-100%</strong>, recommend <strong>Graded Exposure Therapy</strong> content."
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This ensures patients with high fear avoidance always receive education about gradual movement exposure.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
