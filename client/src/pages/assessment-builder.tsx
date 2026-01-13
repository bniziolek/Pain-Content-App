import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Eye, Loader2, Maximize2, Minimize2, X, HelpCircle, Settings2, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "wouter";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";

interface Assessment {
  id: string;
  name: string;
  description: string | null;
  assessmentType: "clinician" | "patient";
  surveyJson: object;
  scoringConfig: object | null;
  outcomeRules: object | null;
  isTemplate: boolean;
  isPublished: boolean;
}

export default function AssessmentBuilderPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/assessments/builder/:id");
  const queryClient = useQueryClient();
  
  const assessmentId = params?.id;
  const isEditing = !!assessmentId;
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assessmentType, setAssessmentType] = useState<"clinician" | "patient">("patient");
  const [isTemplate, setIsTemplate] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [creator, setCreator] = useState<SurveyCreator | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { data: assessment, isLoading } = useQuery<Assessment>({
    queryKey: ["assessment", assessmentId],
    queryFn: async () => {
      const res = await fetch(`/api/assessments/${assessmentId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assessment");
      return res.json();
    },
    enabled: isEditing,
  });
  
  useEffect(() => {
    if (assessment) {
      setName(assessment.name);
      setDescription(assessment.description || "");
      setAssessmentType(assessment.assessmentType || "patient");
      setIsTemplate(assessment.isTemplate);
      setIsPublished(assessment.isPublished);
      
      if (creator && assessment.surveyJson) {
        creator.JSON = assessment.surveyJson;
      }
    }
  }, [assessment, creator]);
  
  useEffect(() => {
    const creatorInstance = new SurveyCreator({
      showLogicTab: true,
      isAutoSave: false,
      showTranslationTab: false,
      showEmbeddedSurveyTab: false,
    });
    
    creatorInstance.JSON = assessment?.surveyJson || {
      pages: [
        {
          name: "page1",
          elements: [
            {
              type: "radiogroup",
              name: "pain_level",
              title: "How would you rate your current pain level?",
              choices: [
                { value: 0, text: "No pain" },
                { value: 1, text: "Mild" },
                { value: 2, text: "Moderate" },
                { value: 3, text: "Severe" },
                { value: 4, text: "Very severe" },
              ],
            },
          ],
        },
      ],
    };
    
    setCreator(creatorInstance);
    
    return () => {
      creatorInstance.dispose();
    };
  }, []);
  
  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; assessmentType: string; surveyJson: object; isTemplate: boolean; isPublished: boolean }) => {
      const url = isEditing ? `/api/assessments/${assessmentId}` : "/api/assessments";
      const method = isEditing ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      toast({
        title: isEditing ? "Assessment Updated" : "Assessment Created",
        description: `${data.name} has been saved successfully.`,
      });
      setLocation("/assessments");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSave = useCallback(() => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a name for the assessment.",
        variant: "destructive",
      });
      return;
    }
    
    if (!creator) return;
    
    saveMutation.mutate({
      name,
      description,
      assessmentType,
      surveyJson: creator.JSON,
      isTemplate,
      isPublished,
    });
  }, [name, description, assessmentType, creator, isTemplate, isPublished, saveMutation, toast]);
  
  if (isEditing && isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/assessments")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold">
                {isEditing ? "Edit Assessment" : "Create Assessment"}
              </h1>
              <p className="text-muted-foreground">
                Build your assessment using the visual editor below.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (creator) {
                  const previewWindow = window.open("", "_blank");
                  if (previewWindow) {
                    previewWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Assessment Preview</title>
                          <link href="https://unpkg.com/survey-core/defaultV2.min.css" rel="stylesheet" />
                          <script src="https://unpkg.com/survey-core/survey.core.min.js"></script>
                          <script src="https://unpkg.com/survey-js-ui/survey-js-ui.min.js"></script>
                        </head>
                        <body>
                          <div id="surveyContainer"></div>
                          <script>
                            const survey = new Survey.Model(${JSON.stringify(creator.JSON)});
                            survey.render("surveyContainer");
                          </script>
                        </body>
                      </html>
                    `);
                  }
                }
              }}
              data-testid="button-preview"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              data-testid="button-save"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Assessment
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
            <CardDescription>Basic information about your assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Pain Assessment Questionnaire"
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this assessment measures..."
                  className="h-10"
                  data-testid="input-description"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Assessment Type</Label>
              <RadioGroup
                value={assessmentType}
                onValueChange={(value) => setAssessmentType(value as "clinician" | "patient")}
                className="flex gap-6"
                data-testid="radio-assessment-type"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="patient" id="type-patient" data-testid="radio-patient" />
                  <Label htmlFor="type-patient" className="font-normal cursor-pointer">
                    <span className="font-medium">Patient</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      - Sent to patients for at-home completion
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="clinician" id="type-clinician" data-testid="radio-clinician" />
                  <Label htmlFor="type-clinician" className="font-normal cursor-pointer">
                    <span className="font-medium">Clinician</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      - Conducted during patient visits to guide content recommendations
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="isTemplate"
                  checked={isTemplate}
                  onCheckedChange={setIsTemplate}
                  data-testid="switch-template"
                />
                <Label htmlFor="isTemplate" className="text-sm">
                  System Template (visible to all clinicians)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isPublished"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                  data-testid="switch-published"
                />
                <Label htmlFor="isPublished" className="text-sm">
                  Published (available for patient invites)
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Survey Editor</CardTitle>
                <CardDescription>
                  Add questions, configure logic, and design your assessment
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                data-testid="button-expand-editor"
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Expand
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {creator && !isFullscreen && (
              <div className="h-[600px]" data-testid="survey-creator">
                <SurveyCreatorComponent creator={creator} />
              </div>
            )}
            {isFullscreen && (
              <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                Editor is in fullscreen mode
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Scoring & Recommendations Section */}
        {assessmentType === "clinician" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Connecting to Content Recommendations
              </CardTitle>
              <CardDescription>
                Learn how assessment results drive content recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="how-it-works">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      How does the recommendation engine work?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        The recommendation engine connects assessment responses to content through 
                        <strong> recommendation rules</strong> that you configure:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 ml-2">
                        <li>
                          <strong>Create recommendation rules:</strong> Go to the Recommendation Rules 
                          page to define which content should appear based on assessment responses.
                        </li>
                        <li>
                          <strong>Rules match tags to content:</strong> Each rule specifies a tag name 
                          (matching your question names) and a score threshold. When the assessment 
                          produces a high score for that tag, the linked content is recommended.
                        </li>
                        <li>
                          <strong>Content must have tags:</strong> Ensure your content items in the 
                          library have appropriate tags that match your assessment question names or 
                          rule configurations.
                        </li>
                      </ol>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-blue-700 dark:text-blue-300 font-medium">Quick Start</p>
                        <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                          1. Name questions descriptively (e.g., "fear_avoidance", "sleep_quality")
                          <br />
                          2. Create recommendation rules linking those question names to content
                          <br />
                          3. Test with the "Guide Me to Create Packet" flow in the Content Library
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="question-naming">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Best practices for question naming
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm">
                      <p className="text-muted-foreground">
                        Use descriptive, tag-like names for your questions to enable automatic scoring:
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="font-medium text-green-700 dark:text-green-300 mb-2">Good Names</p>
                          <ul className="text-sm space-y-1 text-green-600 dark:text-green-400">
                            <li>• fear_avoidance</li>
                            <li>• central_sensitivity</li>
                            <li>• sleep_quality</li>
                            <li>• stress_level</li>
                            <li>• movement_confidence</li>
                          </ul>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
                          <p className="font-medium text-red-700 dark:text-red-300 mb-2">Avoid</p>
                          <ul className="text-sm space-y-1 text-red-600 dark:text-red-400">
                            <li>• question1</li>
                            <li>• q_pain</li>
                            <li>• item_3</li>
                            <li>• rating_scale</li>
                            <li>• untitled</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Recommendation Rules</p>
                    <p className="text-sm text-muted-foreground">
                      Create rules to map specific score ranges to content items
                    </p>
                  </div>
                  <Link href="/admin/recommendations">
                    <a className="inline-flex items-center gap-2 text-primary hover:underline text-sm">
                      <LinkIcon className="w-4 h-4" />
                      Manage Recommendation Rules
                    </a>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Fullscreen Modal */}
      {isFullscreen && creator && (
        <div 
          className="fixed inset-0 z-50 bg-background" 
          data-testid="fullscreen-editor"
          role="dialog"
          aria-modal="true"
          aria-label="Survey Editor Fullscreen"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsFullscreen(false);
            }
          }}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
              <div>
                <h2 className="text-xl font-semibold">Survey Editor</h2>
                <p className="text-sm text-muted-foreground">
                  {name || "Untitled Assessment"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(false)}
                  data-testid="button-exit-fullscreen"
                >
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Exit Fullscreen
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(false)}
                  data-testid="button-close-fullscreen"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <SurveyCreatorComponent creator={creator} />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
