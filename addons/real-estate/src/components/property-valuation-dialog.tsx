import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Icons,
  Label,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wealthfolio/ui";
import type { PropertyValuation } from "../lib/types";

interface PropertyValuationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyName: string;
  currentValue: number;
  currency: string;
  onSave: (valuation: Omit<PropertyValuation, "id" | "createdAt">) => void;
  existingValuation?: PropertyValuation;
}

export function PropertyValuationDialog({
  open,
  onOpenChange,
  propertyId,
  propertyName,
  currentValue,
  currency,
  onSave,
  existingValuation,
}: PropertyValuationDialogProps) {
  const { t } = useTranslation("real-estate");

  const valuationSources = [
    { value: "appraisal", label: t("valuation_source_appraisal") },
    { value: "market", label: t("valuation_source_market") },
    { value: "manual", label: t("valuation_source_manual") },
    { value: "tax_assessment", label: t("valuation_source_tax_assessment") },
    { value: "refinance", label: t("valuation_source_refinance") },
  ];

  const [formData, setFormData] = useState({
    propertyId,
    value: existingValuation?.value || currentValue,
    date: existingValuation?.date || new Date().toISOString().split("T")[0],
    source: existingValuation?.source || "manual",
    notes: existingValuation?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.value || !formData.date) {
      return;
    }

    onSave({
      propertyId,
      value: formData.value,
      date: formData.date,
      source: formData.source,
      notes: formData.notes,
    });

    onOpenChange(false);
  };

  const valueChange = formData.value - currentValue;
  const valueChangePercent = currentValue > 0 ? (valueChange / currentValue) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingValuation
              ? t("valuation_dialog_title_edit", { propertyName })
              : t("valuation_dialog_title_add", { propertyName })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">{t("valuation_date")}</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">{t("valuation_amount")} ({currency})</Label>
            <Input
              id="value"
              type="number"
              min="0"
              step="0.01"
              value={formData.value}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  value: parseFloat(e.target.value) || 0,
                })
              }
              placeholder={t("valuation_amount_placeholder")}
              required
            />
            {formData.value !== currentValue && (
              <p
                className={`text-xs ${valueChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {valueChange >= 0 ? "+" : ""}
                {currency} {Math.abs(valueChange).toFixed(2)} ({valueChange >= 0 ? "+" : ""}
                {valueChangePercent.toFixed(2)}%) {t("valuation_from_current")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">{t("valuation_source")}</Label>
            <Select
              value={formData.source}
              onValueChange={(value) => setFormData({ ...formData, source: value })}
            >
              <SelectTrigger id="source">
                <SelectValue placeholder={t("valuation_source_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {valuationSources.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("valuation_notes_optional")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t("valuation_notes_placeholder")}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit">
              <Icons.Save className="mr-2 h-4 w-4" />
              {t("save_valuation")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
