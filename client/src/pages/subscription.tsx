import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Check, CreditCard, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SubscriptionPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"plan" | "payment">("plan");

  const handleSubscribe = () => {
    setIsLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Subscription Activated",
        description: "Welcome to RehabPilot Pro! You now have full access.",
      });
      // In a real app, this would update user state context
      setLocation("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 font-serif text-2xl font-bold text-primary">
            <Activity className="w-8 h-8" />
            <span>RehabPilot</span>
          </div>
          <h1 className="text-3xl font-serif font-bold">Complete Your Registration</h1>
          <p className="text-muted-foreground">Select a plan to activate your account.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <Card className={`relative transition-all cursor-pointer border-2 ${step === "plan" ? "border-primary shadow-lg" : "border-gray-200"}`} onClick={() => setStep("plan")}>
            {step === "plan" && <div className="absolute top-4 right-4 text-primary"><Check className="w-6 h-6" /></div>}
            <CardHeader>
              <CardTitle>Professional</CardTitle>
              <CardDescription>Everything you need for a solo practice.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-6">$29<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <ul className="space-y-3">
                {[
                  "Unlimited Patient Invites",
                  "Full Content Library Access",
                  "Automated Scoring",
                  "Email Support",
                  "Custom Branding"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => setStep("payment")} disabled={step === "payment"}>Select Plan</Button>
            </CardFooter>
          </Card>

          {/* Payment Form (Simulated Stripe) */}
          <Card className={`border-2 transition-all ${step === "payment" ? "border-primary shadow-lg" : "border-gray-200 opacity-60"}`}>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Secure payment via Stripe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cardholder Name</Label>
                <Input placeholder="Dr. Sarah Mitchell" disabled={step !== "payment"} />
              </div>
              <div className="space-y-2">
                <Label>Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="4242 4242 4242 4242" className="pl-10" disabled={step !== "payment"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry</Label>
                  <Input placeholder="MM/YY" disabled={step !== "payment"} />
                </div>
                <div className="space-y-2">
                  <Label>CVC</Label>
                  <Input placeholder="123" type="password" disabled={step !== "payment"} />
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded flex items-center gap-2 text-xs text-muted-foreground mt-4">
                <Shield className="w-3 h-3" />
                Payments are processed securely. We never store your card details.
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleSubscribe} disabled={step !== "payment" || isLoading}>
                {isLoading ? "Processing..." : "Pay $29.00 & Activate"}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="text-center">
           <Link href="/auth">
             <Button variant="link" className="text-muted-foreground">Return to Login</Button>
           </Link>
        </div>
      </div>
    </div>
  );
}
