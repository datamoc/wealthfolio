import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Icons,
  Badge,
} from "@wealthfolio/ui";
import type { PropertyMetrics } from "../lib/types";
import { formatCurrency, formatPercentage, formatDate } from "../lib/utils";

interface PropertyCardProps {
  metrics: PropertyMetrics;
  onEdit: () => void;
  onDelete: () => void;
  onAddLoan: () => void;
  onManageLoans: () => void;
  onAddValuation: () => void;
  onViewValuations: () => void;
}

export function PropertyCard({
  metrics,
  onEdit,
  onDelete,
  onAddLoan,
  onManageLoans,
  onAddValuation,
  onViewValuations,
}: PropertyCardProps) {
  const { t } = useTranslation("real-estate");
  const { property, loans, equity, equityPercentage, totalAppreciation, monthlyPayments } =
    metrics;

  const propertyTypeLabels: Record<string, string> = {
    residential: t("property_type_residential"),
    commercial: t("property_type_commercial"),
    land: t("property_type_land"),
    rental: t("property_type_rental"),
    vacation: t("property_type_vacation"),
    "mixed-use": t("property_type_mixed_use"),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{property.name}</CardTitle>
            <CardDescription className="mt-1">
              {property.address}
              {property.city && `, ${property.city}`}
            </CardDescription>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary">{propertyTypeLabels[property.type]}</Badge>
              {loans.length > 0 && (
                <Badge variant="outline">
                  {loans.length} {loans.length === 1 ? t("card_loan") : t("card_loans")}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Icons.Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Icons.Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Value and Equity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-xs">{t("card_current_value")}</p>
              <p className="text-lg font-semibold">
                {formatCurrency(property.currentValue, property.currency)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t("card_equity")}</p>
              <p className="text-lg font-semibold">
                {formatCurrency(equity, property.currency)}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatPercentage(equityPercentage)} {t("card_of_value")}
              </p>
            </div>
          </div>

          {/* Purchase Info */}
          <div className="border-t pt-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs">{t("card_purchase_price")}</p>
                <p className="text-sm font-medium">
                  {formatCurrency(property.purchasePrice, property.currency)}
                </p>
                <p className="text-muted-foreground text-xs">{formatDate(property.purchaseDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("card_appreciation")}</p>
                <p
                  className={`text-sm font-medium ${totalAppreciation >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {totalAppreciation >= 0 ? "+" : ""}
                  {formatCurrency(totalAppreciation, property.currency)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {totalAppreciation >= 0 ? "+" : ""}
                  {formatPercentage(metrics.appreciationPercentage)}
                </p>
              </div>
            </div>
          </div>

          {/* Loan Info */}
          {loans.length > 0 && (
            <div className="border-t pt-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-muted-foreground text-xs">{t("card_loans")}</p>
                <Button variant="link" size="sm" className="h-auto p-0" onClick={onManageLoans}>
                  {t("card_view_details")}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs">{t("card_total_balance")}</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(metrics.totalLoanBalance, property.currency)}
                  </p>
                </div>
                {monthlyPayments > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t("card_monthly_payment")}</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(monthlyPayments, property.currency)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Value History */}
          <div className="border-t pt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-muted-foreground text-xs">{t("card_value_history")}</p>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={onViewValuations}>
                {t("card_view_history")}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onAddValuation}
            >
              <Icons.TrendingUp className="mr-2 h-4 w-4" />
              {t("card_update_value")}
            </Button>
          </div>

          {/* Actions */}
          <div className="border-t pt-3">
            <Button variant="outline" size="sm" className="w-full" onClick={onAddLoan}>
              <Icons.Plus className="mr-2 h-4 w-4" />
              {t("card_add_loan")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
