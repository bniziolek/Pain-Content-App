import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, BookOpen, ClipboardCheck, Clock, Eye, Lock, CheckCircle, AlertTriangle, ShieldX, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContentItem {
  id: string;
  title: string;
  summary: string;
  readTime: string | null;
  viewToken: string;
  viewedAt: string | null;
  assignedAt: string;
  providerNote: string | null;
}

interface Assessment {
  id: string;
  token: string;
  status: string;
  createdAt: string;
}

interface PortalData {
  content: ContentItem[];
  assessments: Assessment[];
}

interface LockoutState {
  permanentlyLocked?: boolean;
  lockedUntil?: string;
  minutesRemaining?: number;
  attemptsRemaining?: number | null;
  warning?: string;
}

export default function PatientPortal() {
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [lockoutState, setLockoutState] = useState<LockoutState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setLockoutState(null);

    try {
      const res = await fetch("/api/patient-portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), accessCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Invalid email or access code");
        
        // Update lockout state from response
        setLockoutState({
          permanentlyLocked: data.permanentlyLocked,
          lockedUntil: data.lockedUntil,
          minutesRemaining: data.minutesRemaining,
          attemptsRemaining: data.attemptsRemaining,
          warning: data.warning,
        });
        
        return;
      }

      setSessionToken(data.sessionToken);
      setIsAuthenticated(true);
      sessionStorage.setItem("patientPortalToken", data.sessionToken);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = sessionStorage.getItem("patientPortalToken");
    if (savedToken) {
      setSessionToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionToken) return;

    const fetchContent = async () => {
      try {
        const res = await fetch("/api/patient-portal/content", {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            sessionStorage.removeItem("patientPortalToken");
            setIsAuthenticated(false);
            setSessionToken(null);
            toast({
              title: "Session Expired",
              description: "Please log in again.",
              variant: "destructive",
            });
          }
          return;
        }

        const data = await res.json();
        setPortalData(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load your content.",
          variant: "destructive",
        });
      }
    };

    fetchContent();
  }, [sessionToken, toast]);

  const handleLogout = () => {
    sessionStorage.removeItem("patientPortalToken");
    setIsAuthenticated(false);
    setSessionToken(null);
    setPortalData(null);
    setEmail("");
    setAccessCode("");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center py-12 px-4">
        <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary mb-8">
          <Activity className="w-6 h-6" />
          <span>DriverPath</span>
        </div>

        <Card className="w-full max-w-md shadow-lg border-none">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-serif">Patient Portal</CardTitle>
            <CardDescription>
              Enter your email and the access code from your provider's email to view your educational content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lockoutState?.permanentlyLocked ? (
              <Alert variant="destructive" className="mb-4" data-testid="alert-permanent-lockout">
                <ShieldX className="h-4 w-4" />
                <AlertTitle>Access Permanently Locked</AlertTitle>
                <AlertDescription>
                  This access code has been permanently locked due to too many failed attempts. 
                  Please contact your healthcare provider to request new access to your content.
                </AlertDescription>
              </Alert>
            ) : lockoutState?.minutesRemaining ? (
              <Alert variant="destructive" className="mb-4" data-testid="alert-temp-lockout">
                <Timer className="h-4 w-4" />
                <AlertTitle>Temporarily Locked</AlertTitle>
                <AlertDescription>
                  Too many failed attempts. Please try again in {lockoutState.minutesRemaining} minute{lockoutState.minutesRemaining > 1 ? 's' : ''}.
                </AlertDescription>
              </Alert>
            ) : errorMessage ? (
              <Alert variant="destructive" className="mb-4" data-testid="alert-error">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                  {errorMessage}
                  {lockoutState?.warning && (
                    <p className="mt-2 font-semibold text-amber-200">{lockoutState.warning}</p>
                  )}
                  {lockoutState?.attemptsRemaining !== undefined && lockoutState?.attemptsRemaining !== null && lockoutState.attemptsRemaining > 0 && (
                    <p className="mt-1 text-sm opacity-80">
                      {lockoutState.attemptsRemaining} attempt{lockoutState.attemptsRemaining !== 1 ? 's' : ''} remaining before lockout.
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={lockoutState?.permanentlyLocked || !!lockoutState?.minutesRemaining}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  disabled={lockoutState?.permanentlyLocked || !!lockoutState?.minutesRemaining}
                  className="text-center text-2xl tracking-widest font-mono"
                  data-testid="input-access-code"
                />
                <p className="text-xs text-muted-foreground text-center">
                  The 6-digit code was sent to you via email
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || lockoutState?.permanentlyLocked || !!lockoutState?.minutesRemaining}
                data-testid="button-login"
              >
                {isLoading ? "Verifying..." : "Access My Content"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-8 text-sm text-muted-foreground text-center max-w-md">
          This secure portal protects your health information. Only you can access your educational materials using the unique code sent to your email.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
            <Activity className="w-5 h-5" />
            <span>DriverPath</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold text-gray-900">Your Health Education</h1>
          <p className="text-muted-foreground">
            Content and assessments assigned by your healthcare provider
          </p>
        </div>

        {portalData?.content && portalData.content.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2>Educational Content</h2>
              <span className="text-sm font-normal text-muted-foreground">
                ({portalData.content.length} {portalData.content.length === 1 ? 'item' : 'items'})
              </span>
            </div>

            <div className="grid gap-4">
              {portalData.content.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`card-content-${item.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {item.viewedAt ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-2">{item.summary}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {item.readTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.readTime}
                            </span>
                          )}
                          {item.viewedAt && (
                            <span className="text-green-600 font-medium">Viewed</span>
                          )}
                        </div>
                      </div>
                      <Link href={`/view/${item.viewToken}`}>
                        <Button variant={item.viewedAt ? "outline" : "default"} size="sm" data-testid={`button-view-${item.id}`}>
                          {item.viewedAt ? "Review" : "Read Now"}
                        </Button>
                      </Link>
                    </div>
                    {item.providerNote && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground italic">
                          <strong>Note from your provider:</strong> {item.providerNote}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {portalData?.assessments && portalData.assessments.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              <h2>Assessments</h2>
            </div>

            <div className="grid gap-4">
              {portalData.assessments.map((assessment) => (
                <Card key={assessment.id} className="overflow-hidden" data-testid={`card-assessment-${assessment.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">Health Assessment</h3>
                        <p className="text-sm text-muted-foreground">
                          Status: <span className={assessment.status === 'completed' ? 'text-green-600' : 'text-amber-600'}>
                            {assessment.status === 'completed' ? 'Completed' : 'Pending'}
                          </span>
                        </p>
                      </div>
                      {assessment.status !== 'completed' && (
                        <Link href={`/assessment/invite/${assessment.token}`}>
                          <Button data-testid={`button-start-assessment-${assessment.id}`}>
                            Start Assessment
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {(!portalData || (portalData.content.length === 0 && portalData.assessments.length === 0)) && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No content or assessments have been assigned to you yet.</p>
              <p className="text-sm mt-2">Check back later or contact your healthcare provider.</p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t mt-16 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Your health information is protected and secure.</p>
          <p className="mt-1">DriverPath - Evidence-Based Patient Education</p>
        </div>
      </footer>
    </div>
  );
}
