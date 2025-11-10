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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@wealthfolio/ui";
import type { LoanEvent, LoanEventType } from "../lib/types";

interface LoanEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  loanName: string;
  currentMonthlyPayment: number;
  currentEndDate?: string;
  currentInterestRate: number;
  currency: string;
  onSave: (event: Omit<LoanEvent, "id" | "createdAt">) => void;
  existingEvent?: LoanEvent;
}

export function LoanEventDialog({
  open,
  onOpenChange,
  loanId,
  loanName,
  currentMonthlyPayment,
  currentEndDate,
  currentInterestRate,
  currency,
  onSave,
  existingEvent,
}: LoanEventDialogProps) {
  const [formData, setFormData] = useState<Partial<LoanEvent>>({
    loanId,
    type: existingEvent?.type || "early_reimbursement_duration",
    date: existingEvent?.date || new Date().toISOString().split("T")[0],
    amount: existingEvent?.amount,
    previousMonthlyPayment: existingEvent?.previousMonthlyPayment || currentMonthlyPayment,
    newMonthlyPayment: existingEvent?.newMonthlyPayment,
    previousEndDate: existingEvent?.previousEndDate || currentEndDate,
    newEndDate: existingEvent?.newEndDate,
    previousInterestRate: existingEvent?.previousInterestRate || currentInterestRate,
    newInterestRate: existingEvent?.newInterestRate,
    postponementMonths: existingEvent?.postponementMonths,
    notes: existingEvent?.notes || "",
  });

  const eventTypeLabels: Record<LoanEventType, string> = {
    postponement: "Payment Postponement",
    early_reimbursement_duration: "Early Reimbursement (Reduce Duration)",
    early_reimbursement_payment: "Early Reimbursement (Reduce Payment)",
    rate_change: "Interest Rate Change",
    refinance: "Refinancing",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.date) {
      return;
    }

    onSave({
      loanId,
      type: formData.type,
      date: formData.date,
      amount: formData.amount,
      previousMonthlyPayment: formData.previousMonthlyPayment,
      newMonthlyPayment: formData.newMonthlyPayment,
      previousEndDate: formData.previousEndDate,
      newEndDate: formData.newEndDate,
      previousInterestRate: formData.previousInterestRate,
      newInterestRate: formData.newInterestRate,
      postponementMonths: formData.postponementMonths,
      notes: formData.notes,
    });

    onOpenChange(false);
  };

  const renderEventSpecificFields = () => {
    switch (formData.type) {
      case "postponement":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="postponementMonths">Postponement Duration (months)</Label>
              <Input
                id="postponementMonths"
                type="number"
                min="1"
                value={formData.postponementMonths || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    postponementMonths: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="Number of months to postpone"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEndDate">New End Date</Label>
              <Input
                id="newEndDate"
                type="date"
                value={formData.newEndDate || ""}
                onChange={(e) => setFormData({ ...formData, newEndDate: e.target.value })}
                required
              />
              <p className="text-muted-foreground text-xs">
                Previous end date: {formData.previousEndDate || "Not set"}
              </p>
            </div>
          </>
        );

      case "early_reimbursement_duration":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="amount">Reimbursement Amount ({currency})</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="Extra payment amount"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEndDate">New End Date</Label>
              <Input
                id="newEndDate"
                type="date"
                value={formData.newEndDate || ""}
                onChange={(e) => setFormData({ ...formData, newEndDate: e.target.value })}
                required
              />
              <p className="text-muted-foreground text-xs">
                Previous end date: {formData.previousEndDate || "Not set"}
              </p>
            </div>
          </>
        );

      case "early_reimbursement_payment":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="amount">Reimbursement Amount ({currency})</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="Extra payment amount"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newMonthlyPayment">New Monthly Payment ({currency})</Label>
              <Input
                id="newMonthlyPayment"
                type="number"
                min="0"
                step="0.01"
                value={formData.newMonthlyPayment || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newMonthlyPayment: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="New monthly payment"
                required
              />
              <p className="text-muted-foreground text-xs">
                Previous payment: {currency} {formData.previousMonthlyPayment?.toFixed(2) || "0.00"}
              </p>
            </div>
          </>
        );

      case "rate_change":
        return (
          <div className="space-y-2">
            <Label htmlFor="newInterestRate">New Interest Rate (%)</Label>
            <Input
              id="newInterestRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.newInterestRate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  newInterestRate: parseFloat(e.target.value) || undefined,
                })
              }
              placeholder="New interest rate"
              required
            />
            <p className="text-muted-foreground text-xs">
              Previous rate: {formData.previousInterestRate?.toFixed(2) || "0.00"}%
            </p>
          </div>
        );

      case "refinance":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="newInterestRate">New Interest Rate (%)</Label>
              <Input
                id="newInterestRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.newInterestRate || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newInterestRate: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="New interest rate"
                required
              />
              <p className="text-muted-foreground text-xs">
                Previous rate: {formData.previousInterestRate?.toFixed(2) || "0.00"}%
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newMonthlyPayment">New Monthly Payment ({currency})</Label>
              <Input
                id="newMonthlyPayment"
                type="number"
                min="0"
                step="0.01"
                value={formData.newMonthlyPayment || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newMonthlyPayment: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="New monthly payment"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEndDate">New End Date</Label>
              <Input
                id="newEndDate"
                type="date"
                value={formData.newEndDate || ""}
                onChange={(e) => setFormData({ ...formData, newEndDate: e.target.value })}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingEvent ? "Edit" : "Add"} Loan Event - {loanName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Event Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: LoanEventType) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(eventTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Event Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {renderEventSpecificFields()}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this event"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Icons.Save className="mr-2 h-4 w-4" />
              Save Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
