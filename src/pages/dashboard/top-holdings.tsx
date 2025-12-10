import { TickerAvatar } from "@/components/ticker-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HoldingType } from "@/lib/constants";
import { Holding } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AmountDisplay, Button, GainAmount, GainPercent, getFormattingLocale, Icons } from "@wealthfolio/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useRealEstateProperties, type RealEstateProperty } from "@/hooks/use-real-estate-properties";

const MAX_DISPLAYED_HOLDINGS = 5;
const MAX_STACKED_AVATARS = 5;

// Unified type that can represent both regular holdings and real estate
type DisplayHolding = Holding | {
  id: string;
  instrument?: { symbol: string } | null;
  marketValue?: { base: number } | null;
  unrealizedGain?: { base: number } | null;
  unrealizedGainPct?: number | null;
  quantity?: number | null;
  holdingType: string;
  isRealEstate?: boolean;
};

interface TopHoldingsProps {
  holdings: Holding[];
  isLoading: boolean;
  baseCurrency: string;
}

// Convert real estate property to a holding-like object for display
function convertRealEstateToHolding(property: RealEstateProperty): DisplayHolding {
  // Use equity (currentValue - loanBalance) as the market value
  const equity = property.equity ?? property.currentValue;
  const gain = property.currentValue - property.purchasePrice;
  const gainPercent = property.purchasePrice > 0 ? (gain / property.purchasePrice) : 0;

  return {
    id: `real-estate-${property.id}`,
    instrument: { symbol: property.name },
    marketValue: { base: equity },  // Show equity, not total value
    unrealizedGain: { base: gain },
    unrealizedGainPct: gainPercent,
    quantity: 1, // Real estate is always 1 property
    holdingType: 'real-estate',
    isRealEstate: true,
  };
}

interface HoldingRowProps {
  holding: DisplayHolding;
  baseCurrency: string;
  onClick?: () => void;
  sharesLabel: string;
  locale?: string;
  propertyLabel?: string;
}

function HoldingRow({ holding, baseCurrency, onClick, sharesLabel, locale, propertyLabel }: HoldingRowProps) {
  const isRealEstate = 'isRealEstate' in holding && holding.isRealEstate;
  const symbol = holding.instrument?.symbol ?? holding.id;
  const displayName = symbol.split(".")[0];
  const marketValue = holding.marketValue?.base ?? 0;
  const gainAmount = holding.unrealizedGain?.base ?? 0;
  const gainPercent = holding.unrealizedGainPct ?? 0;
  const shares = holding.quantity ?? 0;
  const quantityLabel = isRealEstate ? (propertyLabel ?? 'property') : sharesLabel;

  return (
    <div
      className="group border-border hover:bg-muted/30 flex cursor-pointer items-center justify-between border-b py-3 transition-colors last:border-0"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div className="flex items-center gap-3">
        <TickerAvatar symbol={symbol} className="size-9" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{displayName}</span>
          <span className="text-muted-foreground text-xs">
            {isRealEstate ? quantityLabel : `${shares.toLocaleString(locale, { maximumFractionDigits: 3 })} ${quantityLabel}`}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <AmountDisplay
          value={marketValue}
          currency={baseCurrency}
          className="text-sm font-semibold"
        />
        <div className="flex items-center gap-2">
          <GainAmount
            value={gainAmount}
            currency={baseCurrency}
            displayCurrency={false}
            className="text-xs"
          />
          <GainPercent
            value={gainPercent}
            variant="badge"
            className="min-w-[60px] justify-center text-xs"
          />
        </div>
      </div>
    </div>
  );
}

interface StackedAvatarsProps {
  holdings: DisplayHolding[];
  totalRemaining: number;
  onClick?: () => void;
  moreHoldingsLabel: string;
  moreLabel: string;
}

function StackedAvatars({ holdings, totalRemaining, onClick, moreHoldingsLabel, moreLabel }: StackedAvatarsProps) {
  const displayedHoldings = holdings.slice(0, MAX_STACKED_AVATARS);
  const extraCount = totalRemaining - displayedHoldings.length;

  return (
    <div
      className="hover:bg-muted/50 border-border flex cursor-pointer items-center gap-2 border-t py-3 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div className="flex items-center">
        {displayedHoldings.map((holding, index) => {
          const symbol = holding.instrument?.symbol ?? holding.id;
          return (
            <div
              key={holding.id}
              className={cn("relative", index > 0 && "-ml-2")}
              style={{ zIndex: displayedHoldings.length - index }}
            >
              <TickerAvatar symbol={symbol} className="ring-background size-8 ring-2" />
            </div>
          );
        })}
      </div>
      <span className="text-muted-foreground text-xs">
        {extraCount > 0 ? `+${totalRemaining} ${moreHoldingsLabel}` : `+${totalRemaining} ${moreLabel}`}
      </span>
      <Icons.ChevronRight className="text-muted-foreground ml-auto h-3 w-3" />
    </div>
  );
}

function TopHoldingsSkeleton({ title }: { title: string }) {
  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="py-2">
        <CardTitle className="text-md">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Card className="w-full shadow-xs">
          <CardContent className="px-4 pt-4 pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-border border-b py-3 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-[60px] rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

interface TopHoldingsEmptyStateProps {
  title: string;
  noHoldingsMessage: string;
  addTransactionLabel: string;
}

function TopHoldingsEmptyState({ title, noHoldingsMessage, addTransactionLabel }: TopHoldingsEmptyStateProps) {
  return (
    <Card className="w-full border-0 bg-transparent p-0 shadow-none">
      <CardHeader className="px-0 py-2">
        <CardTitle className="text-md">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Card className="border-border/50 bg-success/10 w-full shadow-xs">
          <CardContent className="px-4 py-6">
            <div className="text-center">
              <p className="text-sm">{noHoldingsMessage}</p>
              <Link
                to="/activities/manage"
                className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
              >
                {addTransactionLabel}
                <Icons.ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

export function TopHoldings({ holdings, isLoading, baseCurrency }: TopHoldingsProps) {
  const { t } = useTranslation("dashboard");
  const navigate = useNavigate();

  // Get the formatting locale for number display
  const locale = getFormattingLocale();

  // Fetch real estate properties
  const { data: realEstateProperties, isLoading: isLoadingRealEstate } = useRealEstateProperties();

  // Combine holdings with real estate properties and sort by market value
  const sortedHoldings = useMemo(() => {
    const regularHoldings = holdings
      .filter((h) => h.holdingType !== HoldingType.CASH);

    const realEstateHoldings = (realEstateProperties || [])
      .map((property) => convertRealEstateToHolding(property));

    const allHoldings: DisplayHolding[] = [...regularHoldings, ...realEstateHoldings];

    return allHoldings.sort((a, b) => (b.marketValue?.base ?? 0) - (a.marketValue?.base ?? 0));
  }, [holdings, realEstateProperties]);

  const topHoldings = sortedHoldings.slice(0, MAX_DISPLAYED_HOLDINGS);
  const remainingHoldings = sortedHoldings.slice(MAX_DISPLAYED_HOLDINGS);
  const hasRemainingHoldings = remainingHoldings.length > 0;

  if (isLoading || isLoadingRealEstate) {
    return <TopHoldingsSkeleton title={t("top_holdings")} />;
  }

  if (sortedHoldings.length === 0) {
    return (
      <TopHoldingsEmptyState
        title={t("top_holdings")}
        noHoldingsMessage={t("no_holdings_yet")}
        addTransactionLabel={t("add_first_transaction")}
      />
    );
  }

  return (
    <Card className="w-full border-0 bg-transparent p-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between px-0 py-2">
        <CardTitle className="text-md">{t("holdings")}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:bg-success/10 text-xs"
          onClick={() => navigate("/holdings")}
        >
          {t("view_all")}
          <Icons.ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Card className="w-full shadow-xs">
          <CardContent className="px-4 pt-4 pb-2">
            {topHoldings.map((holding) => {
              const isRealEstate = 'isRealEstate' in holding && holding.isRealEstate;
              const symbol = holding.instrument?.symbol ?? holding.id;
              return (
                <HoldingRow
                  key={holding.id}
                  holding={holding}
                  baseCurrency={baseCurrency}
                  onClick={() => {
                    if (!isRealEstate) {
                      navigate(`/holdings/${symbol}`);
                    }
                    // For real estate, we don't navigate anywhere yet
                  }}
                  sharesLabel={t("shares")}
                  propertyLabel={t("property")}
                  locale={locale}
                />
              );
            })}
            {hasRemainingHoldings && (
              <StackedAvatars
                holdings={remainingHoldings}
                totalRemaining={remainingHoldings.length}
                onClick={() => navigate("/holdings")}
                moreHoldingsLabel={t("more_holdings")}
                moreLabel={t("more")}
              />
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

export default TopHoldings;
