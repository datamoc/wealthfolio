import { Skeleton } from "@/components/ui/skeleton";
import { useBalancePrivacy } from "@/hooks/use-balance-privacy";
import NumberFlow from "@number-flow/react";
import { useMemo } from "react";

interface BalanceProps {
  targetValue: number;
  currency: string;
  displayCurrency?: boolean;
  displayDecimal?: boolean;
  isLoading?: boolean;
  useCompactNotation?: boolean;
}

const Balance: React.FC<BalanceProps> = ({
  targetValue,
  currency = "USD",
  displayCurrency = false,
  displayDecimal = true,
  isLoading = false,
  useCompactNotation = false,
}) => {
  const { isBalanceHidden } = useBalancePrivacy();
  const currencySymbol = useMemo(() => {
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find((part) => part.type === "currency");

    return symbolPart?.value ?? currency;
  }, [currency]);

  if (isLoading) {
    return <Skeleton className="h-9 w-48" />;
  }

  return (
    <h1 className="font-heading text-3xl font-bold tracking-tight">
      {isBalanceHidden ? (
        <span>
          {displayCurrency ? currencySymbol : ""}
          ••••••
        </span>
      ) : (
        <NumberFlow
          className="muted-fraction"
          value={targetValue}
          isolate={false}
          format={{
            currency: currency,
            style: displayCurrency ? "currency" : "decimal",
            currencyDisplay: "narrowSymbol",
            notation: useCompactNotation ? "compact" : "standard",
            minimumFractionDigits: useCompactNotation ? 0 : (displayDecimal ? 2 : 0),
            maximumFractionDigits: useCompactNotation ? 1 : (displayDecimal ? 2 : 0),
          }}
        />
      )}
    </h1>
  );
};

export default Balance;
