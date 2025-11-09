import React, { useState, useEffect } from "react";
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
} from "@wealthfolio/ui";
import type { Loan, LoanType } from "../lib/types";
import { generateId } from "../lib/utils";

interface LoanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  loan?: Loan;
  onSave: (loan: Loan) => Promise<void>;
  currency: string;
}

const loanTypes: { value: LoanType; label: string }[] = [
  { value: "fixed", label: "Fixed Rate" },
  { value: "variable", label: "Variable Rate" },
  { value: "adjustable", label: "Adjustable Rate (ARM)" },
  { value: "interest-only", label: "Interest Only" },
  { value: "home-equity", label: "Home Equity" },
];

export function LoanFormDialog({
  open,
  onOpenChange,
  propertyId,
  loan,
  onSave,
  currency,
}: LoanFormDialogProps) {
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

  useEffect(() => {
    if (loan) {
      setFormData(loan);
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
    }
  }, [loan, open, propertyId, currency]);

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
            <DialogTitle>{loan ? "Edit Loan" : "Add New Loan"}</DialogTitle>
            <DialogDescription>
              {loan ? "Update the loan details below." : "Enter the details of the loan."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="loan-name">Loan Name *</Label>
              <Input
                id="loan-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Primary Mortgage, Second Mortgage"
                required
              />
            </div>

            {/* Type and Lender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="loan-type">Loan Type *</Label>
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
                <Label htmlFor="lender">Lender *</Label>
                <Input
                  id="lender"
                  value={formData.lender}
                  onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                  placeholder="Bank name"
                  required
                />
              </div>
            </div>

            {/* Original Amount and Current Balance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="originalAmount">Original Amount *</Label>
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
                <Label htmlFor="currentBalance">Current Balance *</Label>
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

            {/* Interest Rate and Monthly Payment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthlyPayment">Monthly Payment</Label>
                <Input
                  id="monthlyPayment"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyPayment}
                  onChange={(e) => setFormData({ ...formData, monthlyPayment: Number(e.target.value) })}
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
