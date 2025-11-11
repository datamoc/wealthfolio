import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  AlertDescription,
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
  const { t } = useTranslation("real-estate");
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
            <DialogTitle>{t("postponePayments.title")}</DialogTitle>
            <DialogDescription>
              {t("postponePayments.description", { loanName: loan.name })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="default">
              <Icons.AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("postponePayments.alertMessage")}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="months">{t("postponePayments.monthsLabel")}</Label>
              <Input
                id="months"
                type="number"
                min={1}
                max={12}
                value={monthsToPostpone}
                onChange={(e) => setMonthsToPostpone(parseInt(e.target.value) || 1)}
                required
              />
              <p className="text-muted-foreground text-xs">{t("postponePayments.monthsHint")}</p>
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">{t("postponePayments.impactSummary")}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("postponePayments.currentEndDate")}:
                  </span>
                  <span>{loan.endDate ? formatDate(loan.endDate) : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("postponePayments.newEndDate")}:</span>
                  <span className="font-semibold">
                    {newEndDate ? formatDate(newEndDate) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("postponePayments.additionalInterest")}:
                  </span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    +{formatCurrency(additionalInterest, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("postponePayments.monthsPostponed")}:
                  </span>
                  <span className="font-semibold">{monthsToPostpone}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("postponePayments.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("postponePayments.processing") : t("postponePayments.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
