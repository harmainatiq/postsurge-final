import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  TWITTER: "Twitter",
  INSTAGRAM: "Instagram",
};

function parsePlatforms(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function NotificationPanel() {
  const { data: list, isLoading } = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  if (isLoading) {
    return (
      <ul className="divide-y divide-border">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex gap-3 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (!list || list.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6 px-4">
        No notifications yet. Published posts will appear here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {list.map((n) => {
        const platforms = parsePlatforms(n.platforms);
        const isUnread = !n.readAt;
        const isFailed = n.type === "failed";

        return (
          <li
            key={n.id}
            className={`flex gap-3 px-4 py-3 ${
              isFailed
                ? "bg-destructive/10"
                : isUnread
                ? "bg-accent/40"
                : ""
            }`}
          >
            {n.imageUrl ? (
              <img
                src={n.imageUrl}
                alt=""
                className="h-10 w-10 rounded object-cover shrink-0"
              />
            ) : (
              <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                {isFailed
                  ? <AlertCircle className="h-5 w-5 text-destructive" />
                  : <CheckCircle2 className="h-5 w-5 text-green-500" />
                }
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${isFailed ? "text-destructive" : "text-foreground"}`}>
                {isFailed
                  ? `Failed to publish to ${platforms.map(p => PLATFORM_LABELS[p] ?? p).join(", ")}`
                  : `Published to ${platforms.map(p => PLATFORM_LABELS[p] ?? p).join(", ")}`
                }
              </p>
              {isFailed && n.errorMessage && (
                <p className="text-xs text-destructive/80 line-clamp-2 mt-0.5">
                  {n.errorMessage}
                </p>
              )}
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {n.postPreview}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(n.publishedAt), { addSuffix: true })}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
