import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { contentItems } from "@/lib/mockData";
import { Activity, Mail, ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PatientResults() {
  // Mock recommendations based on "Central Sensitivity"
  const recommendations = contentItems.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary">
            <Activity className="w-6 h-6" />
            <span>RehabPilot</span>
          </div>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Email me this plan
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Hero Result */}
        <section className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Badge className="bg-secondary/50 text-secondary-foreground hover:bg-secondary mb-2 px-4 py-1 text-sm rounded-full">Assessment Complete</Badge>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">
            Your Personalized Recovery Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Based on your responses, we've curated a set of educational modules to help you understand your pain and move with confidence.
          </p>
        </section>

        {/* Focus Areas */}
        <section className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Central Sensitivity", desc: "Understanding why pain persists after healing." },
            { title: "Sleep Hygiene", desc: "Optimizing rest for nervous system recovery." },
            { title: "Movement Confidence", desc: "Breaking the fear-avoidance cycle." },
          ].map((area, i) => (
            <Card key={i} className="bg-gray-50 border-none shadow-none">
              <CardContent className="p-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">
                  {i + 1}
                </div>
                <h3 className="font-bold text-lg mb-2">{area.title}</h3>
                <p className="text-sm text-muted-foreground">{area.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Recommended Modules */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif font-bold">Recommended Learning</h2>
          </div>
          
          <div className="grid gap-6">
            {recommendations.map((item) => (
              <div key={item.id} className="group flex flex-col md:flex-row gap-6 bg-white border rounded-xl p-4 hover:shadow-lg transition-all hover:border-primary/30 cursor-pointer">
                <div className="w-full md:w-48 aspect-video md:aspect-auto bg-muted rounded-lg overflow-hidden shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-2">
                  <div className="flex gap-2 mb-1">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-xs font-medium text-secondary-foreground bg-secondary/30 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-xl font-serif font-bold group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.summary}</p>
                </div>
                <div className="flex items-center px-4">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
