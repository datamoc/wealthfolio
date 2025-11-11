import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@wealthfolio/ui";
import type { PortfolioSummary } from "../lib/types";
import { formatCurrency, formatPercentage } from "../lib/utils";

interface PortfolioSummaryProps {
  summary: PortfolioSummary;
  currency?: string;
}

export function PortfolioSummaryCard({ summary, currency = "USD" }: PortfolioSummaryProps) {
  const { t } = useTranslation("real-estate");
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("summary_properties")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalProperties}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("summary_total_value")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalValue, currency)}</div>
          <p className="text-muted-foreground text-xs">
            {summary.totalAppreciation >= 0 ? "+" : ""}
            {formatCurrency(summary.totalAppreciation, currency)} {t("summary_appreciation")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("summary_total_equity")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalEquity, currency)}</div>
          <p className="text-muted-foreground text-xs">
            {formatPercentage(summary.averageEquityPercentage)} {t("summary_average")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
