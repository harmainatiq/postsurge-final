import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Wand2, Calendar, Zap, CheckCircle } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="container py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">PostForge AI</span>
          </div>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="h-4 w-4" />
            AI-Powered Social Media Content
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Generate 30 Social Posts
            <span className="block text-primary mt-2">In Minutes, Not Hours</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Define your brand voice, generate bulk social media posts with AI, and schedule them across Facebook, LinkedIn, and Twitter through Zapier integration.
          </p>

          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => window.location.href = getLoginUrl()}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Brand Guidelines</CardTitle>
                <CardDescription>
                  Define your tone, style, and content preferences once. AI generates posts that match your brand voice perfectly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Wand2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Bulk AI Generation</CardTitle>
                <CardDescription>
                  Generate 30 unique, engaging social media posts on any topic in seconds. Edit and customize before scheduling.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Zapier Integration</CardTitle>
                <CardDescription>
                  Send selected posts to Zapier for automated scheduling across Facebook, LinkedIn, and Twitter.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Simple 4-Step Process</h2>
          
          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Set Your Brand Voice",
                description: "Define your tone, style, target audience, and content preferences. This ensures every post matches your brand identity."
              },
              {
                step: "2",
                title: "Generate Posts",
                description: "Enter a topic and let AI create 30 unique, engaging posts tailored to your brand guidelines."
              },
              {
                step: "3",
                title: "Review & Edit",
                description: "Select the posts you love, edit any content, and mark them for scheduling."
              },
              {
                step: "4",
                title: "Schedule with Zapier",
                description: "Send selected posts to your Zapier webhook for automated scheduling across all platforms."
              }
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="max-w-4xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="py-12 text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to Transform Your Social Media?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join creators and marketers who are saving hours every week with AI-powered content generation.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => window.location.href = getLoginUrl()}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Generating Posts
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2026 PostForge AI. Built for creators, marketers, and entrepreneurs.</p>
        </div>
      </footer>
    </div>
  );
}
