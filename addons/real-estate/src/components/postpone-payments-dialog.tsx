import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Input,
  Alert,
  Icons,
} from "@wealthfolio/ui";
import type { Loan } from "../lib/types";
import { formatCurrency, formatDate } from "../lib/utils";

interface PostponePaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan;
  currency: string;
  onConfirm: (loan: Loan, monthsToPostpone: number) => Promise<void>;
}

export function PostponePaymentsDialog({
  open,
  onOpenChange,
  loan,
  currency,
  onConfirm,
}: PostponePaymentsDialogProps) {
  const [monthsToPostpone, setMonthsToPostpone] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateNewEndDate = () => {
    if (!loan.endDate) return null;
    const endDate = new Date(loan.endDate);
    endDate.setMonth(endDate.getMonth() + monthsToPostpone);
    return endDate.toISOString().split("T")[0];
  };

  const calculateAdditionalInterest = () => {
    // Simple calculation: monthlyPayment * monthsToPostpone * (interestRate / 12)
    // This is an approximation - real calculation would be more complex
    if (!loan.monthlyPayment) return 0;
    const monthlyInterestRate = loan.interestRate / 100 / 12;
    return loan.currentBalance * monthlyInterestRate * monthsToPostpone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(loan, monthsToPostpone);
      onOpenChange(false);
      setMonthsToPostpone(3); // Reset
    } catch (error) {
      console.error("Failed to postpone payments:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const newEndDate = calculateNewEndDate();
  const additionalInterest = calculateAdditionalInterest();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Postpone Loan Payments</DialogTitle>
            <DialogDescription>
              Temporarily postpone payments for {loan.name}. This will extend the loan maturity
              date and increase the total interest paid.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="default">
              <Icons.AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <p className="text-sm">
                  Postponing payments is typically used during financial difficulties. Interest
                  will continue to accrue during the postponement period.
                </p>
              </div>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="months">Number of Months to Postpone</Label>
              <Input
                id="months"
                type="number"
                min={1}
                max={12}
                value={monthsToPostpone}
                onChange={(e) => setMonthsToPostpone(parseInt(e.target.value) || 1)}
                required
              />
              <p className="text-muted-foreground text-xs">
                Maximum 12 months can be postponed at once
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">Impact Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current End Date:</span>
                  <span>{loan.endDate ? formatDate(loan.endDate) : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New End Date:</span>
                  <span className="font-semibold">
                    {newEndDate ? formatDate(newEndDate) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Additional Interest (approx):</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    +{formatCurrency(additionalInterest, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Months Postponed:</span>
                  <span className="font-semibold">{monthsToPostpone}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Postponement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
