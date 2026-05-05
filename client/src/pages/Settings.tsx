import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, LogOut, Save, ExternalLink, CheckCircle2, History as HistoryIcon } from "lucide-react";
import { useLocation } from "wouter";
import { NotificationBell } from "@/components/NotificationBell";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const [userName, setUserName] = useState(user?.name ?? "");
  const [apiKey, setApiKey] = useState("");
  const [teamId, setTeamId] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingBundle, setIsSavingBundle] = useState(false);

  const { data: settings, isLoading: settingsLoading, refetch } = trpc.settings.get.useQuery();
  const updateName = trpc.settings.updateName.useMutation();
  const saveBundleCreds = trpc.settings.saveBundleCredentials.useMutation();

  // Pre-fill fields if already saved (mask the api key)
  useEffect(() => {
    if (settings?.bundleSocialTeamId && settings.bundleSocialTeamId !== "_pending_") {
      setTeamId(settings.bundleSocialTeamId);
    }
  }, [settings]);

  if (loading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSaveName = async () => {
    if (!userName) { toast.error("Please enter your name"); return; }
    try {
      setIsSavingName(true);
      await updateName.mutateAsync({ name: userName });
      toast.success("Name updated");
      window.location.reload();
    } catch {
      toast.error("Failed to update name");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveBundleCredentials = async () => {
    if (!apiKey || !teamId) {
      toast.error("Please enter both API Key and Team ID");
      return;
    }
    try {
      setIsSavingBundle(true);
      await saveBundleCreds.mutateAsync({ apiKey, teamId });
      await refetch();
      setApiKey(""); // clear after save for security
      toast.success("bundle.social credentials saved");
    } catch {
      toast.error("Failed to save credentials");
    } finally {
      setIsSavingBundle(false);
    }
  };

  const isConfigured = !!(
    settings?.bundleSocialTeamId &&
    settings.bundleSocialTeamId !== "_pending_" &&
    settings?.bundleSocialApiKey &&
    settings.bundleSocialApiKey !== "_pending_"
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/dashboard")}>
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">PostForge AI</span>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={() => setLocation("/history")}>
                <HistoryIcon className="h-4 w-4 mr-2" />
                History
              </Button>
              <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and integrations</p>
        </div>

        <div className="space-y-6">
          {/* Account */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                  <Button onClick={handleSaveName} disabled={isSavingName}>
                    {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" />Save</>}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted" />
                <p className="text-sm text-muted-foreground">Email cannot be changed</p>
              </div>
            </CardContent>
          </Card>

          {/* bundle.social */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                bundle.social Integration
                {isConfigured && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </CardTitle>
              <CardDescription>
                Connect your bundle.social account to publish posts to Facebook, LinkedIn, Twitter/X, and Instagram.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConfigured && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    ✓ Connected
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1 font-mono">
                    API Key: {settings.bundleSocialApiKey}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 font-mono">
                    Team ID: {settings.bundleSocialTeamId}
                  </p>
                </div>
              )}

              <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
                <p className="font-medium">How to get your credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Go to <a href="https://app.bundle.social" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">app.bundle.social <ExternalLink className="h-3 w-3" /></a> and log in</li>
                  <li>Connect your social accounts (FB, LinkedIn, Twitter, Instagram)</li>
                  <li>Copy <strong>API Key</strong> from Settings → API Keys</li>
                  <li>Copy <strong>Team ID</strong> from Settings → Team</li>
                </ol>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder={isConfigured ? "••••••••••••• (already saved)" : "pk_live_..."}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-id">Team ID</Label>
                  <Input
                    id="team-id"
                    type="text"
                    placeholder="team_..."
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveBundleCredentials} disabled={isSavingBundle} className="w-full">
                  {isSavingBundle ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {isConfigured ? "Update Credentials" : "Save Credentials"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
