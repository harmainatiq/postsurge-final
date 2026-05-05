import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

const formSchema = z.object({
  brandName: z.string().optional(),
  tone: z.string().min(1, "Tone is required"),
  style: z.string().min(1, "Style is required"),
  targetAudience: z.string().optional(),
  contentPreferences: z.string().optional(),
  keywords: z.string().optional(),
  avoidWords: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BrandGuidelines() {
  const { data: guidelines, isLoading, refetch } = trpc.brandGuidelines.get.useQuery();
  const createMutation = trpc.brandGuidelines.create.useMutation();
  const updateMutation = trpc.brandGuidelines.update.useMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brandName: "",
      tone: "",
      style: "",
      targetAudience: "",
      contentPreferences: "",
      keywords: "",
      avoidWords: "",
    },
  });

  useEffect(() => {
    if (guidelines) {
      form.reset({
        brandName: guidelines.brandName || "",
        tone: guidelines.tone || "",
        style: guidelines.style || "",
        targetAudience: guidelines.targetAudience || "",
        contentPreferences: guidelines.contentPreferences || "",
        keywords: guidelines.keywords || "",
        avoidWords: guidelines.avoidWords || "",
      });
    }
  }, [guidelines, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (guidelines) {
        await updateMutation.mutateAsync({ id: guidelines.id, ...values });
        toast.success("Brand guidelines updated successfully");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Brand guidelines created successfully");
      }
      refetch();
    } catch (error) {
      toast.error("Failed to save brand guidelines");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Brand Guidelines</h1>
        </div>
        <p className="text-muted-foreground">
          Define your brand voice and content preferences to generate consistent, on-brand social media posts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configure Your Brand Voice</CardTitle>
          <CardDescription>
            These guidelines will be used by AI to generate posts that match your brand identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your brand or company name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of your brand or business.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Professional, Casual, Friendly, Authoritative" {...field} />
                    </FormControl>
                    <FormDescription>
                      The overall tone of voice for your content.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Style *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Informative, Promotional, Educational, Inspirational" {...field} />
                    </FormControl>
                    <FormDescription>
                      The content style that best represents your brand.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Coaches, solopreneurs, B2B marketers, course creators"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Who is your primary audience?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Preferences (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Focus on sales funnels, HighLevel, Kajabi, lead generation strategies"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Any specific topics, themes, or approaches you want to emphasize.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords to Include (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., sales funnel, conversion, automation" {...field} />
                    </FormControl>
                    <FormDescription>
                      Comma-separated keywords to include in posts.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avoidWords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Words to Avoid (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., cheap, discount, limited time" {...field} />
                    </FormControl>
                    <FormDescription>
                      Comma-separated words or phrases to avoid.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {guidelines ? "Update Guidelines" : "Save Guidelines"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
