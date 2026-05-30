import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Edit2, Trash2, Calendar, CheckCircle2, FileText, Send, Sparkles, LogOut, Settings as SettingsIcon, ZoomIn, X, Paintbrush, History as HistoryIcon, Video } from "lucide-react";
import { useLocation } from "wouter";
import { NotificationBell } from "@/components/NotificationBell";
import { ImageEditor, type ImageEditorPost } from "@/components/ImageEditor";

type Platform = "FACEBOOK" | "LINKEDIN" | "TWITTER" | "INSTAGRAM";

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "FACEBOOK", label: "Facebook" },
  { id: "LINKEDIN", label: "LinkedIn" },
  { id: "TWITTER", label: "Twitter / X" },
  { id: "INSTAGRAM", label: "Instagram" },
];

function PageHeader({
  userName,
  onDashboard,
  onHistory,
  onSettings,
  onLogout,
}: {
  userName: string;
  onDashboard: () => void;
  onHistory: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="border-b bg-card">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onDashboard}>
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">PostForge AI</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={onHistory}>
              <HistoryIcon className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="ghost" size="sm" onClick={onSettings}>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <span className="text-sm text-muted-foreground">{userName}</span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Posts() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split("?")[1]);
  const batchId = params.get("batch");

  const [editingPost, setEditingPost] = useState<{ id: number; content: string } | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [editingImagePost, setEditingImagePost] = useState<ImageEditorPost | null>(null);

  // Publish now dialog
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishPlatforms, setPublishPlatforms] = useState<Platform[]>(["FACEBOOK"]);

  // Schedule dialog
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [schedulePlatforms, setSchedulePlatforms] = useState<Platform[]>(["FACEBOOK"]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [currentPakistanTime, setCurrentPakistanTime] = useState("");

  const { data: allPosts, isLoading, refetch } = trpc.posts.list.useQuery();
  const updateMutation = trpc.posts.update.useMutation();
  const deleteMutation = trpc.posts.delete.useMutation();
  const publishMutation = trpc.posts.publish.useMutation();

  const posts = useMemo(() => {
    if (!allPosts) return [];
    const filtered = batchId ? allPosts.filter((p) => p.batchId === batchId) : allPosts;
    // Sort by id ASC to keep order stable regardless of updates
    return [...filtered].sort((a, b) => a.id - b.id);
  }, [allPosts, batchId]);

  const groupedPosts = useMemo(() => {
    const groups: Record<string, typeof posts> = {};
    posts.forEach((post) => {
      if (!groups[post.batchId]) groups[post.batchId] = [];
      groups[post.batchId]!.push(post);
    });
    // Sort batches by earliest post id so newest batch shows first
    return Object.fromEntries(
      Object.entries(groups).sort(([, a], [, b]) => b[0]!.id - a[0]!.id)
    );
  }, [posts]);

  useEffect(() => {
    if (editingPost) setEditedContent(editingPost.content);
  }, [editingPost]);

  useEffect(() => {
    const updateTime = () => {
      setCurrentPakistanTime(
        new Date().toLocaleString("en-PK", {
          timeZone: "Asia/Karachi",
          dateStyle: "medium",
          timeStyle: "medium",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedPosts = posts.filter((p) => p.isSelected);
  const selectedCount = selectedPosts.length;
  const selectedPostsWithoutImage = selectedPosts.filter(p => !p.imageUrl && !p.videoUrl);
  const instagramWarning = selectedPostsWithoutImage.length > 0;

  const togglePlatform = (
    platform: Platform,
    current: Platform[],
    setter: (v: Platform[]) => void
  ) => {
    setter(
      current.includes(platform)
        ? current.filter((p) => p !== platform)
        : [...current, platform]
    );
  };

  const handleToggleSelect = async (postId: number, currentlySelected: boolean) => {
    try {
      await updateMutation.mutateAsync({ id: postId, isSelected: !currentlySelected });
      refetch();
    } catch {
      toast.error("Failed to update post");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
      await updateMutation.mutateAsync({ id: editingPost.id, content: editedContent });
      refetch();
      setEditingPost(null);
      toast.success("Post updated");
    } catch {
      toast.error("Failed to update post");
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm("Delete this post?")) return;
    try {
      await deleteMutation.mutateAsync({ id: postId });
      refetch();
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  // --- Publish Now ---
  const openPublishDialog = () => {
    if (selectedCount === 0) { toast.error("Select at least one post"); return; }
    setPublishPlatforms(["FACEBOOK"]);
    setShowPublishDialog(true);
  };

  const handlePublishNow = async () => {
    if (publishPlatforms.length === 0) { toast.error("Select at least one platform"); return; }
    try {
      const result = await publishMutation.mutateAsync({
        postIds: selectedPosts.map((p) => p.id),
        platforms: publishPlatforms,
      });
      refetch();
      setShowPublishDialog(false);
      if (result.errors.length > 0 && result.sent === 0) {
        const firstError = result.errors[0]?.error ?? "Unknown error";
        const msg = firstError.includes("None of the selected platforms")
          ? "No connected platforms found. Please connect accounts in bundle.social."
          : firstError.includes("credentials")
          ? "bundle.social credentials not configured. Go to Settings."
          : `Failed: ${firstError.slice(0, 100)}`;
        toast.error(msg);
      } else if (result.errors.length > 0) {
        toast.warning(`${result.sent} published, ${result.errors.length} failed`);
      } else {
        const published = result.publishedPlatforms?.join(", ") ?? "selected platforms";
        const skipped = result.skippedPlatforms ?? [];
        const msg = skipped.length > 0
          ? `Published to: ${published} • Skipped (not connected): ${skipped.join(", ")}`
          : `${result.sent} post(s) published to ${published}`;
        skipped.length > 0 ? toast.warning(msg) : toast.success(msg);
      }
    } catch (err: any) {
      // Extract meaningful message from error
      const msg = err?.message ?? err?.data?.message ?? "Failed to publish posts";
      toast.error(msg.length > 120 ? msg.slice(0, 120) + "..." : msg);
    }
  };

  // --- Schedule ---
  const openScheduleDialog = () => {
    if (selectedCount === 0) { toast.error("Select at least one post"); return; }
    setSchedulePlatforms(["FACEBOOK"]);
    const now = new Date();
    const pkt = new Date(now.getTime() + (5 * 60 + now.getTimezoneOffset()) * 60000 + 3600000);
    setScheduleDate(pkt.toISOString().split("T")[0]!);
    setScheduleTime(pkt.toTimeString().slice(0, 5));
    setShowScheduleDialog(true);
  };

  const handleConfirmSchedule = async () => {
    if (!scheduleDate || !scheduleTime) { toast.error("Select date and time"); return; }
    if (schedulePlatforms.length === 0) { toast.error("Select at least one platform"); return; }
    try {
      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}:00+05:00`);
      const result = await publishMutation.mutateAsync({
        postIds: selectedPosts.map((p) => p.id),
        platforms: schedulePlatforms,
        scheduledFor,
      });
      refetch();
      setShowScheduleDialog(false);
      if (result.errors.length > 0 && result.sent === 0) {
        const firstError = result.errors[0]?.error ?? "Unknown error";
        const msg = firstError.includes("None of the selected platforms")
          ? "No connected platforms found. Please connect accounts in bundle.social."
          : firstError.includes("credentials")
          ? "bundle.social credentials not configured. Go to Settings."
          : `Failed: ${firstError.slice(0, 100)}`;
        toast.error(msg);
      } else if (result.errors.length > 0) {
        toast.warning(`${result.scheduled ?? result.sent} scheduled, ${result.errors.length} failed`);
      } else {
        const published = result.publishedPlatforms?.join(", ") ?? "selected platforms";
        const skipped = result.skippedPlatforms ?? [];
        const msg = skipped.length > 0
          ? `Scheduled on: ${published} for ${scheduleDate} at ${scheduleTime} PKT • Skipped (not connected): ${skipped.join(", ")}`
          : `${result.scheduled ?? result.sent} post(s) scheduled for ${scheduleDate} at ${scheduleTime} PKT on ${published}`;
        skipped.length > 0 ? toast.warning(msg) : toast.success(msg);
      }
    } catch (err: any) {
      const msg = err?.message ?? err?.data?.message ?? "Failed to schedule posts";
      toast.error(msg.length > 120 ? msg.slice(0, 120) + "..." : msg);
    }
  };

  const headerProps = {
    userName: user?.name || user?.email || "",
    onDashboard: () => setLocation("/dashboard"),
    onHistory: () => setLocation("/history"),
    onSettings: () => setLocation("/settings"),
    onLogout: logout,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader {...headerProps} />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader {...headerProps} />
        <div className="container max-w-4xl py-8">
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-lg font-medium">No posts yet</p>
                  <p className="text-sm text-muted-foreground">Generate your first batch to get started</p>
                </div>
                <Button onClick={() => setLocation("/generate")}>Generate Posts</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader {...headerProps} />

      <div className="container max-w-6xl py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Posts</h1>
            <p className="text-muted-foreground">
              {batchId ? `Batch: ${batchId}` : "All generated posts"}
            </p>
          </div>
          {selectedCount > 0 && (
            <div className="flex gap-3">
              <Button onClick={openPublishDialog} size="lg" disabled={publishMutation.isPending}>
                {publishMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Post {selectedCount} Now
              </Button>
              <Button onClick={openScheduleDialog} size="lg" variant="outline" disabled={publishMutation.isPending}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule {selectedCount} for Later
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {Object.entries(groupedPosts).map(([batchIdKey, batchPosts]) => {
            const firstPost = batchPosts[0];
            const batchSelectedCount = batchPosts.filter((p) => p.isSelected).length;
            return (
              <Card key={batchIdKey}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Topic: {firstPost?.topic}</CardTitle>
                      <CardDescription>
                        {batchPosts.length} posts • {batchSelectedCount} selected
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {new Date(firstPost?.createdAt || "").toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {batchPosts.map((post, index) => (
                      <div
                        key={post.id}
                        className="flex items-stretch border bg-card hover:bg-accent/50 transition-colors overflow-hidden"
                      >
                        {/* Image — left column, full height */}
                        {post.imageUrl && (
                          <button
                            type="button"
                            className="relative w-44 shrink-0 group focus:outline-none"
                            onClick={() => setImageModal(post.imageUrl!)}
                          >
                            <img
                              src={post.imageUrl}
                              alt="Post image"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <ZoomIn className="h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                            </div>
                          </button>
                        )}

                        {/* Video — left column, full height (shown when no image or alongside) */}
                        {(post as any).videoUrl && !post.imageUrl && (
                          <div className="relative w-44 shrink-0 bg-black flex items-center">
                            <video
                              src={(post as any).videoUrl}
                              className="w-full h-full object-cover"
                              controls
                              preload="metadata"
                              playsInline
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex items-start gap-4 p-4 flex-1 min-w-0">
                          <Checkbox
                            checked={post.isSelected}
                            onCheckedChange={() => handleToggleSelect(post.id, post.isSelected)}
                            className="mt-1 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline">Post {index + 1}</Badge>
                              {post.isScheduled && (
                                <Badge className="bg-green-600">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Published
                                </Badge>
                              )}
                              {post.scheduledFor && !post.isScheduled && (
                                <Badge variant="secondary">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {new Date(post.scheduledFor).toLocaleString("en-PK", {
                                    timeZone: "Asia/Karachi",
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })} PKT
                                </Badge>
                              )}
                              {post.platforms && (
                                <div className="flex gap-1">
                                  {(JSON.parse(post.platforms) as string[]).map((p) => (
                                    <Badge key={p} variant="outline" className="text-xs">
                                      {p}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {(post as any).videoUrl && (
                                <Badge variant="secondary" className="text-xs">
                                  <Video className="mr-1 h-3 w-3" />
                                  Video
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                            {/* Inline video player when post also has an image */}
                            {(post as any).videoUrl && post.imageUrl && (
                              <div className="mt-3">
                                <video
                                  src={(post as any).videoUrl}
                                  className="w-full max-h-40 rounded object-cover"
                                  controls
                                  preload="metadata"
                                  playsInline
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingPost({ id: post.id, content: post.content })}
                              title="Edit text"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {post.imageUrl && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingImagePost({ id: post.id, imageUrl: post.imageUrl! })}
                                title="Edit image"
                              >
                                <Paintbrush className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(post.id)}
                              title="Delete post"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Image Lightbox */}
        {imageModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setImageModal(null)}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-white hover:text-white/70 transition-colors"
              onClick={() => setImageModal(null)}
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={imageModal}
              alt="Post image"
              className="max-w-full max-h-[90vh] object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Image Editor */}
        <ImageEditor
          post={editingImagePost}
          open={!!editingImagePost}
          onClose={() => setEditingImagePost(null)}
          onSaved={() => {
            refetch();
            setEditingImagePost(null);
          }}
        />

        {/* Edit Dialog */}
        <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
              <DialogDescription>Make changes to your post content</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={8}
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Publish Now Dialog */}
        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Posts Now</DialogTitle>
              <DialogDescription>
                Select platforms to publish {selectedCount} post(s) immediately via bundle.social
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {PLATFORMS.map(({ id, label }) => (
                <div key={id} className="flex items-center gap-3">
                  <Checkbox
                    id={`pub-${id}`}
                    checked={publishPlatforms.includes(id)}
                    onCheckedChange={() => togglePlatform(id, publishPlatforms, setPublishPlatforms)}
                  />
                  <Label htmlFor={`pub-${id}`} className="cursor-pointer">{label}</Label>
                </div>
              ))}
              {instagramWarning && publishPlatforms.includes("INSTAGRAM") && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                  Instagram requires an image or video. Posts without images or videos will skip Instagram automatically.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Cancel</Button>
              <Button onClick={handlePublishNow} disabled={publishMutation.isPending || publishPlatforms.length === 0}>
                {publishMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Publish Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Posts</DialogTitle>
              <DialogDescription>
                Select platforms and time to schedule {selectedCount} post(s) via bundle.social
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Time (PKT):</span>
                  <span className="text-sm font-mono">{currentPakistanTime}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(({ id, label }) => (
                    <div key={id} className="flex items-center gap-2">
                      <Checkbox
                        id={`sch-${id}`}
                        checked={schedulePlatforms.includes(id)}
                        onCheckedChange={() => togglePlatform(id, schedulePlatforms, setSchedulePlatforms)}
                      />
                      <Label htmlFor={`sch-${id}`} className="cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
                {instagramWarning && schedulePlatforms.includes("INSTAGRAM") && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                    Instagram requires an image or video. Posts without images or videos will skip Instagram automatically.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-date">Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time (Pakistan Standard Time)</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Posts will be scheduled via bundle.social and published automatically at the selected time.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
              <Button
                onClick={handleConfirmSchedule}
                disabled={publishMutation.isPending || schedulePlatforms.length === 0}
              >
                {publishMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="mr-2 h-4 w-4" />
                )}
                Schedule Posts
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
