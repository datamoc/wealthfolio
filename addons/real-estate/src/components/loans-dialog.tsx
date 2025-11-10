import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Icons,
  Card,
  CardContent,
  Badge,
} from "@wealthfolio/ui";
import type { Loan } from "../lib/types";
import { formatCurrency, formatPercentage, formatDate } from "../lib/utils";
import { LoanFormDialog } from "./loan-form-dialog";

interface LoansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyName: string;
  loans: Loan[];
  currency: string;
  onSaveLoan: (loan: Loan) => Promise<void>;
  onDeleteLoan: (loanId: string) => Promise<void>;
}

export function LoansDialog({
  open,
  onOpenChange,
  propertyId,
  propertyName,
  loans,
  currency,
  onSaveLoan,
  onDeleteLoan,
}: LoansDialogProps) {
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | undefined>();

  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setLoanFormOpen(true);
  };

  const handleAddLoan = () => {
    setEditingLoan(undefined);
    setLoanFormOpen(true);
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (confirm("Are you sure you want to delete this loan?")) {
      await onDeleteLoan(loanId);
    }
  };

  const loanTypeLabels: Record<string, string> = {
    fixed: "Fixed Rate",
    variable: "Variable Rate",
    adjustable: "ARM",
    "interest-only": "Interest Only",
    "home-equity": "Home Equity",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Loans for {propertyName}</DialogTitle>
            <DialogDescription>Manage all loans associated with this property.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {loans.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                <p className="mb-4">No loans added yet.</p>
                <Button onClick={handleAddLoan}>
                  <Icons.Plus className="mr-2 h-4 w-4" />
                  Add First Loan
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button onClick={handleAddLoan} size="sm">
                    <Icons.Plus className="mr-2 h-4 w-4" />
                    Add Loan
                  </Button>
                </div>

                <div className="space-y-3">
                  {loans.map((loan) => {
                    const paidAmount = loan.originalAmount - loan.currentBalance;
                    const paidPercentage =
                      loan.originalAmount > 0 ? (paidAmount / loan.originalAmount) * 100 : 0;

                    return (
                      <Card key={loan.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <h4 className="font-semibold">{loan.name}</h4>
                                <Badge variant="secondary">{loanTypeLabels[loan.type]}</Badge>
                              </div>
                              <p className="text-muted-foreground mb-3 text-sm">{loan.lender}</p>

                              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                <div>
                                  <p className="text-muted-foreground text-xs">Current Balance</p>
                                  <p className="font-semibold">
                                    {formatCurrency(loan.currentBalance, currency)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Original Amount</p>
                                  <p className="text-sm">
                                    {formatCurrency(loan.originalAmount, currency)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Interest Rate</p>
                                  <p className="text-sm">{formatPercentage(loan.interestRate)}</p>
                                </div>
                                {loan.monthlyPayment && (
                                  <div>
                                    <p className="text-muted-foreground text-xs">Monthly Payment</p>
                                    <p className="text-sm">
                                      {formatCurrency(loan.monthlyPayment, currency)}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 flex items-center gap-4 text-xs">
                                <span className="text-muted-foreground">
                                  Started: {formatDate(loan.startDate)}
                                </span>
                                {loan.endDate && (
                                  <span className="text-muted-foreground">
                                    Matures: {formatDate(loan.endDate)}
                                  </span>
                                )}
                                <span className="text-green-600 dark:text-green-400">
                                  {formatPercentage(paidPercentage)} paid off
                                </span>
                              </div>

                              {loan.notes && (
                                <p className="text-muted-foreground mt-2 text-xs">{loan.notes}</p>
                              )}
                            </div>

                            <div className="ml-4 flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditLoan(loan)}
                              >
                                <Icons.Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteLoan(loan.id)}
                              >
                                <Icons.Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <LoanFormDialog
        open={loanFormOpen}
        onOpenChange={setLoanFormOpen}
        propertyId={propertyId}
        loan={editingLoan}
        onSave={onSaveLoan}
        currency={currency}
      />
    </>
  );
}
