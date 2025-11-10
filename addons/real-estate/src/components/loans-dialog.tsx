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
  const { t } = useTranslation("real-estate");
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
    if (confirm(t("delete_loan_confirm"))) {
      await onDeleteLoan(loanId);
    }
  };

  const loanTypeLabels: Record<string, string> = {
    fixed: t("loan_type_fixed"),
    variable: t("loan_type_variable"),
    adjustable: t("loan_type_adjustable"),
    "interest-only": t("loan_type_interest_only"),
    "home-equity": t("loan_type_home_equity"),
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{t("loans_dialog_title_for", { propertyName })}</DialogTitle>
            <DialogDescription>{t("loans_dialog_description_manage")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {loans.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                <p className="mb-4">{t("no_loans_added")}</p>
                <Button onClick={handleAddLoan}>
                  <Icons.Plus className="mr-2 h-4 w-4" />
                  {t("add_first_loan")}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button onClick={handleAddLoan} size="sm">
                    <Icons.Plus className="mr-2 h-4 w-4" />
                    {t("add_loan")}
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
                                  <p className="text-muted-foreground text-xs">{t("loan_current_balance")}</p>
                                  <p className="font-semibold">
                                    {formatCurrency(loan.currentBalance, currency)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">{t("loan_original_amount")}</p>
                                  <p className="text-sm">
                                    {formatCurrency(loan.originalAmount, currency)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">{t("interest_rate").replace(" (%)", "")}</p>
                                  <p className="text-sm">{formatPercentage(loan.interestRate)}</p>
                                </div>
                                {loan.monthlyPayment && (
                                  <div>
                                    <p className="text-muted-foreground text-xs">{t("monthly_payment")}</p>
                                    <p className="text-sm">
                                      {formatCurrency(loan.monthlyPayment, currency)}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 flex items-center gap-4 text-xs">
                                <span className="text-muted-foreground">
                                  {t("loan_started")} {formatDate(loan.startDate)}
                                </span>
                                {loan.endDate && (
                                  <span className="text-muted-foreground">
                                    {t("loan_matures")} {formatDate(loan.endDate)}
                                  </span>
                                )}
                                <span className="text-green-600 dark:text-green-400">
                                  {formatPercentage(paidPercentage)} {t("loan_paid_off")}
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
