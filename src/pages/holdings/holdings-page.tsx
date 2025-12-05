import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { EmptyPlaceholder, Page, PageContent, PageHeader } from "@wealthfolio/ui";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { AccountSelector } from "@/components/account-selector";
import { useAccounts } from "@/hooks/use-accounts";
import { useHoldings } from "@/hooks/use-holdings";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { PORTFOLIO_ACCOUNT_ID } from "@/lib/constants";
import { Account, HoldingType } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { HoldingsMobileFilterSheet } from "./components/holdings-mobile-filter-sheet";
import { HoldingsTable } from "./components/holdings-table";
import { HoldingsTableMobile } from "./components/holdings-table-mobile";

export const HoldingsPage = () => {
<<<<<<< HEAD
  const { t } = useTranslation("holdings");
=======
  const navigate = useNavigate();
>>>>>>> upstream/main
  const [selectedAccount, setSelectedAccount] = useState<Account | null>({
    id: PORTFOLIO_ACCOUNT_ID,
    name: t("all_portfolio"),
    accountType: "PORTFOLIO" as unknown as Account["accountType"],
    balance: 0,
    currency: "USD",
    isDefault: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Account);

  const { holdings, isLoading } = useHoldings(selectedAccount?.id ?? PORTFOLIO_ACCOUNT_ID);
  const { accounts } = useAccounts();

  // Mobile filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
<<<<<<< HEAD

  const handleChartSectionClick = (
    type: SheetFilterType,
    name: string,
    title?: string,
    compositionId?: Instrument["id"],
    _accountIdsForFilter?: string[],
  ) => {
    setSheetFilterType(type);
    setSheetFilterName(name);
    setSheetTitle(title ?? t("details_for", { name }));
    if (type === "composition" && compositionId) {
      setSheetCompositionFilter(compositionId);
    } else {
      setSheetCompositionFilter(null);
    }
    setIsSheetOpen(true);
  };

  const holdingsForSheet = useMemo(() => {
    if (!sheetFilterType || !holdings) {
      return [];
    }

    let filteredHoldings: Holding[] = [];

    switch (sheetFilterType) {
      case "class":
        filteredHoldings = holdings.filter((h) => {
          const isCash = h.holdingType === HoldingType.CASH;
          const assetSubClass = isCash ? t("cash") : (h.instrument?.assetSubclass ?? t("other"));
          return assetSubClass === sheetFilterName;
        });
        break;
      case "sector":
        filteredHoldings = holdings.filter((h) =>
          h.instrument?.sectors?.some((s) => s.name === sheetFilterName),
        );
        break;
      case "country":
        filteredHoldings = holdings.filter((h) =>
          h.instrument?.countries?.some((c) => c.name === sheetFilterName),
        );
        break;
      case "currency":
        filteredHoldings = holdings.filter((h) => h.localCurrency === sheetFilterName);
        break;
      case "composition":
        if (sheetCompositionFilter) {
          filteredHoldings = holdings.filter((h) => h.instrument?.id === sheetCompositionFilter);
        } else if (sheetFilterName) {
          filteredHoldings = holdings.filter(
            (h) =>
              h.instrument?.assetSubclass === sheetFilterName ||
              h.instrument?.assetClass === sheetFilterName,
          );
        }
        break;
      default:
        break;
    }

    return filteredHoldings.sort((a, b) => {
      const bBase = b.marketValue?.base ?? 0;
      const aBase = a.marketValue?.base ?? 0;
      return Number(bBase) - Number(aBase);
    });
  }, [holdings, sheetFilterType, sheetFilterName, sheetCompositionFilter]);
=======
  const [sortBy, setSortBy] = usePersistentState<"symbol" | "marketValue">(
    "holdings-sort-by",
    "marketValue",
  );
  const [showTotalReturn, setShowTotalReturn] = usePersistentState<boolean>(
    "holdings-show-total-return",
    true,
  );
>>>>>>> upstream/main

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
  };

  const { nonCashHoldings, filteredNonCashHoldings } = useMemo(() => {
    const nonCash =
      holdings?.filter((holding) => holding.holdingType?.toLowerCase() !== HoldingType.CASH) ?? [];

    // Apply asset type filter
    const filtered =
      selectedTypes.length > 0
        ? nonCash.filter(
            (holding) =>
              holding.instrument?.assetSubclass &&
              selectedTypes.includes(holding.instrument.assetSubclass),
          )
        : nonCash;

    return { nonCashHoldings: nonCash, filteredNonCashHoldings: filtered };
  }, [holdings, selectedTypes]);

  const hasActiveFilters = useMemo(() => {
    const hasAccountFilter = selectedAccount?.id !== PORTFOLIO_ACCOUNT_ID;
    const hasTypeFilter = selectedTypes.length > 0;
    return hasAccountFilter || hasTypeFilter;
  }, [selectedAccount, selectedTypes]);

  // Check if there are no holdings at all (excluding cash holdings)
  const hasNoHoldings = !isLoading && (!nonCashHoldings || nonCashHoldings.length === 0);

  const renderEmptyState = () => (
    <div className="flex items-center justify-center py-16">
      <EmptyPlaceholder
        icon={<Icons.TrendingUp className="text-muted-foreground h-10 w-10" />}
        title="No holdings yet"
        description="Get started by adding your first transaction or quickly import your existing holdings from a CSV file."
      >
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button size="default" onClick={() => navigate("/activities/manage")}>
            <Icons.Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
          <Button size="default" variant="outline" onClick={() => navigate("/import")}>
            <Icons.Import className="mr-2 h-4 w-4" />
            Import from CSV
          </Button>
        </div>
      </EmptyPlaceholder>
    </div>
  );

  const renderHoldingsView = () => {
    if (hasNoHoldings) {
      return renderEmptyState();
    }

<<<<<<< HEAD
      {/* Top row: Summary widgets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HoldingCurrencyChart
          holdings={[...cashHoldings, ...filteredNonCashHoldings]}
          baseCurrency={settings?.baseCurrency ?? "USD"}
          isLoading={isLoading}
          onCurrencySectionClick={(currencyName) =>
            handleChartSectionClick("currency", currencyName, t("holdings_in_currency", { currency: currencyName }))
          }
        />

        <AccountAllocationChart isLoading={isLoading} />

        <ClassesChart
          holdings={[...cashHoldings, ...filteredNonCashHoldings]}
          isLoading={isLoading}
          onClassSectionClick={(className) =>
            handleChartSectionClick("class", className, t("asset_class_filter", { className }))
          }
        />

        <CountryChart
          holdings={filteredNonCashHoldings}
          isLoading={isLoading}
          onCountrySectionClick={(countryName) =>
            handleChartSectionClick("country", countryName, t("holdings_in_country", { country: countryName }))
          }
        />
      </div>

      {/* Second row: Composition and Sector */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="col-span-1 lg:col-span-3">
          <PortfolioComposition holdings={filteredNonCashHoldings ?? []} isLoading={isLoading} />
        </div>

        {/* Sectors Chart - Now self-contained */}
        <div className="col-span-1">
          <SectorsChart
            holdings={filteredNonCashHoldings}
            isLoading={isLoading}
            onSectorSectionClick={(sectorName) =>
              handleChartSectionClick("sector", sectorName, t("holdings_in_sector", { sector: sectorName }))
            }
          />
        </div>
      </div>
    </div>
  );

  const views: SwipablePageView[] = [
    { value: "holdings", label: t("holdings"), content: renderHoldingsView() },
    { value: "analytics", label: t("insights"), content: renderAnalyticsView() },
  ];
=======
    return (
      <div className="space-y-4">
        <div className="hidden md:block">
          <HoldingsTable
            holdings={filteredNonCashHoldings ?? []}
            isLoading={isLoading}
            showTotalReturn={showTotalReturn}
            setShowTotalReturn={setShowTotalReturn}
          />
        </div>
        <div className="block md:hidden">
          <HoldingsTableMobile
            holdings={nonCashHoldings ?? []}
            isLoading={isLoading}
            selectedTypes={selectedTypes}
            setSelectedTypes={setSelectedTypes}
            selectedAccount={selectedAccount}
            accounts={accounts ?? []}
            onAccountChange={handleAccountSelect}
            showSearch={true}
            showFilterButton={false}
            sortBy={sortBy}
            showTotalReturn={showTotalReturn}
          />
        </div>
      </div>
    );
  };
>>>>>>> upstream/main

  const filterButton = (
    <Button
      variant="outline"
      size="icon"
      className="relative size-9 flex-shrink-0"
      onClick={() => setIsFilterSheetOpen(true)}
    >
      <Icons.ListFilter className="h-4 w-4" />
      {hasActiveFilters && (
        <span className="bg-destructive absolute top-0.5 right-0 h-2 w-2 rounded-full" />
      )}
    </Button>
  );

  const headerActions = (
    <div className="flex items-center gap-2">
      {/* Mobile: Only show filter button */}
      <div className="md:hidden">{filterButton}</div>

      {/* Desktop: Show account selector */}
      <div className="hidden md:flex md:items-center md:gap-2">
        <AccountSelector
          selectedAccount={selectedAccount}
          setSelectedAccount={handleAccountSelect}
          variant="dropdown"
          includePortfolio={true}
          className="h-9"
        />
      </div>
    </div>
  );

  return (
<<<<<<< HEAD
    <>
      <SwipablePage
        views={views}
        heading={t("holdings")}
        defaultView="holdings"
        isMobile={isMobilePlatform}
        actions={renderActions}
        withPadding={false}
        onViewChange={triggerHaptic}
      />
=======
    <Page>
      <PageHeader heading="Holdings" onBack={() => navigate(-1)} actions={headerActions} />
      <PageContent>{renderHoldingsView()}</PageContent>
>>>>>>> upstream/main

      {/* Mobile Filter Sheet */}
      <HoldingsMobileFilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        selectedAccount={selectedAccount}
        accounts={accounts ?? []}
        onAccountChange={handleAccountSelect}
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showTotalReturn={showTotalReturn}
        setShowTotalReturn={setShowTotalReturn}
      />
<<<<<<< HEAD

      {/* Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          className="w-full overflow-y-auto sm:max-w-lg [&>button]:top-[max(calc(env(safe-area-inset-top,0px)+1rem),2.5rem)]"
          style={{
            paddingTop: "max(env(safe-area-inset-top, 0px), 1.5rem)",
          }}
        >
          <SheetHeader className="mt-8">
            <SheetTitle>{sheetTitle}</SheetTitle>
          </SheetHeader>
          <div className="py-8">
            {holdingsForSheet.length > 0 ? (
              <ul className="space-y-2">
                {holdingsForSheet.map((holding) => {
                  let displayName = "N/A";
                  let symbol = "-";
                  if (holding.holdingType === HoldingType.CASH) {
                    displayName = holding.localCurrency
                      ? `${t("cash")} (${holding.localCurrency})`
                      : t("cash");
                    symbol = `$CASH-${holding.localCurrency}`;
                  } else if (holding.instrument) {
                    displayName =
                      holding.instrument.name ?? holding.instrument.symbol ?? t("unnamed_security");
                    symbol = holding.instrument.symbol ?? "-";
                  }

                  return (
                    <Card key={holding.id} className="flex items-center justify-between text-sm">
                      <CardHeader className="flex w-full flex-row items-center justify-between space-x-2 p-4">
                        <div className="flex items-center space-x-2">
                          <Badge className="flex min-w-[50px] cursor-pointer items-center justify-center rounded-sm">
                            {symbol}
                          </Badge>
                          <CardTitle className="line-clamp-1 text-sm font-normal">
                            {displayName}
                          </CardTitle>
                        </div>
                        <div className="text-right font-semibold">
                          <AmountDisplay
                            value={Number(holding.marketValue?.base ?? 0)}
                            currency={holding.baseCurrency}
                          />
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </ul>
            ) : (
              <p>{t("no_holdings_selection")}</p>
            )}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">{t("close")}</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
=======
    </Page>
>>>>>>> upstream/main
  );
};

export default HoldingsPage;
