import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wealthfolio/ui";
import type { Loan } from "../lib/types";
import { formatCurrency, formatPercentage, formatDate } from "../lib/utils";
import { LoanFormDialog } from "./loan-form-dialog";
import { PostponePaymentsDialog } from "./postpone-payments-dialog";
import { AnticipatedReimbursementDialog } from "./anticipated-reimbursement-dialog";

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
  const { t } = useTranslation("real-estate");
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | undefined>();
  const [postponeDialogOpen, setPostponeDialogOpen] = useState(false);
  const [reimbursementDialogOpen, setReimbursementDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | undefined>();

  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setLoanFormOpen(true);
  };

  const handleAddLoan = () => {
    setEditingLoan(undefined);
    setLoanFormOpen(true);
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (confirm(t("loansDialog.deleteConfirm"))) {
      await onDeleteLoan(loanId);
    }
  };

  const handlePostponePayments = (loan: Loan) => {
    setSelectedLoan(loan);
    setPostponeDialogOpen(true);
  };

  const handleAnticipatedReimbursement = (loan: Loan) => {
    setSelectedLoan(loan);
    setReimbursementDialogOpen(true);
  };

  const handleConfirmPostpone = async (loan: Loan, monthsToPostpone: number) => {
    // Calculate new end date
    const newEndDate = loan.endDate
      ? new Date(new Date(loan.endDate).setMonth(new Date(loan.endDate).getMonth() + monthsToPostpone))
          .toISOString()
          .split("T")[0]
      : undefined;

    // Update the loan with new end date
    const updatedLoan: Loan = {
      ...loan,
      endDate: newEndDate,
      notes: loan.notes
        ? `${loan.notes}\n\n[${new Date().toISOString().split("T")[0]}] Postponed ${monthsToPostpone} months`
        : `[${new Date().toISOString().split("T")[0]}] Postponed ${monthsToPostpone} months`,
    };

    await onSaveLoan(updatedLoan);
  };

  const handleConfirmReimbursement = async (
    loan: Loan,
    extraPayment: number,
    option: "shorter-duration" | "lower-payment"
  ) => {
    const newBalance = Math.max(0, loan.currentBalance - extraPayment);
    let updatedLoan: Loan;

    if (option === "shorter-duration") {
      // Calculate new duration
      const monthlyInterestRate = loan.interestRate / 100 / 12;
      const numerator = Math.log(1 - (monthlyInterestRate * newBalance) / (loan.monthlyPayment || 0));
      const denominator = Math.log(1 + monthlyInterestRate);
      const newDurationMonths = Math.ceil(-numerator / denominator);

      const startDate = new Date(loan.startDate);
      const newEndDate = new Date(startDate);
      newEndDate.setMonth(newEndDate.getMonth() + newDurationMonths);

      updatedLoan = {
        ...loan,
        currentBalance: newBalance,
        endDate: newEndDate.toISOString().split("T")[0],
        notes: loan.notes
          ? `${loan.notes}\n\n[${new Date().toISOString().split("T")[0]}] Extra payment: ${extraPayment.toFixed(2)} ${currency} (shorter duration)`
          : `[${new Date().toISOString().split("T")[0]}] Extra payment: ${extraPayment.toFixed(2)} ${currency} (shorter duration)`,
      };
    } else {
      // Calculate new monthly payment
      const remainingMonths = loan.endDate
        ? Math.ceil((new Date(loan.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
        : 0;
      const monthlyInterestRate = loan.interestRate / 100 / 12;
      const numerator = monthlyInterestRate * Math.pow(1 + monthlyInterestRate, remainingMonths);
      const denominator = Math.pow(1 + monthlyInterestRate, remainingMonths) - 1;
      const newMonthlyPayment = (newBalance * numerator) / denominator;

      updatedLoan = {
        ...loan,
        currentBalance: newBalance,
        monthlyPayment: newMonthlyPayment,
        notes: loan.notes
          ? `${loan.notes}\n\n[${new Date().toISOString().split("T")[0]}] Extra payment: ${extraPayment.toFixed(2)} ${currency} (lower payment)`
          : `[${new Date().toISOString().split("T")[0]}] Extra payment: ${extraPayment.toFixed(2)} ${currency} (lower payment)`,
      };
    }

    await onSaveLoan(updatedLoan);
  };

  const loanTypeLabels: Record<string, string> = {
    fixed: t("loanTypes.fixed"),
    variable: t("loanTypes.variable"),
    adjustable: t("loanTypes.adjustable"),
    "interest-only": t("loanTypes.interest-only"),
    "home-equity": t("loanTypes.home-equity"),
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{t("loansDialog.title", { propertyName })}</DialogTitle>
            <DialogDescription>{t("loansDialog.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {loans.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                <p className="mb-4">{t("loansDialog.noLoans")}</p>
                <Button onClick={handleAddLoan}>
                  <Icons.Plus className="mr-2 h-4 w-4" />
                  {t("loansDialog.addFirstLoan")}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button onClick={handleAddLoan} size="sm">
                    <Icons.Plus className="mr-2 h-4 w-4" />
                    {t("loansDialog.addLoan")}
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
                                  <p className="text-muted-foreground text-xs">
                                    {t("loansDialog.currentBalance")}
                                  </p>
                                  <p className="font-semibold">
                                    {formatCurrency(loan.currentBalance, currency)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    {t("loansDialog.originalAmount")}
                                  </p>
                                  <p className="text-sm">
                                    {formatCurrency(loan.originalAmount, currency)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    {t("loansDialog.interestRate")}
                                  </p>
                                  <p className="text-sm">{formatPercentage(loan.interestRate)}</p>
                                </div>
                                {loan.monthlyPayment && (
                                  <div>
                                    <p className="text-muted-foreground text-xs">
                                      {t("loansDialog.monthlyPayment")}
                                    </p>
                                    <p className="text-sm">
                                      {formatCurrency(loan.monthlyPayment, currency)}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 flex items-center gap-4 text-xs">
                                <span className="text-muted-foreground">
                                  {t("loansDialog.started")}: {formatDate(loan.startDate)}
                                </span>
                                {loan.endDate && (
                                  <span className="text-muted-foreground">
                                    {t("loansDialog.matures")}: {formatDate(loan.endDate)}
                                  </span>
                                )}
                                <span className="text-green-600 dark:text-green-400">
                                  {formatPercentage(paidPercentage)} {t("loansDialog.paidOff")}
                                </span>
                              </div>

                              {loan.notes && (
                                <p className="text-muted-foreground mt-2 text-xs">{loan.notes}</p>
                              )}
                            </div>

                            <div className="ml-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Icons.MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuItem onClick={() => handleEditLoan(loan)}>
                                    <Icons.Pencil className="mr-2 h-4 w-4" />
                                    {t("loansDialog.editLoan")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handlePostponePayments(loan)}>
                                    <Icons.Clock className="mr-2 h-4 w-4" />
                                    {t("loansDialog.postponePayments")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAnticipatedReimbursement(loan)}
                                  >
                                    <Icons.TrendingUp className="mr-2 h-4 w-4" />
                                    {t("loansDialog.extraPayment")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteLoan(loan.id)}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Icons.Trash className="mr-2 h-4 w-4" />
                                    {t("loansDialog.deleteLoan")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

      {selectedLoan && (
        <>
          <PostponePaymentsDialog
            open={postponeDialogOpen}
            onOpenChange={setPostponeDialogOpen}
            loan={selectedLoan}
            currency={currency}
            onConfirm={handleConfirmPostpone}
          />

          <AnticipatedReimbursementDialog
            open={reimbursementDialogOpen}
            onOpenChange={setReimbursementDialogOpen}
            loan={selectedLoan}
            currency={currency}
            onConfirm={handleConfirmReimbursement}
          />
        </>
      )}
    </>
  );
}
