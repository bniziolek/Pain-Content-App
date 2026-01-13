import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, ArrowLeft, ArrowRight, ClipboardList, Sparkles, Download, Printer, Check, FileText } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { SurveyModel } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";

interface Assessment {
  id: string;
  name: string;
  description: string | null;
  assessmentType: "clinician" | "patient";
  surveyJson: object;
  isPublished: boolean;
}

interface TagScore {
  tag: string;
  score: number;
  maxPossible: number;
  percentage: number;
}

interface Recommendation {
  contentId: string;
  contentTitle: string;
  contentSummary: string;
  tag: string;
  priority: number;
  rationale: string | null;
  matchScore: number;
  source: 'rule' | 'pathway' | 'fallback';
}

interface ContentItem {
  id: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

type Step = "select" | "execute" | "recommendations" | "packet";

export default function ContentPacketGuidePage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("select");
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [patientName, setPatientName] = useState("");
  const [tagScores, setTagScores] = useState<TagScore[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem[]>([]);
  const [surveyModel, setSurveyModel] = useState<SurveyModel | null>(null);

  const { data: assessments = [], isLoading: loadingAssessments } = useQuery<Assessment[]>({
    queryKey: ["assessments", "clinician"],
    queryFn: async () => {
      const res = await fetch("/api/assessments?type=clinician&published=true", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return res.json();
    },
  });

  const { data: allContent = [] } = useQuery<ContentItem[]>({
    queryKey: ["content"],
    queryFn: async () => {
      const res = await fetch("/api/content", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
  });

  const getRecommendationsMutation = useMutation({
    mutationFn: async (scores: TagScore[]) => {
      const res = await fetch("/api/recommendations/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tagScores: scores,
          assessmentId: selectedAssessment?.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to get recommendations");
      return res.json();
    },
    onSuccess: (data) => {
      setRecommendations(data.recommendations || []);
      const ids = (data.recommendations || []).map((r: Recommendation) => r.contentId);
      setSelectedContentIds(ids);
      setStep("recommendations");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    const model = new SurveyModel(assessment.surveyJson as any);
    model.onComplete.add((sender) => {
      handleAssessmentComplete(sender.data);
    });
    setSurveyModel(model);
  };

  const handleStartAssessment = () => {
    if (!selectedAssessment) return;
    setStep("execute");
  };

  const handleAssessmentComplete = async (answers: Record<string, any>) => {
    try {
      const res = await fetch("/api/assessments/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          assessmentId: selectedAssessment?.id,
          answers,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to score assessment");
      }
      
      const data = await res.json();
      setTagScores(data.tagScores || []);
      getRecommendationsMutation.mutate(data.tagScores || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process assessment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleContent = (contentId: string) => {
    setSelectedContentIds((prev) =>
      prev.includes(contentId)
        ? prev.filter((id) => id !== contentId)
        : [...prev, contentId]
    );
  };

  const handleProceedToPacket = () => {
    const selected = allContent.filter((c) => selectedContentIds.includes(c.id));
    setSelectedContent(selected);
    setStep("packet");
  };

  const handlePrint = () => {
    window.print();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {["select", "execute", "recommendations", "packet"].map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s
                ? "bg-primary text-primary-foreground"
                : ["select", "execute", "recommendations", "packet"].indexOf(step) > i
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {["select", "execute", "recommendations", "packet"].indexOf(step) > i ? (
              <Check className="w-4 h-4" />
            ) : (
              i + 1
            )}
          </div>
          {i < 3 && (
            <div
              className={`w-12 h-0.5 mx-1 ${
                ["select", "execute", "recommendations", "packet"].indexOf(step) > i
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderSelectStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Select Assessment
          </CardTitle>
          <CardDescription>
            Choose a clinician assessment to conduct with your patient. The results will guide content recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientName">Patient Name (optional)</Label>
            <Input
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name for the packet header"
              data-testid="input-patient-name"
            />
          </div>
          
          {loadingAssessments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No clinician assessments available.</p>
              <p className="text-sm mt-2">
                Create a clinician assessment in the{" "}
                <Link href="/assessments/builder" className="text-primary underline">
                  Assessment Builder
                </Link>
                .
              </p>
            </div>
          ) : (
            <RadioGroup
              value={selectedAssessment?.id || ""}
              onValueChange={(id) => {
                const assessment = assessments.find((a) => a.id === id);
                if (assessment) handleSelectAssessment(assessment);
              }}
              data-testid="radio-assessment-select"
            >
              <div className="grid gap-3">
                {assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAssessment?.id === assessment.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleSelectAssessment(assessment)}
                  >
                    <RadioGroupItem
                      value={assessment.id}
                      id={`assessment-${assessment.id}`}
                      className="mt-1"
                      data-testid={`radio-assessment-${assessment.id}`}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`assessment-${assessment.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {assessment.name}
                      </Label>
                      {assessment.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {assessment.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Link href="/library">
          <Button variant="outline" data-testid="button-back-library">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </Link>
        <Button
          onClick={handleStartAssessment}
          disabled={!selectedAssessment}
          data-testid="button-start-assessment"
        >
          Start Assessment
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderExecuteStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            {selectedAssessment?.name}
          </CardTitle>
          <CardDescription>
            Complete the assessment with your patient to generate personalized content recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {surveyModel && (
            <div className="survey-container" data-testid="survey-container">
              <Survey model={surveyModel} />
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-start">
        <Button
          variant="outline"
          onClick={() => setStep("select")}
          data-testid="button-back-select"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Selection
        </Button>
      </div>
    </div>
  );

  const renderRecommendationsStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Assessment Results & Recommendations
          </CardTitle>
          <CardDescription>
            Based on the assessment, here are the recommended content items. Select the ones to include in the patient's packet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {tagScores.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Assessment Scores</h4>
              <div className="flex flex-wrap gap-2">
                {tagScores.map((ts) => (
                  <Badge
                    key={ts.tag}
                    variant={ts.percentage >= 60 ? "default" : "secondary"}
                  >
                    {ts.tag}: {Math.round(ts.percentage)}%
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recommended Content ({recommendations.length})</h4>
            {recommendations.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No specific recommendations generated. You can manually select content from the library.
              </p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 pr-4">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.contentId}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedContentIds.includes(rec.contentId)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleContent(rec.contentId)}
                    >
                      <Checkbox
                        checked={selectedContentIds.includes(rec.contentId)}
                        onCheckedChange={() => toggleContent(rec.contentId)}
                        data-testid={`checkbox-content-${rec.contentId}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{rec.contentTitle}</span>
                          <Badge variant="outline" className="text-xs">
                            {rec.source}
                          </Badge>
                        </div>
                        {rec.contentSummary && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {rec.contentSummary}
                          </p>
                        )}
                        {rec.rationale && (
                          <p className="text-xs text-primary mt-1 italic">
                            {rec.rationale}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep("execute")}
          data-testid="button-back-execute"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assessment
        </Button>
        <Button
          onClick={handleProceedToPacket}
          disabled={selectedContentIds.length === 0}
          data-testid="button-create-packet"
        >
          Create Content Packet ({selectedContentIds.length})
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderPacketStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Content Packet Ready
              </CardTitle>
              <CardDescription>
                Review and print or download the personalized content packet for your patient.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} data-testid="button-print-packet">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handlePrint} data-testid="button-download-packet">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="print-content border rounded-lg p-6 bg-white" id="packet-content">
            <div className="text-center mb-8 border-b pb-4">
              <h1 className="text-2xl font-bold text-primary">DriverPath</h1>
              <h2 className="text-xl mt-2">Personalized Education Packet</h2>
              {patientName && (
                <p className="text-lg mt-2">Prepared for: {patientName}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            
            <div className="space-y-8">
              {selectedContent.map((content, index) => (
                <div key={content.id} className="page-break-inside-avoid">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold">{content.title}</h3>
                  </div>
                  {content.tags?.length > 0 && (
                    <div className="flex gap-1 mb-2">
                      {content.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground mb-2">{content.summary}</p>
                    <div dangerouslySetInnerHTML={{ __html: content.body || "" }} />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
              <p>This educational content is provided by Health Drivers Institute / DriverPath</p>
              <p>For questions, please contact your healthcare provider.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep("recommendations")}
          data-testid="button-back-recommendations"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Recommendations
        </Button>
        <Link href="/library">
          <Button data-testid="button-done">
            <Check className="w-4 h-4 mr-2" />
            Done
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Create Content Packet</h1>
          <p className="text-muted-foreground">
            Use a guided assessment to generate personalized content recommendations for your patient.
          </p>
        </div>
        
        {renderStepIndicator()}
        
        {step === "select" && renderSelectStep()}
        {step === "execute" && renderExecuteStep()}
        {step === "recommendations" && renderRecommendationsStep()}
        {step === "packet" && renderPacketStep()}
      </div>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #packet-content, #packet-content * {
            visibility: visible;
          }
          #packet-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
