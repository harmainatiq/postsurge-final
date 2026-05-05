import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Sparkles, Wand2, ImageIcon, Video, Ban } from "lucide-react";
import { useLocation } from "wouter";

const formSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  count: z.number().min(1).max(30),
  minWords: z.number().min(10).max(500).optional(),
  mediaType: z.enum(["none", "image", "video"]),
  imageTitleMode: z.enum(["ai", "manual", "none"]),
  imageTitle: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const MEDIA_OPTIONS = [
  { value: "none",  label: "No Media",       icon: Ban,       desc: "" },
  { value: "image", label: "Image",           icon: ImageIcon, desc: "~10s per post" },
  { value: "video", label: "Video",           icon: Video,     desc: "~60-120s per post" },
] as const;

export default function Generate() {
  const [, setLocation] = useLocation();
  const { data: guidelines } = trpc.brandGuidelines.get.useQuery();
  const generateMutation = trpc.posts.generate.useMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      count: 5,
      minWords: 100,
      mediaType: "none",
      imageTitleMode: "ai",
      imageTitle: "",
    },
  });

  const mediaType = form.watch("mediaType");
  const imageTitleMode = form.watch("imageTitleMode");

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await generateMutation.mutateAsync({
        topic: values.topic,
        count: values.count,
        minWords: values.minWords,
        generateImages: values.mediaType === "image",
        imageTitleMode: values.imageTitleMode,
        imageTitle: values.imageTitle,
        generateVideos: values.mediaType === "video",
      });
      toast.success(`Generated ${result.count} posts successfully!`);
      setLocation(`/posts?batch=${result.batchId}`);
    } catch (error) {
      toast.error("Failed to generate posts");
      console.error(error);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wand2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Generate Posts</h1>
        </div>
        <p className="text-muted-foreground">
          Create AI-powered social media posts based on your topic and brand guidelines.
        </p>
      </div>

      {!guidelines && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100">No Brand Guidelines Set</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              For best results, set up your brand guidelines first. Posts will be generated with a default professional tone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setLocation("/brand-guidelines")}
              className="border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Set Up Brand Guidelines
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generate Social Media Posts</CardTitle>
          <CardDescription>
            Enter a topic and we'll create unique posts for you to review and schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Sales funnel optimization, Lead generation strategies"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      What topic should the posts be about? Be specific for better results.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Posts</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={field.value as number}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      How many posts to generate (1-30). Default is 5.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minWords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Words Per Post</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={10}
                        max={500}
                        value={field.value as number}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Each post will be at least this many words (10-500). Default is 100 words.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Media type selector — mutually exclusive */}
              <FormField
                control={form.control}
                name="mediaType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Media</FormLabel>
                    <FormDescription>Attach media to each generated post (pick one).</FormDescription>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {MEDIA_OPTIONS.map(({ value, label, icon: Icon, desc }) => {
                        const active = field.value === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => field.onChange(value)}
                            className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors focus:outline-none ${
                              active
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            {label}
                            {desc && (
                              <span className={`text-xs font-normal ${active ? "text-primary/70" : "text-muted-foreground"}`}>
                                {desc}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image title options — only when image is selected */}
              {mediaType === "image" && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Image Title</p>
                    <p className="text-xs text-muted-foreground">Text displayed on the generated image</p>
                  </div>
                  <div className="flex gap-2">
                    {(["ai", "manual", "none"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => form.setValue("imageTitleMode", mode)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
                          imageTitleMode === mode
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary"
                        }`}
                      >
                        {mode === "ai" ? "AI Generated" : mode === "manual" ? "Manual" : "No Title"}
                      </button>
                    ))}
                  </div>
                  {imageTitleMode === "manual" && (
                    <FormField
                      control={form.control}
                      name="imageTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Enter image title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {imageTitleMode === "ai" && (
                    <p className="text-xs text-muted-foreground">AI will extract a relevant keyword from the post content.</p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={generateMutation.isPending}
                  className="min-w-[200px]"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Posts
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {generateMutation.isPending && (
        <Card className="mt-6">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">Generating your posts...</p>
                <p className="text-sm text-muted-foreground">
                  {mediaType === "video"
                    ? "Generating text + videos. This may take 2-5 minutes"
                    : mediaType === "image"
                    ? "Generating text + images. This may take 30-60 seconds"
                    : "This may take 10-20 seconds"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
