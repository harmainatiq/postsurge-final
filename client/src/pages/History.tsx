import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/NotificationBell";
import { Sparkles, LogOut, Settings as SettingsIcon, CheckCircle2, AlertCircle, History as HistoryIcon, ImageOff } from "lucide-react";
import { useLocation } from "wouter";
import { format, isToday, isYesterday } from "date-fns";

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  TWITTER: "Twitter / X",
  INSTAGRAM: "Instagram",
};

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK:  "bg-blue-100 text-blue-700 border-blue-200",
  LINKEDIN:  "bg-indigo-100 text-indigo-700 border-indigo-200",
  TWITTER:   "bg-sky-100 text-sky-700 border-sky-200",
  INSTAGRAM: "bg-pink-100 text-pink-700 border-pink-200",
};

function parsePlatforms(raw: string): string[] {
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function groupByDay(items: { publishedAt: string | Date }[]) {
  const groups: Record<string, typeof items> = {};
  for (const item of items) {
    const d = new Date(item.publishedAt);
    const key = format(d, "yyyy-MM-dd");
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

export default function History() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: entries, isLoading } = trpc.notifications.listAll.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

  const groups = entries ? groupByDay(entries) : {};
  const dayKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/dashboard")}>
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">PostForge AI</span>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={() => setLocation("/settings")}>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
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
        {/* Page title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 bg-primary/10 flex items-center justify-center rounded-lg">
            <HistoryIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Publish History</h1>
            <p className="text-sm text-muted-foreground">All posts published to your connected social accounts</p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-lg bg-card">
                <Skeleton className="h-14 w-14 rounded shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-5 w-20 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && dayKeys.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <HistoryIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg mb-1">No publish history yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Posts you publish will appear here with their platform, date, and status.
            </p>
            <Button onClick={() => setLocation("/posts")}>Go to Posts</Button>
          </div>
        )}

        {/* Grouped entries */}
        {!isLoading && dayKeys.map((dayKey) => {
          const dayEntries = groups[dayKey];
          const label = dayLabel(new Date(dayKey));
          return (
            <div key={dayKey} className="mb-8">
              {/* Day header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{dayEntries.length} post{dayEntries.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Entries */}
              <div className="space-y-2">
                {dayEntries.map((entry: any) => {
                  const platforms = parsePlatforms(entry.platforms);
                  const isFailed = entry.type === "failed";
                  const publishedAt = new Date(entry.publishedAt);

                  return (
                    <div
                      key={entry.id}
                      className={`flex gap-4 p-4 border rounded-lg bg-card transition-colors ${
                        isFailed ? "border-destructive/30 bg-destructive/5" : "hover:bg-muted/30"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="shrink-0 h-14 w-14 rounded overflow-hidden bg-muted flex items-center justify-center">
                        {entry.imageUrl ? (
                          <img
                            src={entry.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <ImageOff className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Platforms */}
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {platforms.map((p) => (
                            <span
                              key={p}
                              className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border ${PLATFORM_COLORS[p] ?? "bg-muted text-muted-foreground border-border"}`}
                            >
                              {PLATFORM_LABELS[p] ?? p}
                            </span>
                          ))}
                          {isFailed && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border bg-destructive/10 text-destructive border-destructive/20">
                              <AlertCircle className="h-3 w-3" /> Failed
                            </span>
                          )}
                          {!isFailed && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3" /> Published
                            </span>
                          )}
                        </div>

                        {/* Post preview */}
                        <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                          {entry.postPreview}
                        </p>

                        {/* Error message */}
                        {isFailed && entry.errorMessage && (
                          <p className="text-xs text-destructive mt-1 line-clamp-1">{entry.errorMessage}</p>
                        )}
                      </div>

                      {/* Time */}
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium text-foreground">{format(publishedAt, "h:mm a")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{format(publishedAt, "MMM d")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
