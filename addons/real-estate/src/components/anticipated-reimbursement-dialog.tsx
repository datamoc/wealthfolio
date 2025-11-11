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
  RadioGroup,
  RadioGroupItem,
  Alert,
  AlertDescription,
  Icons,
} from "@wealthfolio/ui";
import type { Loan } from "../lib/types";
import { formatCurrency, formatDate } from "../lib/utils";

interface AnticipatedReimbursementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan;
  currency: string;
  onConfirm: (
    loan: Loan,
    extraPayment: number,
    option: "shorter-duration" | "lower-payment"
  ) => Promise<void>;
}

export function AnticipatedReimbursementDialog({
  open,
  onOpenChange,
  loan,
  currency,
  onConfirm,
}: AnticipatedReimbursementDialogProps) {
  const { t } = useTranslation("real-estate");
  const [extraPayment, setExtraPayment] = useState(0);
  const [option, setOption] = useState<"shorter-duration" | "lower-payment">("shorter-duration");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate remaining months
  const calculateRemainingMonths = () => {
    if (!loan.endDate) return null;
    const now = new Date();
    const end = new Date(loan.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, diffMonths);
  };

  // Calculate new loan parameters based on extra payment
  const calculateNewParameters = () => {
    const remainingMonths = calculateRemainingMonths();
    if (!remainingMonths || !loan.monthlyPayment) {
      return null;
    }

    const newBalance = Math.max(0, loan.currentBalance - extraPayment);
    const monthlyInterestRate = loan.interestRate / 100 / 12;

    if (option === "shorter-duration") {
      // Keep same monthly payment, calculate new duration
      // Formula: n = -log(1 - r*P/M) / log(1 + r)
      // where n = number of months, r = monthly rate, P = principal, M = monthly payment
      if (loan.monthlyPayment <= newBalance * monthlyInterestRate) {
        // Payment doesn't cover interest
        return null;
      }

      const numerator = Math.log(
        1 - (monthlyInterestRate * newBalance) / loan.monthlyPayment
      );
      const denominator = Math.log(1 + monthlyInterestRate);
      const newDurationMonths = Math.ceil(-numerator / denominator);

      const startDate = new Date(loan.startDate);
      const newEndDate = new Date(startDate);
      newEndDate.setMonth(newEndDate.getMonth() + newDurationMonths);

      const monthsSaved = remainingMonths - newDurationMonths;
      const interestSaved = monthsSaved * loan.monthlyPayment - (loan.currentBalance - newBalance);

      return {
        newEndDate: newEndDate.toISOString().split("T")[0],
        newMonthlyPayment: loan.monthlyPayment,
        monthsSaved,
        interestSaved: Math.max(0, interestSaved),
        newBalance,
      };
    } else {
      // Keep same duration, calculate new monthly payment
      // Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
      const n = remainingMonths;
      const r = monthlyInterestRate;
      const P = newBalance;

      const numerator = r * Math.pow(1 + r, n);
      const denominator = Math.pow(1 + r, n) - 1;
      const newMonthlyPayment = (P * numerator) / denominator;

      const oldTotalPayment = loan.monthlyPayment * remainingMonths;
      const newTotalPayment = newMonthlyPayment * remainingMonths + extraPayment;
      const savings = oldTotalPayment - newTotalPayment;

      return {
        newEndDate: loan.endDate,
        newMonthlyPayment,
        monthsSaved: 0,
        interestSaved: Math.max(0, savings),
        newBalance,
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(loan, extraPayment, option);
      onOpenChange(false);
      setExtraPayment(0); // Reset
    } catch (error) {
      console.error("Failed to process anticipated reimbursement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const newParameters = calculateNewParameters();
  const remainingMonths = calculateRemainingMonths();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("anticipatedReimbursement.title")}</DialogTitle>
            <DialogDescription>
              {t("anticipatedReimbursement.description", { loanName: loan.name })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="default">
              <Icons.TrendingUp className="h-4 w-4" />
              <AlertDescription>
                {t("anticipatedReimbursement.alertMessage")}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="extraPayment">{t("anticipatedReimbursement.extraPaymentLabel")}</Label>
              <Input
                id="extraPayment"
                type="number"
                min={0}
                max={loan.currentBalance}
                step={100}
                value={extraPayment}
                onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                required
              />
              <p className="text-muted-foreground text-xs">
                {t("anticipatedReimbursement.currentBalance")}:{" "}
                {formatCurrency(loan.currentBalance, currency)}
              </p>
            </div>

            <div className="space-y-3">
              <Label>{t("anticipatedReimbursement.chooseOption")}</Label>
              <RadioGroup value={option} onValueChange={(v) => setOption(v as typeof option)}>
                <div className="flex items-start space-x-2 rounded-lg border p-4">
                  <RadioGroupItem value="shorter-duration" id="shorter-duration" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="shorter-duration" className="font-semibold cursor-pointer">
                      {t("anticipatedReimbursement.shorterDurationTitle")}
                    </Label>
                    <p className="text-muted-foreground text-sm mt-1">
                      {t("anticipatedReimbursement.shorterDurationDescription", {
                        monthlyPayment: loan.monthlyPayment
                          ? formatCurrency(loan.monthlyPayment, currency)
                          : "N/A",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 rounded-lg border p-4">
                  <RadioGroupItem value="lower-payment" id="lower-payment" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="lower-payment" className="font-semibold cursor-pointer">
                      {t("anticipatedReimbursement.lowerPaymentTitle")}
                    </Label>
                    <p className="text-muted-foreground text-sm mt-1">
                      {t("anticipatedReimbursement.lowerPaymentDescription", {
                        endDate: loan.endDate ? formatDate(loan.endDate) : "N/A",
                      })}
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {newParameters && extraPayment > 0 && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">{t("anticipatedReimbursement.impactSummary")}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("anticipatedReimbursement.extraPayment")}:
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(extraPayment, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("anticipatedReimbursement.newBalance")}:
                    </span>
                    <span>{formatCurrency(newParameters.newBalance, currency)}</span>
                  </div>
                  {option === "shorter-duration" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("anticipatedReimbursement.currentEndDate")}:
                        </span>
                        <span>{loan.endDate ? formatDate(loan.endDate) : "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("anticipatedReimbursement.newEndDate")}:
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatDate(newParameters.newEndDate!)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("anticipatedReimbursement.monthsSaved")}:
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {newParameters.monthsSaved} {t("anticipatedReimbursement.months")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("anticipatedReimbursement.currentMonthlyPayment")}:
                        </span>
                        <span>
                          {loan.monthlyPayment
                            ? formatCurrency(loan.monthlyPayment, currency)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("anticipatedReimbursement.newMonthlyPayment")}:
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(newParameters.newMonthlyPayment, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("anticipatedReimbursement.monthlySavings")}:
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(
                            (loan.monthlyPayment || 0) - newParameters.newMonthlyPayment,
                            currency
                          )}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">
                      {t("anticipatedReimbursement.interestSaved")}:
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(newParameters.interestSaved, currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {extraPayment > 0 && !newParameters && (
              <Alert variant="destructive">
                <Icons.AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t("anticipatedReimbursement.calculationError")}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("anticipatedReimbursement.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !newParameters || extraPayment <= 0}>
              {isSubmitting
                ? t("anticipatedReimbursement.processing")
                : t("anticipatedReimbursement.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
