import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Send, Sparkles, CheckCircle, AlertCircle, BookOpen, Target, TrendingUp, FileText } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

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

interface AssessmentResults {
  invite: {
    id: string;
    patientEmail: string;
    status: string;
    sentAt: string;
    completedAt: string | null;
  };
  assessment: {
    id: string;
    name: string;
  } | null;
  response: {
    id: string;
    tagScores: TagScore[];
    answers: Record<string, any>;
    createdAt: string;
  };
  recommendations: Recommendation[];
}

export default function AssessmentResultsPage() {
  const params = useParams<{ inviteId: string }>();
  const inviteId = params.inviteId || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  
  const { data: results, isLoading, error } = useQuery<AssessmentResults>({
    queryKey: ["assessment-results", inviteId],
    queryFn: async () => {
      const res = await fetch(`/api/assessment-invites/${inviteId}/results`, {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch results");
      }
      return res.json();
    },
    enabled: !!inviteId,
  });

  const sendContentMutation = useMutation({
    mutationFn: async (contentIds: string[]) => {
      const res = await fetch("/api/send-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patientEmail: results?.invite.patientEmail,
          contentIds,
          subject: `Your Personalized Recovery Content from DriverPath`,
        }),
      });
      if (!res.ok) throw new Error("Failed to send content");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Sent",
        description: `Recommendations sent to ${results?.invite.patientEmail}`,
      });
      setSelectedContent([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleContent = (contentId: string) => {
    setSelectedContent(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const selectAllRecommendations = () => {
    if (results?.recommendations) {
      setSelectedContent(results.recommendations.map(r => r.contentId));
    }
  };

  const handleSendSelected = () => {
    if (selectedContent.length > 0) {
      sendContentMutation.mutate(selectedContent);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !results) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Link href="/assessments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assessments
            </Button>
          </Link>
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Results Not Available</h3>
              <p className="text-muted-foreground">
                {error?.message || "The assessment has not been completed yet."}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'rule':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Rule Match</Badge>;
      case 'pathway':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Pathway</Badge>;
      case 'fallback':
        return <Badge variant="secondary">Tag Match</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return "text-red-600 bg-red-50";
    if (percentage >= 40) return "text-amber-600 bg-amber-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/assessments">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assessments
              </Button>
            </Link>
            <h1 className="text-3xl font-serif font-bold">Assessment Results</h1>
            <p className="text-muted-foreground">
              {results.invite.patientEmail} • {results.assessment?.name || "Assessment"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {results.invite.completedAt && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                Completed {format(new Date(results.invite.completedAt), "MMM d, yyyy")}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Assessment Scores
                </CardTitle>
                <CardDescription>
                  Key areas identified from the assessment responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.response.tagScores && results.response.tagScores.length > 0 ? (
                  <div className="space-y-4">
                    {results.response.tagScores
                      .sort((a, b) => b.percentage - a.percentage)
                      .map((tagScore, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">
                              {tagScore.tag.replace(/_/g, " ")}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-sm font-medium ${getScoreColor(tagScore.percentage)}`}>
                              {tagScore.percentage}%
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                tagScore.percentage >= 70 ? 'bg-red-500' : 
                                tagScore.percentage >= 40 ? 'bg-amber-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${tagScore.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No scoring data available for this assessment.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Recommended Content
                    </CardTitle>
                    <CardDescription>
                      Content suggestions based on assessment results
                    </CardDescription>
                  </div>
                  {results.recommendations.length > 0 && (
                    <Button variant="outline" size="sm" onClick={selectAllRecommendations}>
                      Select All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {results.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {results.recommendations.map((rec, index) => (
                      <div 
                        key={index} 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedContent.includes(rec.contentId) 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-muted-foreground/30'
                        }`}
                        onClick={() => toggleContent(rec.contentId)}
                        data-testid={`recommendation-${rec.contentId}`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={selectedContent.includes(rec.contentId)}
                            onCheckedChange={() => toggleContent(rec.contentId)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="font-medium">{rec.contentTitle}</h4>
                              {getSourceBadge(rec.source)}
                              <Badge variant="outline" className="text-xs">
                                {rec.tag.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            {rec.contentSummary && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {rec.contentSummary}
                              </p>
                            )}
                            {rec.rationale && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                {rec.rationale}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recommendations generated for this assessment.</p>
                    <p className="text-sm mt-1">
                      Ask your administrator to configure recommendation rules.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Send to Patient
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select recommended content and send it to your patient via email.
                </p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Patient Email</p>
                  <p className="text-sm text-muted-foreground">{results.invite.patientEmail}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Selected Content</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedContent.length} item{selectedContent.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleSendSelected}
                  disabled={selectedContent.length === 0 || sendContentMutation.isPending}
                  data-testid="button-send-content"
                >
                  {sendContentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Selected Content
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Assessment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assessment</span>
                  <span className="font-medium">{results.assessment?.name || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span className="font-medium">
                    {format(new Date(results.invite.sentAt), "MMM d, yyyy")}
                  </span>
                </div>
                {results.invite.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">
                      {format(new Date(results.invite.completedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Focus Areas</span>
                  <span className="font-medium">{results.response.tagScores?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recommendations</span>
                  <span className="font-medium">{results.recommendations.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
