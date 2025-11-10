import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  RadioGroup,
  RadioGroupItem,
} from "@wealthfolio/ui";
import { worldCurrencies } from "@wealthfolio/ui/lib/currencies";
import type { Loan, LoanType } from "../lib/types";
import {
  generateId,
  calculateMonthlyPayment,
  calculateInterestRate,
  calculateMonthsBetweenDates
} from "../lib/utils";

interface LoanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  loan?: Loan;
  onSave: (loan: Loan) => Promise<void>;
  currency: string;
}

const popularCurrencies = ["USD", "CAD", "EUR", "GBP", "AUD", "CHF", "JPY"];

export function LoanFormDialog({
  open,
  onOpenChange,
  propertyId,
  loan,
  onSave,
  currency,
}: LoanFormDialogProps) {
  const { t } = useTranslation("real-estate");

  const loanTypes: { value: LoanType; label: string }[] = [
    { value: "fixed", label: t("loan_type_fixed") },
    { value: "variable", label: t("loan_type_variable") },
    { value: "adjustable", label: t("loan_type_adjustable") },
    { value: "interest-only", label: t("loan_type_interest_only") },
    { value: "home-equity", label: t("loan_type_home_equity") },
  ];
  const [formData, setFormData] = useState<Partial<Loan>>({
    propertyId,
    name: "",
    type: "fixed",
    lender: "",
    originalAmount: 0,
    currentBalance: 0,
    interestRate: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    monthlyPayment: 0,
    currency,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputMode, setInputMode] = useState<"interest" | "payment">("interest");

  useEffect(() => {
    if (loan) {
      setFormData(loan);
      // Set input mode based on which value is present
      if (loan.monthlyPayment && loan.monthlyPayment > 0) {
        setInputMode("payment");
      } else {
        setInputMode("interest");
      }
    } else {
      setFormData({
        propertyId,
        name: "",
        type: "fixed",
        lender: "",
        originalAmount: 0,
        currentBalance: 0,
        interestRate: 0,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        monthlyPayment: 0,
        currency,
        notes: "",
      });
      setInputMode("interest");
    }
  }, [loan, open, propertyId, currency]);

  // Auto-calculate based on input mode
  useEffect(() => {
    if (!formData.currentBalance || !formData.startDate || !formData.endDate) return;

    const months = calculateMonthsBetweenDates(formData.startDate, formData.endDate);
    if (months <= 0) return;

    if (inputMode === "interest" && formData.interestRate !== undefined) {
      // Calculate monthly payment from interest rate
      const calculatedPayment = calculateMonthlyPayment(
        formData.currentBalance,
        formData.interestRate,
        months
      );
      if (calculatedPayment !== formData.monthlyPayment) {
        setFormData((prev) => ({ ...prev, monthlyPayment: calculatedPayment }));
      }
    } else if (inputMode === "payment" && formData.monthlyPayment) {
      // Calculate interest rate from monthly payment
      const calculatedRate = calculateInterestRate(
        formData.currentBalance,
        formData.monthlyPayment,
        months
      );
      if (Math.abs(calculatedRate - (formData.interestRate || 0)) > 0.01) {
        setFormData((prev) => ({ ...prev, interestRate: calculatedRate }));
      }
    }
  }, [
    formData.currentBalance,
    formData.startDate,
    formData.endDate,
    formData.interestRate,
    formData.monthlyPayment,
    inputMode,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const loanData: Loan = {
        id: loan?.id || generateId(),
        propertyId: formData.propertyId!,
        name: formData.name!,
        type: formData.type as LoanType,
        lender: formData.lender!,
        originalAmount: Number(formData.originalAmount),
        currentBalance: Number(formData.currentBalance),
        interestRate: Number(formData.interestRate),
        startDate: formData.startDate!,
        endDate: formData.endDate || undefined,
        monthlyPayment: formData.monthlyPayment ? Number(formData.monthlyPayment) : undefined,
        currency: formData.currency!,
        notes: formData.notes,
        createdAt: loan?.createdAt || now,
        updatedAt: now,
      };

      await onSave(loanData);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save loan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {loan ? t("loan_form_title_edit") : t("loan_form_title_add")}
            </DialogTitle>
            <DialogDescription>
              {loan ? t("loan_form_description_edit") : t("loan_form_description_add")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="loan-name">{t("loan_name")} *</Label>
              <Input
                id="loan-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("loan_name_placeholder")}
                required
              />
            </div>

            {/* Type and Lender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="loan-type">{t("loan_type")} *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as LoanType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {loanTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lender">{t("loan_lender")} *</Label>
                <Input
                  id="lender"
                  value={formData.lender}
                  onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                  placeholder={t("loan_lender_placeholder")}
                  required
                />
              </div>
            </div>

            {/* Original Amount and Current Balance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="originalAmount">{t("loan_original_amount")} *</Label>
                <Input
                  id="originalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.originalAmount}
                  onChange={(e) => setFormData({ ...formData, originalAmount: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currentBalance">{t("loan_current_balance")} *</Label>
                <Input
                  id="currentBalance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentBalance}
                  onChange={(e) => setFormData({ ...formData, currentBalance: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            {/* Input Mode Selection */}
            <div className="grid gap-3">
              <Label>Choose Input Method *</Label>
              <RadioGroup
                value={inputMode}
                onValueChange={(value: "interest" | "payment") => setInputMode(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="interest" id="mode-interest" />
                  <Label htmlFor="mode-interest" className="font-normal cursor-pointer">
                    Enter Interest Rate
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="payment" id="mode-payment" />
                  <Label htmlFor="mode-payment" className="font-normal cursor-pointer">
                    Enter Monthly Payment
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Interest Rate and Monthly Payment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interestRate" className="flex items-center gap-2">
                  Interest Rate (%)
                  {inputMode === "payment" && (
                    <span className="text-muted-foreground text-xs font-normal">(calculated)</span>
                  )}
                </Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.interestRate || ""}
                  onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                  required={inputMode === "interest"}
                  disabled={inputMode === "payment"}
                  className={inputMode === "payment" ? "bg-muted" : ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthlyPayment" className="flex items-center gap-2">
                  Monthly Payment
                  {inputMode === "interest" && (
                    <span className="text-muted-foreground text-xs font-normal">(calculated)</span>
                  )}
                </Label>
                <Input
                  id="monthlyPayment"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyPayment || ""}
                  onChange={(e) => setFormData({ ...formData, monthlyPayment: Number(e.target.value) })}
                  required={inputMode === "payment"}
                  disabled={inputMode === "interest"}
                  className={inputMode === "interest" ? "bg-muted" : ""}
                />
              </div>
            </div>

            {/* Start Date and End Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Maturity Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Currency */}
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Popular</div>
                  {popularCurrencies.map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
                    </SelectItem>
                  ))}
                  <div className="my-1 border-t" />
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">All Currencies</div>
                  {worldCurrencies
                    .filter((c) => !popularCurrencies.includes(c.value))
                    .map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="loan-notes">Notes</Label>
              <Textarea
                id="loan-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this loan..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : loan ? "Update" : "Add Loan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
