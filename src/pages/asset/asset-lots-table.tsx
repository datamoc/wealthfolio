import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Lot } from "@/lib/types";
import { formatAmount } from "@wealthfolio/ui";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { GainAmount } from "@wealthfolio/ui";
import { GainPercent } from "@wealthfolio/ui";
import { useTranslation } from "react-i18next";

interface AssetLotsTableProps {
  lots: Lot[];
  currency: string;
  marketPrice: number;
}

export const AssetLotsTable = ({ lots, currency, marketPrice }: AssetLotsTableProps) => {
  const { t } = useTranslation("asset");

  if (!lots || lots.length === 0) {
    return null;
  }

  const sortedLots = [...lots].sort(
    (a, b) => new Date(a.acquisitionDate).getTime() - new Date(b.acquisitionDate).getTime(),
  );

  return (
    <Card className="mt-4">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-[160px]">{t("acquired_date")}</TableHead>
                <TableHead className="text-right">{t("quantity")}</TableHead>
                <TableHead className="text-right">{t("acquisition_price")}</TableHead>
                <TableHead className="text-right">{t("fees")}</TableHead>
                <TableHead className="text-right">{t("cost_basis")}</TableHead>
                <TableHead className="text-right">{t("market_value")}</TableHead>
                <TableHead className="text-right">{t("gain_loss")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLots.map((lot) => {
                const marketValue = lot.quantity * marketPrice;
                const gainLossAmount = marketValue - lot.costBasis;
                const gainLossPercent = lot.costBasis !== 0 ? gainLossAmount / lot.costBasis : 0;

                return (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium">{formatDate(lot.acquisitionDate)}</TableCell>
                    <TableCell className="text-right">{lot.quantity.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {formatAmount(lot.acquisitionPrice, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(lot.acquisitionFees, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(lot.costBasis, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(marketValue, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-row items-center justify-end space-x-2">
                        <GainAmount
                          value={gainLossAmount}
                          currency={currency}
                          displayCurrency={false}
                        />
                        <GainPercent value={gainLossPercent} variant="badge" />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetLotsTable;
