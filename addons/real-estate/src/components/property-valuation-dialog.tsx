import { useState } from "react";
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

const valuationSources = [
  { value: "appraisal", label: "Professional Appraisal" },
  { value: "market", label: "Market Estimate" },
  { value: "manual", label: "Manual Entry" },
  { value: "tax_assessment", label: "Tax Assessment" },
  { value: "refinance", label: "Refinance Appraisal" },
];

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
            {existingValuation ? "Edit" : "Add"} Valuation - {propertyName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Valuation Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Property Value ({currency})</Label>
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
              placeholder="Enter property value"
              required
            />
            {formData.value !== currentValue && (
              <p
                className={`text-xs ${valueChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {valueChange >= 0 ? "+" : ""}
                {currency} {Math.abs(valueChange).toFixed(2)} ({valueChange >= 0 ? "+" : ""}
                {valueChangePercent.toFixed(2)}%) from current value
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Valuation Source</Label>
            <Select
              value={formData.source}
              onValueChange={(value) => setFormData({ ...formData, source: value })}
            >
              <SelectTrigger id="source">
                <SelectValue placeholder="Select source" />
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
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this valuation"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Icons.Save className="mr-2 h-4 w-4" />
              Save Valuation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
