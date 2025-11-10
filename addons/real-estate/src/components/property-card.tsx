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
  const { property, loans, equity, equityPercentage, totalAppreciation, monthlyPayments } =
    metrics;

  const propertyTypeLabels: Record<string, string> = {
    residential: "Residential",
    commercial: "Commercial",
    land: "Land",
    rental: "Rental",
    vacation: "Vacation",
    "mixed-use": "Mixed Use",
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
                  {loans.length} {loans.length === 1 ? "Loan" : "Loans"}
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
              <p className="text-muted-foreground text-xs">Current Value</p>
              <p className="text-lg font-semibold">
                {formatCurrency(property.currentValue, property.currency)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Equity</p>
              <p className="text-lg font-semibold">
                {formatCurrency(equity, property.currency)}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatPercentage(equityPercentage)} of value
              </p>
            </div>
          </div>

          {/* Purchase Info */}
          <div className="border-t pt-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs">Purchase Price</p>
                <p className="text-sm font-medium">
                  {formatCurrency(property.purchasePrice, property.currency)}
                </p>
                <p className="text-muted-foreground text-xs">{formatDate(property.purchaseDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Appreciation</p>
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
                <p className="text-muted-foreground text-xs">Loans</p>
                <Button variant="link" size="sm" className="h-auto p-0" onClick={onManageLoans}>
                  View Details
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs">Total Balance</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(metrics.totalLoanBalance, property.currency)}
                  </p>
                </div>
                {monthlyPayments > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs">Monthly Payment</p>
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
              <p className="text-muted-foreground text-xs">Value History</p>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={onViewValuations}>
                View History
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onAddValuation}
            >
              <Icons.TrendingUp className="mr-2 h-4 w-4" />
              Update Property Value
            </Button>
          </div>

          {/* Actions */}
          <div className="border-t pt-3">
            <Button variant="outline" size="sm" className="w-full" onClick={onAddLoan}>
              <Icons.Plus className="mr-2 h-4 w-4" />
              Add Loan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
