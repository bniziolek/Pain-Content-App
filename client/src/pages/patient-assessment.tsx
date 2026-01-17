import { useState, useCallback, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Loader2, AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";

interface AssessmentInvite {
  id: string;
  assessmentId: string;
  patientEmail: string;
  status: string;
}

interface Assessment {
  id: string;
  name: string;
  description: string | null;
  surveyJson: object;
}

export default function PatientAssessment() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/assessment/invite/:token");
  const [isDemoRoute] = useRoute("/assessment/demo");
  const token = params?.token;
  const isDemo = isDemoRoute;
  
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  
  const { data: invite, isLoading: inviteLoading, error: inviteError } = useQuery<AssessmentInvite>({
    queryKey: ["assessment-invite", token],
    queryFn: async () => {
      const res = await fetch(`/api/assessment-invites/token/${token}`);
      if (!res.ok) throw new Error("Assessment invite not found");
      return res.json();
    },
    enabled: !!token && !isDemo,
  });
  
  const { data: assessment, isLoading: assessmentLoading, error: assessmentError } = useQuery<Assessment>({
    queryKey: ["assessment", invite?.assessmentId],
    queryFn: async () => {
      const res = await fetch(`/api/assessments/${invite!.assessmentId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Assessment not found");
      return res.json();
    },
    enabled: !!invite?.assessmentId,
  });
  
  const submitMutation = useMutation({
    mutationFn: async (answers: object) => {
      const res = await fetch(`/api/assessment-invites/${invite!.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Failed to submit assessment");
      return res.json();
    },
    onSuccess: () => {
      setLocation("/assessment/results");
    },
  });
  
  useEffect(() => {
    if (assessment?.surveyJson || isDemo) {
      const surveyJson = isDemo ? getDemoSurvey() : assessment!.surveyJson;
      const model = new Model(surveyJson);
      
      model.onComplete.add((sender) => {
        const answers = sender.data;
        if (isDemo) {
          setLocation("/assessment/results");
        } else {
          submitMutation.mutate(answers);
        }
      });
      
      model.applyTheme({
        cssVariables: {
          "--sjs-primary-backcolor": "rgba(37, 99, 235, 1)",
          "--sjs-primary-backcolor-light": "rgba(37, 99, 235, 0.1)",
          "--sjs-primary-forecolor": "rgba(255, 255, 255, 1)",
          "--sjs-base-unit": "8px",
          "--sjs-corner-radius": "8px",
          "--sjs-font-family": "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
        }
      });
      
      setSurveyModel(model);
    }
  }, [assessment, isDemo, submitMutation, setLocation]);
  
  if (!isDemo && (inviteLoading || assessmentLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-8">
          <Activity className="w-6 h-6" />
          <span>DriverPath</span>
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading your assessment...</p>
      </div>
    );
  }
  
  if (!isDemo && (inviteError || assessmentError)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-8">
          <Activity className="w-6 h-6" />
          <span>DriverPath</span>
        </div>
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
            <p className="text-muted-foreground">
              This assessment link may have expired or is no longer valid. 
              Please contact your healthcare provider for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (invite?.status === "completed" && !isDemo) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-8">
          <Activity className="w-6 h-6" />
          <span>DriverPath</span>
        </div>
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Already Completed</h2>
            <p className="text-muted-foreground">
              You have already completed this assessment. Your responses have been recorded.
            </p>
            <Button className="mt-6" onClick={() => setLocation("/assessment/results")}>
              View Results
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-8">
        <Activity className="w-6 h-6" />
        <span>DriverPath</span>
      </div>

      <div className="w-full max-w-3xl">
        {assessment && !isDemo && (
          <div className="text-center mb-6">
            <h1 className="text-2xl font-serif font-bold">{assessment.name}</h1>
            {assessment.description && (
              <p className="text-muted-foreground mt-2">{assessment.description}</p>
            )}
          </div>
        )}
        
        {isDemo && (
          <div className="text-center mb-6">
            <h1 className="text-2xl font-serif font-bold">Pain Assessment Demo</h1>
            <p className="text-muted-foreground mt-2">
              This is a demonstration of our patient assessment system.
            </p>
          </div>
        )}

        <Card className="border-none shadow-lg overflow-hidden" data-testid="survey-container">
          <CardContent className="p-0">
            {surveyModel && (
              <Survey model={surveyModel} />
            )}
          </CardContent>
        </Card>
        
        {submitMutation.isPending && (
          <div className="flex items-center justify-center mt-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Submitting your responses...
          </div>
        )}
      </div>
    </div>
  );
}

function getDemoSurvey() {
  return {
    title: "Pain Assessment",
    showProgressBar: "top",
    pages: [
      {
        name: "page1",
        title: "About Your Pain",
        elements: [
          {
            type: "rating",
            name: "pain_intensity",
            title: "On a scale of 0-10, how would you rate your current pain level?",
            rateMin: 0,
            rateMax: 10,
            minRateDescription: "No pain",
            maxRateDescription: "Worst pain imaginable",
            isRequired: true,
          },
          {
            type: "checkbox",
            name: "pain_location",
            title: "Where do you experience pain? (Select all that apply)",
            choices: [
              "Lower back",
              "Upper back",
              "Neck",
              "Shoulders",
              "Hips",
              "Knees",
              "Ankles/Feet",
              "Other",
            ],
            isRequired: true,
          },
        ],
      },
      {
        name: "page2",
        title: "Pain Characteristics",
        elements: [
          {
            type: "radiogroup",
            name: "pain_duration",
            title: "How long have you been experiencing this pain?",
            choices: [
              "Less than 1 week",
              "1-4 weeks",
              "1-3 months",
              "3-6 months",
              "More than 6 months",
            ],
            isRequired: true,
          },
          {
            type: "radiogroup",
            name: "pain_pattern",
            title: "How would you describe your pain pattern?",
            choices: [
              "Constant - present all the time",
              "Intermittent - comes and goes",
              "Activity-related - only with certain movements",
              "Time-related - worse at certain times of day",
            ],
            isRequired: true,
          },
        ],
      },
      {
        name: "page3",
        title: "Impact on Daily Life",
        elements: [
          {
            type: "matrix",
            name: "daily_activities",
            title: "How much does your pain affect the following activities?",
            columns: [
              { value: 0, text: "Not at all" },
              { value: 1, text: "Slightly" },
              { value: 2, text: "Moderately" },
              { value: 3, text: "Severely" },
            ],
            rows: [
              { value: "sleep", text: "Sleeping" },
              { value: "work", text: "Working or daily tasks" },
              { value: "exercise", text: "Exercise or physical activity" },
              { value: "mood", text: "Mood and emotions" },
              { value: "social", text: "Social activities" },
            ],
            isRequired: true,
          },
        ],
      },
      {
        name: "page4",
        title: "Your Beliefs About Pain",
        elements: [
          {
            type: "radiogroup",
            name: "pain_cause_belief",
            title: "What do you believe is the primary cause of your pain?",
            choices: [
              "Physical injury or damage",
              "Wear and tear / aging",
              "Stress and tension",
              "Poor posture or movement habits",
              "I'm not sure",
            ],
            isRequired: true,
          },
          {
            type: "boolean",
            name: "fear_movement",
            title: "Do you worry that physical activity might make your pain worse?",
            isRequired: true,
          },
        ],
      },
    ],
    completedHtml: "<h3>Thank you for completing this assessment!</h3><p>Your healthcare provider will review your responses and create a personalized care plan for you.</p>",
  };
}
