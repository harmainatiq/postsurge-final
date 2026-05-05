import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, Sparkles, ExternalLink } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [bundleApiKey, setBundleApiKey] = useState("");
  const [bundleTeamId, setBundleTeamId] = useState("");
  const [tone, setTone] = useState("");
  const [style, setStyle] = useState("");
  const [, setLocation] = useLocation();

  const utils = trpc.useUtils();
  const updateNameMutation = trpc.settings.updateName.useMutation();
  const initSettingsMutation = trpc.settings.initSettings.useMutation();
  const saveBundleMutation = trpc.settings.saveBundleCredentials.useMutation();
  const createGuidelinesMutation = trpc.brandGuidelines.create.useMutation();

  const handleNameSubmit = async () => {
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    try {
      await updateNameMutation.mutateAsync({ name: name.trim() });
      await initSettingsMutation.mutateAsync();
      await utils.settings.get.invalidate();
      setStep(2);
    } catch {
      toast.error("Failed to save name");
    }
  };

  const handleBundleSubmit = async () => {
    if (!bundleApiKey.trim() || !bundleTeamId.trim()) {
      toast.error("Please enter both API Key and Team ID");
      return;
    }
    try {
      await saveBundleMutation.mutateAsync({ apiKey: bundleApiKey.trim(), teamId: bundleTeamId.trim() });
      await utils.settings.get.invalidate();
      setStep(3);
    } catch {
      toast.error("Failed to save credentials");
    }
  };

  const handleGuidelinesSubmit = async () => {
    if (!tone.trim() || !style.trim()) {
      toast.error("Please fill in both fields");
      return;
    }
    try {
      await createGuidelinesMutation.mutateAsync({
        tone: tone.trim(),
        style: style.trim(),
      });
      toast.success("Setup complete!");
      setLocation("/dashboard");
    } catch {
      toast.error("Failed to save guidelines");
    }
  };

  const handleSkip = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 flex items-center justify-center font-bold transition-colors ${
                    step >= s
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      step > s ? "bg-foreground" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Your Name</span>
            <span>Social Accounts</span>
            <span>Brand Guidelines</span>
          </div>
        </div>

        <Card className="p-8">
          {/* Step 1: Name */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6" />
                <h1 className="text-3xl font-bold">Welcome to PostForge AI</h1>
              </div>
              <p className="text-muted-foreground mb-6">
                Let's get you set up. First, what should we call you?
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                  />
                </div>
                <Button
                  onClick={handleNameSubmit}
                  className="w-full"
                  disabled={updateNameMutation.isPending}
                >
                  {updateNameMutation.isPending ? "Saving..." : "Continue"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: bundle.social credentials */}
          {step === 2 && (
            <div>
              <h1 className="text-3xl font-bold mb-4">Connect Your Social Accounts</h1>
              <p className="text-muted-foreground mb-6">
                PostForge AI uses bundle.social to publish your posts to Facebook, LinkedIn,
                Twitter/X, and Instagram.
              </p>

              <div className="bg-muted rounded-lg p-5 space-y-3 mb-6 text-sm">
                <p className="font-semibold">How to get your credentials:</p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>
                    Go to{" "}
                    <a
                      href="https://app.bundle.social"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      app.bundle.social <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    and create a free account
                  </li>
                  <li>Connect your Facebook, LinkedIn, Twitter/X, and Instagram accounts</li>
                  <li>Copy your <strong>API Key</strong> from Settings → API Keys</li>
                  <li>Copy your <strong>Team ID</strong> from Settings → Team</li>
                </ol>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="pk_live_..."
                    value={bundleApiKey}
                    onChange={(e) => setBundleApiKey(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="team-id">Team ID</Label>
                  <Input
                    id="team-id"
                    type="text"
                    placeholder="team_..."
                    value={bundleTeamId}
                    onChange={(e) => setBundleTeamId(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>
                    I'll do this later
                  </Button>                  <Button
                    className="flex-1"
                    onClick={handleBundleSubmit}
                    disabled={saveBundleMutation.isPending}
                  >
                    {saveBundleMutation.isPending ? "Saving..." : "Done, Continue"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Brand Guidelines */}
          {step === 3 && (
            <div>
              <h1 className="text-3xl font-bold mb-4">Set Your Brand Voice</h1>
              <p className="text-muted-foreground mb-6">
                Help our AI understand your brand so every post sounds like you. You can update
                this anytime.
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="tone">Brand Tone</Label>
                  <Input
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="e.g., Professional, Friendly, Casual, Authoritative"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How should your posts sound?
                  </p>
                </div>

                <div>
                  <Label htmlFor="style">Content Style</Label>
                  <Textarea
                    id="style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="e.g., Educational, Inspirational, Promotional, Story-driven"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    What type of content do you want to create?
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setLocation("/dashboard")}
                  >
                    Skip for Now
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleGuidelinesSubmit}
                    disabled={createGuidelinesMutation.isPending}
                  >
                    {createGuidelinesMutation.isPending ? "Saving..." : "Complete Setup"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
