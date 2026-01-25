import { useState, useEffect, useCallback } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Loader2, Search, BookOpen, Video, Sparkles, Clock, ArrowRight, AlertCircle, CheckCircle, X } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  type: 'article' | 'video' | 'interactive';
  summary: string;
  imageUrl: string | null;
  readTime: string | null;
  tags: string[];
  body?: string;
}

interface LookupResult {
  valid: boolean;
  reason?: 'not_found' | 'expired' | 'inactive';
  error?: string;
  content?: ContentItem[];
  clinicianName?: string;
  expiresAt?: string;
}

function ContentTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'video':
      return <Video className="w-5 h-5 text-teal-600" />;
    case 'interactive':
      return <Sparkles className="w-5 h-5 text-amber-500" />;
    default:
      return <BookOpen className="w-5 h-5 text-blue-600" />;
  }
}

function ContentCard({ content, onCardClick }: { content: ContentItem; onCardClick: (contentId: string) => void }) {
  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      data-testid={`card-content-${content.id}`}
      onClick={() => onCardClick(content.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick(content.id);
        }
      }}
    >
      <div className="flex">
        {content.imageUrl && (
          <div className="w-24 h-24 flex-shrink-0">
            <img 
              src={content.imageUrl} 
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ContentTypeIcon type={content.type} />
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              {content.type}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1" data-testid={`text-content-title-${content.id}`}>
            {content.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {content.summary}
          </p>
          {content.readTime && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{content.readTime}</span>
            </div>
          )}
        </div>
        <div className="flex items-center pr-4">
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
}

export default function LookupPage() {
  const searchString = useSearch();
  const urlCode = new URLSearchParams(searchString).get('code');
  
  const [code, setCode] = useState(urlCode || "");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  const handleContentClick = (contentId: string) => {
    const content = result?.content?.find(c => c.id === contentId);
    if (content) {
      setSelectedContent(content);
    }
  };

  const handleLookup = useCallback(async (lookupCode?: string) => {
    const codeToLookup = (lookupCode || code).trim().toUpperCase();
    
    if (!codeToLookup) {
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const response = await fetch(`/api/public/lookup/${encodeURIComponent(codeToLookup)}`);
      
      if (!response.ok) {
        let errorMessage = "An unexpected error occurred. Please try again.";

        if (response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (response.status === 404) {
          errorMessage = "Code not found. Please check the code and try again.";
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage = "There was a problem with your request. Please verify the code and try again.";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      setResult(data);
    } catch (error: unknown) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      // Fetch typically throws TypeError on network failure
      if (error instanceof TypeError) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      setResult({
        valid: false,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (urlCode) {
      handleLookup(urlCode);
    }
  }, [urlCode, handleLookup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup();
  };

  const formatCode = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    return cleaned;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Activity className="h-8 w-8 text-teal-600" />
          <span className="text-xl font-semibold text-gray-900">DriverPath</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Your Educational Content
          </h1>
          <p className="text-muted-foreground">
            Enter the access code from your printed materials to view videos, articles, and interactive resources.
          </p>
        </div>

        <Card className="max-w-lg mx-auto mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-teal-600" />
              Enter Your Access Code
            </CardTitle>
            <CardDescription>
              Find the code on your printed packet (e.g., HEAL-7X4K)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(formatCode(e.target.value))}
                placeholder="XXXX-XXXX"
                className="text-center text-lg font-mono tracking-wider uppercase"
                maxLength={10}
                data-testid="input-access-code"
                aria-label="Access code"
              />
              <Button 
                type="submit" 
                disabled={isLoading || code.length < 4}
                data-testid="button-lookup"
                aria-label={isLoading ? "Loading" : "Look Up"}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Look Up"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {hasSearched && !isLoading && result && (
          <div className="mt-8">
            {result.valid && result.content ? (
              <div>
                <div className="flex items-center justify-center gap-2 mb-6 text-teal-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Content from {result.clinicianName || "your healthcare provider"}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {result.content.map((item) => (
                    <ContentCard key={item.id} content={item} onCardClick={handleContentClick} />
                  ))}
                </div>
                
                {result.expiresAt && (
                  <p className="text-center text-sm text-muted-foreground mt-6">
                    This content will be available until{" "}
                    {new Date(result.expiresAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            ) : (
              <Card className="max-w-lg mx-auto border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800 mb-1" data-testid="text-error-title">
                        {result.reason === 'expired' 
                          ? "Access Code Expired"
                          : result.reason === 'inactive'
                            ? "Access Code Inactive"
                            : "Access Code Not Found"}
                      </h3>
                      <p className="text-sm text-red-700" data-testid="text-error-message">
                        {result.error || "Please check your code and try again."}
                      </p>
                      {result.reason === 'expired' && (
                        <p className="text-sm text-red-600 mt-2">
                          Contact your healthcare provider for a new access code.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="text-center mt-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Enter your access code above to view your personalized educational content.</p>
          </div>
        )}
      </main>

      <footer className="border-t bg-white mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Powered by DriverPath - Evidence-Based Patient Education</p>
        </div>
      </footer>

      {/* Content viewer modal */}
      {selectedContent && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedContent(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ContentTypeIcon type={selectedContent.type} />
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  {selectedContent.type}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedContent(null)}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {selectedContent.imageUrl && (
              <div className="w-full h-64 overflow-hidden">
                <img
                  src={selectedContent.imageUrl}
                  alt={selectedContent.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="px-6 py-6">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-4">
                {selectedContent.title}
              </h2>
              
              {selectedContent.readTime && (
                <div className="flex items-center gap-1 mb-4 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{selectedContent.readTime}</span>
                </div>
              )}
              
              {selectedContent.tags && selectedContent.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedContent.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {selectedContent.summary}
                </p>
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {selectedContent.body}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
