import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useSettingsContext } from "@/lib/settings-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const displayFormatFormSchema = z.object({
  useCompactNotation: z.boolean(),
});

type DisplayFormatFormValues = z.infer<typeof displayFormatFormSchema>;

// Extracted form component
export function DisplayFormatForm() {
  const { settings, updateSettings } = useSettingsContext();
  const { t } = useTranslation("settings");

  const defaultValues: Partial<DisplayFormatFormValues> = {
    useCompactNotation: settings?.useCompactNotation || false,
  };

  const form = useForm<DisplayFormatFormValues>({
    resolver: zodResolver(displayFormatFormSchema),
    defaultValues,
    // Reset form when settings change from external source
    values: { useCompactNotation: settings?.useCompactNotation || false },
  });

  async function onSubmit(data: DisplayFormatFormValues) {
    try {
      await updateSettings({ useCompactNotation: data.useCompactNotation });
    } catch (error) {
      console.error("Failed to update display format settings:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="useCompactNotation"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t("display_format_compact_label")}</FormLabel>
                <FormDescription>
                  {t("display_format_compact_description")}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">{t("save_settings")}</Button>
      </form>
    </Form>
  );
}

// Original component now uses the extracted form inside a Card
export function DisplayFormatSettings() {
  const { t } = useTranslation("settings");
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-lg">{t("display_format_title")}</CardTitle>
          <CardDescription>{t("display_format_description")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <DisplayFormatForm />
      </CardContent>
    </Card>
  );
}
