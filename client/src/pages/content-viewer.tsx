import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getPublicContent(id: string) {
  const res = await fetch(`/api/public/content/${id}`);
  if (!res.ok) {
    throw new Error("Content not found");
  }
  return res.json();
}

export default function ContentViewerPage() {
  const params = useParams<{ id: string }>();
  const contentId = params.id;

  const { data: content, isLoading, error } = useQuery({
    queryKey: ["public-content", contentId],
    queryFn: () => getPublicContent(contentId!),
    enabled: !!contentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Content Not Found</h2>
            <p className="text-muted-foreground">
              This content may no longer be available or the link may be invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-primary mb-2">
            <span className="text-sm font-medium">RehabPilot</span>
          </div>
          <p className="text-sm text-muted-foreground">Patient Education Resources</p>
        </div>

        <Card className="overflow-hidden">
          {content.imageUrl && (
            <div className="w-full h-64 overflow-hidden">
              <img
                src={content.imageUrl}
                alt={content.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              {content.readTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {content.readTime}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
              {content.title}
            </h1>
            {content.tags && content.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {content.tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {content.summary}
              </p>
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {content.body}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>This educational content was shared with you by your healthcare provider through RehabPilot.</p>
        </div>
      </div>
    </div>
  );
}
