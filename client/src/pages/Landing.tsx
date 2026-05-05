import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl, getRegisterUrl } from "@/const";
import { Sparkles, Target, Calendar, TrendingUp, Clock, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              <span className="text-xl font-bold">PostForge AI</span>
            </div>
            <div className="flex items-center gap-4">
              <a href={getLoginUrl()} className="text-sm text-muted-foreground hover:text-foreground">
                Log in
              </a>
              <Button asChild>
                <a href={getRegisterUrl()}>Get Started Free</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              AI-Powered Social Media for{" "}
              <span className="text-primary">Facebook Business Pages</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Generate 30 brand-aligned posts in minutes, schedule automatically, and reclaim hours every week. Built for businesses who want consistency without the chaos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild className="text-lg px-8 py-6">
                <a href={getRegisterUrl()}>Start Creating Posts</a>
              </Button>
              <p className="text-sm text-muted-foreground">No credit card required • Free to start</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
            <Card className="p-6 text-center">
              <div className="text-4xl font-bold mb-2">30</div>
              <div className="text-muted-foreground">Posts Generated in Minutes</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-4xl font-bold mb-2">10+</div>
              <div className="text-muted-foreground">Hours Saved Per Week</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-muted-foreground">Brand Consistency</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need to Scale Your Facebook Presence</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From content creation to scheduling, we handle the heavy lifting so you can focus on growing your business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="flex flex-col">
              <div className="mb-6">
                <img 
                  src="/ai-automation.webp" 
                  alt="AI Content Generation" 
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">AI-Powered Post Generation</h3>
                  <p className="text-muted-foreground">
                    Generate 30 unique, engaging posts in one click. Our AI understands your brand voice and creates content that resonates with your audience.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col">
              <div className="mb-6">
                <img 
                  src="/facebook-management.png" 
                  alt="Brand Guidelines" 
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Brand Guidelines Setup</h3>
                  <p className="text-muted-foreground">
                    Define your tone, style, and content preferences once. Every post generated will perfectly match your brand identity.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col">
              <div className="mb-6">
                <img 
                  src="/scheduling-calendar.png" 
                  alt="Automated Scheduling" 
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Smart Scheduling</h3>
                  <p className="text-muted-foreground">
                    Schedule posts to publish at optimal times. Set it and forget it—our system automatically sends posts to your Facebook page via Zapier.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col">
              <div className="mb-6">
                <div className="w-full h-64 bg-muted flex items-center justify-center">
                  <TrendingUp className="w-24 h-24 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Post Editing & Curation</h3>
                  <p className="text-muted-foreground">
                    Review, edit, and select the best posts before scheduling. Full control over what goes live on your Facebook business page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">Why Businesses Choose PostForge AI</h2>
            
            <div className="space-y-8">
              <Card className="p-8">
                <div className="flex items-start gap-4">
                  <Clock className="w-8 h-8 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Save 10+ Hours Every Week</h3>
                    <p className="text-muted-foreground text-lg">
                      Stop spending hours brainstorming, writing, and scheduling posts manually. Generate a month's worth of content in minutes and focus on what really matters—growing your business.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-start gap-4">
                  <Target className="w-8 h-8 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Maintain Perfect Brand Consistency</h3>
                    <p className="text-muted-foreground text-lg">
                      Every post matches your brand voice, tone, and style. No more inconsistent messaging or off-brand content. Your audience gets a cohesive experience every time.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-start gap-4">
                  <Zap className="w-8 h-8 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Post Consistently Without the Stress</h3>
                    <p className="text-muted-foreground text-lg">
                      Never miss a posting day again. Schedule weeks of content in advance and let automation handle the rest. Your Facebook page stays active even when you're busy.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">Meet the Founder</h2>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <img 
                  src="/founder.jpg" 
                  alt="Founder" 
                  className="w-full h-auto"
                />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-4">Lorem Ipsum</h3>
                <p className="text-lg text-muted-foreground mb-4">
                  Founder & Production Architect
                </p>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Hamza is a Production Architect who builds AI-powered digital production systems that help teams ship products and services faster than traditional agencies.
                  </p>
                  <p>
                    With a 15-member in-house team based in Faisalabad, Pakistan, Hamza operates a multi-brand ecosystem focused on speed, systems, AI leverage, and authority-driven growth.
                  </p>
                  <p>
                    PostForge AI was born from the need to help businesses maintain consistent social media presence without the manual overhead. By combining AI with smart automation, we're changing how businesses approach Facebook content creation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center bg-primary/5 p-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Facebook Marketing?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join businesses who are saving hours every week with AI-powered content creation and scheduling.
            </p>
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <a href={getRegisterUrl()}>Get Started Free</a>
            </Button>
            <p className="text-sm text-muted-foreground mt-4">No credit card required • Set up in minutes</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2026 PostForge AI. Built for Facebook business pages.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
