import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { 
  Activity, 
  ArrowRight, 
  ArrowLeft,
  Mail, 
  BookOpen, 
  ClipboardList, 
  Send, 
  CheckCircle2,
  Loader2,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const STEPS = [
  { id: 0, title: "Welcome", icon: Sparkles },
  { id: 1, title: "Email Delivery", icon: Mail },
  { id: 2, title: "Explore Content", icon: BookOpen },
  { id: 3, title: "Your First Assessment", icon: ClipboardList },
  { id: 4, title: "Send Your First Content", icon: Send },
  { id: 5, title: "All Set!", icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (user && !hasInitialized) {
      const savedStep = user.onboardingStep || 0;
      setCurrentStep(Math.min(savedStep, STEPS.length - 1));
      setHasInitialized(true);
    }
  }, [user, hasInitialized]);

  const { data: content } = useQuery({
    queryKey: ["/api/content"],
    enabled: currentStep === 2,
  });

  const { data: assessments } = useQuery({
    queryKey: ["/api/assessments"],
    enabled: currentStep === 3,
  });

  const updateOnboarding = useMutation({
    mutationFn: async (data: { onboardingStep?: number; onboardingCompleted?: boolean }) => {
      const res = await apiRequest("PATCH", "/api/onboarding", data);
      return res.json();
    },
    onSuccess: () => {
      refreshUser();
    },
  });

  const skipOnboarding = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/onboarding/skip");
      return res.json();
    },
    onSuccess: () => {
      refreshUser();
      toast({ title: "Onboarding skipped", description: "You can always explore features from the dashboard." });
      setLocation("/dashboard");
    },
  });

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await updateOnboarding.mutateAsync({ onboardingStep: nextStep });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    await updateOnboarding.mutateAsync({ onboardingCompleted: true, onboardingStep: STEPS.length });
    toast({ title: "Welcome to RehabPilot!", description: "Your setup is complete. Let's get started!" });
    setLocation("/dashboard");
  };

  const handleSkip = () => {
    skipOnboarding.mutate();
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-8 justify-center">
          <Activity className="w-6 h-6" />
          <span>RehabPilot</span>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            {(() => {
              const StepIcon = STEPS[currentStep].icon;
              return (
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <StepIcon className="w-8 h-8 text-primary" />
                </div>
              );
            })()}
            <CardTitle className="text-2xl font-serif">{STEPS[currentStep].title}</CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            {currentStep === 0 && <WelcomeStep />}
            {currentStep === 1 && <EmailStep />}
            {currentStep === 2 && <ContentStep content={content} />}
            {currentStep === 3 && <AssessmentStep assessments={assessments} />}
            {currentStep === 4 && <SendStep />}
            {currentStep === 5 && <CompleteStep />}
          </CardContent>

          <CardFooter className="flex justify-between pt-6">
            <div>
              {currentStep > 0 && currentStep < STEPS.length - 1 && (
                <Button variant="ghost" onClick={handleBack} data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {currentStep < STEPS.length - 1 && (
                <Button variant="ghost" onClick={handleSkip} data-testid="button-skip">
                  Skip for now
                </Button>
              )}
              
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={handleNext} disabled={updateOnboarding.isPending} data-testid="button-next">
                  {updateOnboarding.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={updateOnboarding.isPending} data-testid="button-complete">
                  {updateOnboarding.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="space-y-4 text-center">
      <CardDescription className="text-base">
        Welcome to RehabPilot! We'll help you get set up in just a few minutes.
      </CardDescription>
      <div className="grid gap-3 text-left max-w-md mx-auto">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Mail className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <div className="font-medium">Email delivery included</div>
            <div className="text-sm text-muted-foreground">We handle sending content to patients</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <BookOpen className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <div className="font-medium">Explore the content library</div>
            <div className="text-sm text-muted-foreground">Evidence-based patient education</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <ClipboardList className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <div className="font-medium">Set up your first assessment</div>
            <div className="text-sm text-muted-foreground">Understand your patients better</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailStep() {
  return (
    <div className="space-y-4 text-center">
      <CardDescription className="text-base">
        RehabPilot handles all email delivery for you automatically. No setup required!
      </CardDescription>
      <div className="p-4 rounded-lg border bg-muted/30 max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Mail className="w-5 h-5 text-primary" />
          <span className="font-medium">Automatic Email Delivery</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          When you send content or assessments to patients, RehabPilot delivers them securely on your behalf. Emails appear professional and are sent from our secure email service.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          <span>Email delivery is ready</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        All emails include your name so patients know who sent them.
      </p>
    </div>
  );
}

function ContentStep({ content }: { content?: any }) {
  const contentCount = content?.length || 0;
  
  return (
    <div className="space-y-4 text-center">
      <CardDescription className="text-base">
        Your content library is ready with evidence-based patient education materials.
      </CardDescription>
      <div className="p-4 rounded-lg border bg-muted/30 max-w-md mx-auto">
        <div className="text-3xl font-bold text-primary mb-1">{contentCount}</div>
        <div className="text-sm text-muted-foreground">Educational modules available</div>
      </div>
      {contentCount > 0 && (
        <div className="grid gap-2 max-w-md mx-auto text-left">
          {content?.slice(0, 3).map((item: any) => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="truncate">{item.title}</span>
            </div>
          ))}
          {contentCount > 3 && (
            <div className="text-xs text-muted-foreground text-center">
              +{contentCount - 3} more modules
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Browse and manage content from the Library page.
      </p>
    </div>
  );
}

function AssessmentStep({ assessments }: { assessments?: any }) {
  const templates = assessments?.templates || [];
  const templateCount = templates.length;
  
  return (
    <div className="space-y-4 text-center">
      <CardDescription className="text-base">
        Use assessment templates to understand patient needs, or build your own custom assessments.
      </CardDescription>
      <div className="p-4 rounded-lg border bg-muted/30 max-w-md mx-auto">
        <div className="text-3xl font-bold text-primary mb-1">{templateCount}</div>
        <div className="text-sm text-muted-foreground">Assessment templates ready</div>
      </div>
      {templateCount > 0 && (
        <div className="grid gap-2 max-w-md mx-auto text-left">
          {templates.slice(0, 3).map((item: any) => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
              <ClipboardList className="w-4 h-4 text-primary" />
              <span className="truncate">{item.name}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Create custom assessments with our visual builder.
      </p>
    </div>
  );
}

function SendStep() {
  return (
    <div className="space-y-4 text-center">
      <CardDescription className="text-base">
        Sending content to patients is simple. Here's how it works:
      </CardDescription>
      <div className="grid gap-3 max-w-md mx-auto text-left">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</div>
          <div>
            <div className="font-medium">Select content</div>
            <div className="text-sm text-muted-foreground">Choose educational modules from your library</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</div>
          <div>
            <div className="font-medium">Enter patient email</div>
            <div className="text-sm text-muted-foreground">Add a personal note if you'd like</div>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</div>
          <div>
            <div className="font-medium">Patient receives secure access</div>
            <div className="text-sm text-muted-foreground">They get a unique code to view content</div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Track engagement from your dashboard and send history.
      </p>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="space-y-4 text-center">
      <CardDescription className="text-base">
        You're all set! Your RehabPilot account is ready to use.
      </CardDescription>
      <div className="p-6 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 max-w-md mx-auto">
        <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
        <div className="font-medium text-lg mb-2">Setup Complete</div>
        <div className="text-sm text-muted-foreground">
          Start helping your patients with evidence-based education today.
        </div>
      </div>
      <div className="grid gap-2 max-w-sm mx-auto text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>Email connected</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>Content library ready</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>Assessments available</span>
        </div>
      </div>
    </div>
  );
}
