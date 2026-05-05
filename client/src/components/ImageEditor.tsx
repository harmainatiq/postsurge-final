import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, ImageOff, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface ImageEditorPost {
  id: number;
  imageUrl: string;
}

interface ImageEditorProps {
  post: ImageEditorPost | null;
  open: boolean;
  onClose: () => void;
  onSaved: (postId: number, newImageUrl: string) => void;
}

const CLOUDINARY_FONTS = [
  { label: "Impact",          value: "impact" },
  { label: "Arial",           value: "arial" },
  { label: "Helvetica",       value: "helvetica" },
  { label: "Georgia",         value: "georgia" },
  { label: "Verdana",         value: "verdana" },
  { label: "Roboto",          value: "roboto" },
];

const FONT_SIZES = [24, 32, 40, 48, 56, 64, 72, 80, 96, 112];

const PRESETS = ["#ffffff", "#000000", "#fbbf24", "#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#f97316"];

const GRAVITY_GRID = [
  ["north_west", "north",  "north_east"],
  ["west",       "center", "east"      ],
  ["south_west", "south",  "south_east"],
];

const GRAVITY_LABELS: Record<string, string> = {
  north_west: "↖", north: "↑", north_east: "↗",
  west: "←",       center: "·", east: "→",
  south_west: "↙", south: "↓", south_east: "↘",
};

function getBaseUrl(url: string): string {
  const match = url.match(/(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*?)(v\d+\/.+)$/);
  if (match) return `${match[1]}${match[3]}`;
  return url;
}

// Parse previously saved overlay from URL — matches the non-shadow text layer
function parseOverlayUrl(url: string): { text: string; font: string; size: number; color: string; gravity: string } | null {
  // Shadow layer has ,o_60, — main layer goes straight to ,g_
  const match = url.match(/l_text:([a-z_]+)_(\d+):([^,/]+),co_rgb:([0-9a-fA-F]{6}),g_([a-z_]+),w_900/);
  if (!match) return null;
  return {
    font: match[1],
    size: Number(match[2]),
    text: decodeURIComponent(match[3]),
    color: `#${match[4]}`,
    gravity: match[5],
  };
}

function encodeText(text: string): string {
  return encodeURIComponent(text.replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim());
}

const EDGE_PAD = 40;

function getEdgeOffset(gravity: string): string {
  if (gravity === "center") return "";
  const x = gravity.includes("east") || gravity.includes("west") ? `,x_${EDGE_PAD}` : "";
  const y = gravity.includes("north") || gravity.includes("south") ? `,y_${EDGE_PAD}` : "";
  return `${x}${y}`;
}

function buildPreviewUrl(baseUrl: string, text: string, font: string, size: number, color: string, gravity: string): string {
  if (!text.trim()) return baseUrl;
  const hex = color.replace("#", "");
  const encoded = encodeText(text);
  if (!encoded) return baseUrl;

  const uploadIdx = baseUrl.indexOf("/upload/");
  if (uploadIdx === -1) return baseUrl;

  const before = baseUrl.slice(0, uploadIdx + 8);
  const after  = baseUrl.slice(uploadIdx + 8);
  const pad    = getEdgeOffset(gravity);

  const shadow = `l_text:${font}_${size}:${encoded},co_rgb:000000,o_60,g_${gravity}${pad}`;
  const main   = `l_text:${font}_${size}:${encoded},co_rgb:${hex},g_${gravity}${pad}`;

  return `${before}${shadow}/${main}/${after}`;
}

export function ImageEditor({ post, open, onClose, onSaved }: ImageEditorProps) {
  const [text, setText] = useState("");
  const [font, setFont] = useState("impact");
  const [size, setSize] = useState(64);
  const [color, setColor] = useState("#ffffff");
  const [gravity, setGravity] = useState("south");
  const [imgError, setImgError] = useState(false);
  const [saving, setSaving] = useState(false);

  const updatePost = trpc.posts.update.useMutation();

  // Restore previous overlay values when opening
  useEffect(() => {
    if (open && post) {
      const parsed = parseOverlayUrl(post.imageUrl);
      setText(parsed?.text ?? "");
      setFont(parsed?.font ?? "impact");
      setSize(parsed?.size ?? 64);
      setColor(parsed?.color ?? "#ffffff");
      setGravity(parsed?.gravity ?? "south");
      setImgError(false);
    }
  }, [open, post?.imageUrl]);

  const baseUrl = useMemo(() => (post ? getBaseUrl(post.imageUrl) : ""), [post?.imageUrl]);

  const previewUrl = useMemo(
    () => (baseUrl ? buildPreviewUrl(baseUrl, text, font, size, color, gravity) : ""),
    [baseUrl, text, font, size, color, gravity]
  );

  // Clear error whenever URL changes so size/color/font changes always retry
  useEffect(() => { setImgError(false); }, [previewUrl]);

  const handleSave = async () => {
    if (!post) return;
    setSaving(true);
    try {
      await updatePost.mutateAsync({ id: post.id, imageUrl: previewUrl || baseUrl });
      toast.success("Image saved");
      onSaved(post.id, previewUrl || baseUrl);
    } catch {
      toast.error("Failed to save image");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-none w-[900px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-3.5 border-b">
          <DialogTitle className="text-base">Edit Image</DialogTitle>
        </DialogHeader>

        <div className="flex divide-x">

          {/* ── Left panel: preview (fixed size) ── */}
          <div className="relative bg-neutral-950 overflow-hidden flex items-center justify-center shrink-0" style={{ width: 520, height: 520 }}>
            {!imgError && baseUrl ? (
              <img
                key={previewUrl}
                src={previewUrl || baseUrl}
                alt="Preview"
                onError={() => setImgError(true)}
                className="w-full h-full object-contain block"
              />
            ) : imgError ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground p-8">
                <ImageOff className="h-10 w-10 opacity-40" />
                <p className="text-xs text-center leading-relaxed opacity-60">
                  Preview failed — some characters may not be supported. Try simpler text.
                </p>
                <Button variant="outline" size="sm" onClick={() => { setImgError(false); setText(""); }}>
                  Reset text
                </Button>
              </div>
            ) : null}

          </div>

          {/* ── Right panel: controls ── */}
          <div className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto bg-muted/20" style={{ maxHeight: 520 }}>

            {/* Text */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Overlay Text</Label>
              <Input
                placeholder="Type something..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="text-sm h-9"
              />
            </div>

            <Separator />

            {/* Font */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Font</Label>
              <Select value={font} onValueChange={setFont} disabled={!text.trim()}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLOUDINARY_FONTS.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="text-sm">{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Size</Label>
              <Select value={String(size)} onValueChange={(v) => setSize(Number(v))} disabled={!text.trim()}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)} className="text-sm">{s}px</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Color */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={!text.trim()}
                  className="h-9 w-9 rounded-md border cursor-pointer p-0.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Pick color"
                />
                <Input
                  value={color}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v);
                  }}
                  disabled={!text.trim()}
                  className="h-9 text-sm font-mono"
                  maxLength={7}
                />
              </div>
              <div className="flex gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setColor(p)}
                    disabled={!text.trim()}
                    style={{ background: p }}
                    className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    title={p}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Position */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Position</Label>
              <div className="grid grid-cols-3 gap-1">
                {GRAVITY_GRID.flat().map((g) => (
                  <button
                    key={g}
                    onClick={() => setGravity(g)}
                    disabled={!text.trim()}
                    className={`h-9 rounded-md text-base border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      gravity === g
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                    }`}
                    title={g.replace(/_/g, " ")}
                  >
                    {GRAVITY_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>

            {/* Remove overlay */}
            {text && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground gap-1.5 justify-start -mt-1"
                  onClick={() => setText("")}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Remove overlay
                </Button>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t gap-2 bg-muted/10">
          <p className="text-xs text-muted-foreground flex-1 self-center">
            Overlays are applied via Cloudinary — no re-upload needed
          </p>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
