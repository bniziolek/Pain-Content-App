import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { assessmentQuestions } from "@/lib/mockData";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, ArrowLeft, Check, Activity } from "lucide-react";

export default function PatientAssessment() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [, setLocation] = useLocation();

  const question = assessmentQuestions[currentStep];
  const isLastQuestion = currentStep === assessmentQuestions.length - 1;

  const handleNext = () => {
    if (isLastQuestion) {
      setLocation("/assessment/results");
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const progress = ((currentStep + 1) / assessmentQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* Brand */}
      <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-8">
        <Activity className="w-6 h-6" />
        <span>RehabPilot</span>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-8 sm:p-12 min-h-[400px] flex flex-col justify-between">
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 key={currentStep}">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Question {currentStep + 1} of {assessmentQuestions.length}
              </span>
              
              <h2 className="text-2xl sm:text-3xl font-serif leading-tight">
                {question.text}
              </h2>

              <div className="pt-4">
                {question.type === 'scale' && (
                  <div className="space-y-6">
                    <Slider 
                      defaultValue={[5]} 
                      max={10} 
                      step={1} 
                      className="py-4"
                      onValueChange={(val) => setAnswers({...answers, [question.id]: val[0]})}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground font-medium">
                      <span>{question.minLabel}</span>
                      <span>{question.maxLabel}</span>
                    </div>
                  </div>
                )}

                {question.type === 'yes_no' && (
                  <RadioGroup 
                    onValueChange={(val) => setAnswers({...answers, [question.id]: val})}
                    className="flex flex-col space-y-3"
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-blue-50/50">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes" className="flex-1 cursor-pointer">Yes, frequently</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-blue-50/50">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no" className="flex-1 cursor-pointer">No, rarely</Label>
                    </div>
                  </RadioGroup>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-8 mt-8 border-t">
              <Button 
                variant="ghost" 
                onClick={handlePrev} 
                disabled={currentStep === 0}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext} className="px-8" size="lg">
                {isLastQuestion ? "Complete" : "Next"}
                {!isLastQuestion && <ArrowRight className="w-4 h-4 ml-2" />}
                {isLastQuestion && <Check className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
