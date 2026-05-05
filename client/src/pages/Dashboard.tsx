import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, Sparkles, Wand2, FileText, Settings, LogOut,
  PenLine, ImageIcon, CalendarClock, Send, BookOpen, Users, Tag, CheckCircle2, History as HistoryIcon
} from "lucide-react";
import { useLocation } from "wouter";
import { NotificationBell } from "@/components/NotificationBell";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: posts, isLoading: postsLoading } = trpc.posts.list.useQuery();
  const { data: guidelines, isLoading: guidelinesLoading } = trpc.brandGuidelines.get.useQuery();

  if (loading || postsLoading || guidelinesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPosts = posts?.length || 0;
  const selectedPosts = posts?.filter(p => p.isSelected).length || 0;
  const publishedPosts = posts?.filter(p => p.isScheduled).length || 0;
  const pendingScheduledPosts = posts?.filter(p => !p.isScheduled && !!p.scheduledFor).length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">PostForge AI</span>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={() => setLocation("/history")}>
                <HistoryIcon className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <span className="text-sm text-muted-foreground">
                {user?.name || user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your social media content and brand guidelines
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Posts</CardDescription>
              <CardTitle className="text-3xl">{totalPosts}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">All generated posts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Selected</CardDescription>
              <CardTitle className="text-3xl">{selectedPosts}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Ready to publish</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Published</CardDescription>
              <CardTitle className="text-3xl">{publishedPosts}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sent to social media
                {pendingScheduledPosts > 0 && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">
                    · {pendingScheduledPosts} scheduled
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Card
            className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setLocation("/generate")}
          >
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 flex items-center justify-center mb-4">
                <Wand2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Generate New Posts</CardTitle>
              <CardDescription>
                Create AI-powered social media posts on any topic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Wand2 className="mr-2 h-4 w-4" />
                Start Generating
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setLocation("/posts")}
          >
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Manage Posts</CardTitle>
              <CardDescription>
                View, edit, and select posts for publishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                View All Posts
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setLocation("/brand-guidelines")}
          >
            <CardHeader>
              <div className="h-12 w-12 bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Brand Guidelines</CardTitle>
              <CardDescription>
                {guidelines
                  ? "Update your brand voice and preferences"
                  : "Set up your brand voice for better AI results"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                {guidelines ? "Edit Guidelines" : "Set Up Guidelines"}
              </Button>
            </CardContent>
          </Card>

          {!guidelines && (
            <Card className="border-2 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
              <CardHeader>
                <CardTitle className="text-amber-900 dark:text-amber-100">Get Started</CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  Set up your brand guidelines first for the best AI-generated content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => setLocation("/brand-guidelines")}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Set Up Brand Guidelines
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Guide Sections ── */}

        {/* 1. How to Generate Posts */}
        <Card className="mb-6 border-2">
          <CardHeader className="border-b bg-muted/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-bold text-sm">1</span>
              </div>
              <div>
                <CardTitle className="text-lg">How to Generate Posts</CardTitle>
                <CardDescription>
                  Create high-quality AI posts tailored to your brand in three steps
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* Step 1 */}
              <div className="border p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground text-xs font-bold">1</span>
                  </div>
                  <h4 className="font-semibold text-sm">Enter Your Topic</h4>
                </div>
                <div className="flex items-start gap-2 mb-2">
                  <PenLine className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Type in the topic you want posts about — be specific for better results.
                    e.g. <span className="italic">"Sales funnel for SaaS"</span>
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="border p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground text-xs font-bold">2</span>
                  </div>
                  <h4 className="font-semibold text-sm">Configure Settings</h4>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Number of posts (up to 30)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Minimum word count per post
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                    Toggle AI image generation
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground text-xs font-bold">3</span>
                  </div>
                  <h4 className="font-semibold text-sm">Review &amp; Select</h4>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Browse generated posts, edit content inline, select your favourites,
                    then publish or schedule them.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={() => setLocation("/generate")} className="gap-2">
              <Wand2 className="h-4 w-4" />
              Generate Posts Now
            </Button>
          </CardContent>
        </Card>

        {/* 2. How to Set Up Brand Guidelines */}
        <Card className="mb-6 border-2">
          <CardHeader className="border-b bg-muted/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-bold text-sm">2</span>
              </div>
              <div>
                <CardTitle className="text-lg">How to Set Up Brand Guidelines</CardTitle>
                <CardDescription>
                  Train the AI to write in your brand voice so every post feels on-brand
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="border p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-primary shrink-0" />
                  <h4 className="font-semibold text-sm">Define Your Tone &amp; Style</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose the tone (professional, casual, witty) and writing style that represents
                  your brand personality.
                </p>
              </div>

              <div className="border p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-5 w-5 text-primary shrink-0" />
                  <h4 className="font-semibold text-sm">Add Keywords</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add keywords you always want included in posts, and specify words or phrases
                  to avoid to keep your content consistent.
                </p>
              </div>

              <div className="border p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-primary shrink-0" />
                  <h4 className="font-semibold text-sm">Define Target Audience</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Describe who your audience is — their role, industry, and pain points — so
                  every post resonates with the right people.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setLocation("/brand-guidelines")}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              {guidelines ? "Update Brand Guidelines" : "Set Up Brand Guidelines"}
            </Button>
          </CardContent>
        </Card>

        {/* 3. How to Publish Posts */}
        <Card className="mb-6 border-2">
          <CardHeader className="border-b bg-muted/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-bold text-sm">3</span>
              </div>
              <div>
                <CardTitle className="text-lg">How to Publish Posts</CardTitle>
                <CardDescription>
                  Connect your social accounts and publish directly to Facebook, LinkedIn,
                  Twitter/X, and Instagram
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="border p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground text-xs font-bold">1</span>
                  </div>
                  <h4 className="font-semibold text-sm">Connect Accounts</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add your bundle.social API Key &amp; Team ID in <span className="font-medium">Settings</span> to
                  link your social media accounts.
                </p>
              </div>

              <div className="border p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground text-xs font-bold">2</span>
                  </div>
                  <h4 className="font-semibold text-sm">Select Posts</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  In <span className="font-medium">Manage Posts</span>, tick the checkbox on
                  each post you want to publish.
                </p>
              </div>

              <div className="border p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 bg-primary flex items-center justify-center shrink-0">
                    <CalendarClock className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <h4 className="font-semibold text-sm">Pick Platforms &amp; Time</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose which platforms to post on and optionally schedule a future
                  publish date &amp; time.
                </p>
              </div>

              <div className="border p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 bg-primary flex items-center justify-center shrink-0">
                    <Send className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <h4 className="font-semibold text-sm">Publish</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Hit <span className="font-medium">Publish Now</span> or schedule it — your
                  posts go live across all selected platforms automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setLocation("/posts")} className="gap-2">
                <Send className="h-4 w-4" />
                Go to Posts
              </Button>
              <Button variant="outline" onClick={() => setLocation("/settings")} className="gap-2">
                <Settings className="h-4 w-4" />
                Connect Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
