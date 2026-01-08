import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft, CheckCircle2, Send, BookOpen, ClipboardList, BarChart3, Settings, HelpCircle } from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  description: string;
  icon: typeof Send;
  position?: "top" | "bottom" | "left" | "right";
  action?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='dashboard']",
    title: "Welcome to Your Dashboard",
    description: "This is your home base. See your activity stats, recent sends, and patients needing follow-up all in one place.",
    icon: BarChart3,
    position: "bottom",
  },
  {
    target: "[data-tour='send-content']",
    title: "Send Content to Patients",
    description: "Click here to browse your content library and send educational materials to patients via email.",
    icon: Send,
    position: "bottom",
    action: "Click to explore",
  },
  {
    target: "[data-tour='nav-library']",
    title: "Content Library",
    description: "Access your full library of evidence-based patient education materials. Select content to send to patients.",
    icon: BookOpen,
    position: "right",
  },
  {
    target: "[data-tour='nav-assessments']",
    title: "Assessments",
    description: "Create and manage patient assessments. Build custom questionnaires or use templates to understand patient needs.",
    icon: ClipboardList,
    position: "right",
  },
  {
    target: "[data-tour='nav-history']",
    title: "Patient History",
    description: "Track all your patient interactions. See who opened content, completed assessments, and who might need follow-up.",
    icon: BarChart3,
    position: "right",
  },
  {
    target: "[data-tour='nav-settings']",
    title: "Settings",
    description: "Manage your profile, email delivery preferences, and subscription. You can also replay this tour from here anytime!",
    icon: Settings,
    position: "right",
  },
];

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

interface TourProviderProps {
  children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem("rehabpilot_tour_completed", "true");
  }, []);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem("rehabpilot_tour_completed", "true");
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      endTour();
    }
  }, [currentStep, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  return (
    <TourContext.Provider value={{ isActive, currentStep, startTour, endTour, nextStep, prevStep, skipTour }}>
      {children}
      {isActive && <TourOverlay />}
    </TourContext.Provider>
  );
}

function TourOverlay() {
  const { currentStep, nextStep, prevStep, skipTour, endTour } = useTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    const findTarget = () => {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    findTarget();
    const timeout = setTimeout(findTarget, 100);
    return () => clearTimeout(timeout);
  }, [step.target, currentStep]);

  const getTooltipPosition = () => {
    if (!targetRect) return { top: "50%", left: "50%" };

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (step.position) {
      case "bottom":
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2))}px`,
        };
      case "top":
        return {
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2))}px`,
        };
      case "left":
        return {
          top: `${Math.max(padding, targetRect.top + targetRect.height / 2 - tooltipHeight / 2)}px`,
          left: `${targetRect.left - tooltipWidth - padding}px`,
        };
      case "right":
      default:
        return {
          top: `${Math.max(padding, targetRect.top + targetRect.height / 2 - tooltipHeight / 2)}px`,
          left: `${targetRect.right + padding}px`,
        };
    }
  };

  const StepIcon = step.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return createPortal(
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]" 
        onClick={skipTour}
        data-testid="tour-overlay"
      />
      
      {targetRect && (
        <div
          className="fixed z-[9999] ring-4 ring-primary ring-offset-4 ring-offset-background rounded-lg pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      <Card
        className="fixed z-[10000] w-80 shadow-2xl animate-in fade-in slide-in-from-bottom-4"
        style={getTooltipPosition()}
        data-testid="tour-tooltip"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <StepIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={skipTour}
              data-testid="tour-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-lg">{step.title}</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <CardDescription className="text-sm">{step.description}</CardDescription>
        </CardContent>
        <CardFooter className="flex justify-between pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevStep}
            disabled={currentStep === 0}
            data-testid="tour-prev"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              data-testid="tour-skip"
            >
              Skip
            </Button>
            <Button
              size="sm"
              onClick={nextStep}
              data-testid="tour-next"
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>,
    document.body
  );
}

export function shouldShowTour(): boolean {
  return localStorage.getItem("rehabpilot_tour_completed") !== "true";
}

export function resetTour(): void {
  localStorage.removeItem("rehabpilot_tour_completed");
}
