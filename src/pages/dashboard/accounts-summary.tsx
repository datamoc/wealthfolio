"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/hooks/use-accounts";
import { useLatestValuations } from "@/hooks/use-latest-valuations";
import { useRealEstateSummary } from "@/hooks/use-real-estate-summary";
import { useSettingsContext } from "@/lib/settings-provider";
import type { AccountValuation } from "@/lib/types";
import { calculatePerformanceMetrics } from "@/lib/utils";
import { GainAmount, GainPercent, PrivacyAmount } from "@wealthfolio/ui";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface AccountSummaryDisplayData {
  accountName: string;
  baseCurrency: string;
  totalValueBaseCurrency: number;
  totalGainLossAmountBaseCurrency: number | null;
  totalValueAccountCurrency?: number;
  totalGainLossAmountAccountCurrency?: number | null;
  accountCurrency?: string;
  totalGainLossPercent: number | null;
  accountId?: string;
  accountType?: string;
  accountGroup?: string | null;
  isGroup?: boolean;
  accountCount?: number;
  accounts?: AccountSummaryDisplayData[];
  displayInAccountCurrency?: boolean;
  singularLabel?: string;
  pluralLabel?: string;
}

const AccountSummarySkeleton = () => (
  <div className="flex w-full items-center justify-between gap-3">
    <div className="flex min-w-0 flex-1 flex-col gap-1 md:gap-1.5">
      <Skeleton className="h-5 w-40 rounded md:h-6" />
      <Skeleton className="h-4 w-32 rounded md:h-4" />
    </div>
    <div className="flex shrink-0 items-center gap-2 md:gap-3">
      <div className="flex min-h-[3rem] flex-col items-end justify-center gap-1 md:gap-1.5">
        <Skeleton className="h-5 w-24 rounded md:h-6" />
        <Skeleton className="h-4 w-32 rounded md:h-4" />
      </div>
      <div className="flex items-center justify-center">
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    </div>
  </div>
);

const AccountSummaryComponent = React.memo(
  ({
    item,
    isExpanded = false,
    onToggle,
    isLoadingValuation = false,
    displayInAccountCurrency = false,
    isNested = false,
  }: {
    item: AccountSummaryDisplayData;
    isExpanded?: boolean;
    onToggle?: () => void;
    isLoadingValuation?: boolean;
    displayInAccountCurrency?: boolean;
    isNested?: boolean;
  }) => {
    const isGroup = item.isGroup ?? false;
    const useAccountCurrency =
      displayInAccountCurrency || (item.displayInAccountCurrency && Boolean(item.accountCurrency));

    if (!isGroup && isLoadingValuation) {
      const skeletonContent = <AccountSummarySkeleton />;

      if (isNested) {
        return (
          <div className="flex w-full items-center justify-between gap-3">{skeletonContent}</div>
        );
      }

      return (
        <div className="border-border bg-card flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-xs md:px-5 md:py-4">
          {skeletonContent}
        </div>
      );
    }

    const name = item.accountName;
    const accountId = item.accountId;

    const subText = isGroup
      ? `${item.accountCount} ${item.accountCount === 1 ? item.singularLabel : item.pluralLabel}`
      : useAccountCurrency
        ? (item.accountCurrency ?? item.baseCurrency)
        : item.baseCurrency;

    const totalValue = useAccountCurrency
      ? (item.totalValueAccountCurrency ?? 0)
      : item.totalValueBaseCurrency;
    const currency = useAccountCurrency
      ? (item.accountCurrency ?? item.baseCurrency)
      : item.baseCurrency;

    const gainAmountToDisplay = useAccountCurrency
      ? item.totalGainLossAmountAccountCurrency
      : item.totalGainLossAmountBaseCurrency;
    const gainDisplayCurrency = currency;
    const gainPercentToDisplay = item.totalGainLossPercent;

    const content = (
      <>
        <div className="flex min-w-0 flex-1 flex-col gap-1 md:gap-1.5">
          <h3 className="truncate text-sm leading-tight font-semibold md:text-base md:font-semibold">
            {name}
          </h3>
          <p className="text-muted-foreground truncate text-xs md:text-sm">{subText}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <div className="flex min-h-[3rem] flex-col items-end justify-center gap-1 md:gap-1.5">
            <p className="text-sm leading-tight font-semibold md:text-base md:font-semibold">
              <PrivacyAmount value={totalValue} currency={currency} />
            </p>
            {(gainAmountToDisplay !== null || gainPercentToDisplay !== null) &&
              !(gainAmountToDisplay === 0 && gainPercentToDisplay === 0) && (
                <div className="flex items-center gap-1.5 md:gap-2">
                  {gainAmountToDisplay !== null && (
                    <GainAmount
                      className="text-xs font-medium md:text-sm md:font-medium"
                      value={gainAmountToDisplay ?? 0}
                      currency={gainDisplayCurrency}
                      displayCurrency={false}
                      showSign={false}
                    />
                  )}
                  {gainAmountToDisplay !== null && gainPercentToDisplay !== null && (
                    <Separator orientation="vertical" className="h-3 md:h-4" />
                  )}
                  {gainPercentToDisplay !== null && (
                    <GainPercent
                      className="text-xs font-medium md:text-sm md:font-medium"
                      value={gainPercentToDisplay}
                    />
                  )}
                </div>
              )}
          </div>
          {isGroup ? (
            <div className="flex items-center justify-center">
              <Icons.ChevronDown
                className={`text-muted-foreground h-5 w-5 shrink-0 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          ) : (
            !isLoadingValuation &&
            accountId && (
              <div className="flex items-center justify-center">
                <Icons.ChevronRight className="text-muted-foreground h-5 w-5 shrink-0" />
              </div>
            )
          )}
        </div>
      </>
    );

    if (isGroup) {
      return (
        <div
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg p-3 transition-colors duration-150 md:p-4"
        >
          {content}
        </div>
      );
    }

    if (!isLoadingValuation && accountId) {
      if (isNested) {
        return (
          <Link
            to={`/accounts/${accountId}`}
            className="flex w-full cursor-pointer items-center justify-between gap-3"
          >
            {content}
          </Link>
        );
      }
      return (
        <Link
          to={`/accounts/${accountId}`}
          className="border-border bg-card flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-xs transition-all duration-150 hover:shadow-md md:px-5 md:py-4"
        >
          {content}
        </Link>
      );
    }

    return (
      <div className="border-border bg-card flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-xs md:px-5 md:py-4">
        {content}
      </div>
    );
  },
);
AccountSummaryComponent.displayName = "AccountSummaryComponent";

export const AccountsSummary = React.memo(() => {
  const { t } = useTranslation("dashboard");
  const { accountsGrouped, setAccountsGrouped, settings } = useSettingsContext();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const {
    accounts,
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    error: errorAccounts,
  } = useAccounts();

  const accountIds = useMemo(() => accounts?.map((acc) => acc.id) ?? [], [accounts]);

  const { latestValuations, isLoading: isLoadingValuations } = useLatestValuations(accountIds);

  const baseCurrency = settings?.baseCurrency ?? "USD";
  const { data: realEstateSummary } = useRealEstateSummary(baseCurrency);

  const combinedAccountViews = useMemo((): AccountSummaryDisplayData[] => {
    if (!accounts) return [];
    const valuationMap = new Map<string, AccountValuation>();
    if (latestValuations) {
      latestValuations.forEach((val: AccountValuation) => valuationMap.set(val.accountId, val));
    }
    const accountViews = accounts.map((acc): AccountSummaryDisplayData => {
      const valuation = valuationMap.get(acc.id);

      if (!valuation) {
        return {
          accountName: acc.name,
          totalValueBaseCurrency: 0,
          baseCurrency,
          accountCurrency: acc.currency,
          totalGainLossAmountBaseCurrency: null,
          totalGainLossPercent: null,
          accountId: acc.id,
          accountType: acc.accountType,
          accountGroup: acc.group ?? null,
          isGroup: false,
        };
      }

      const { gainLossAmount, simpleReturn } = calculatePerformanceMetrics([valuation], true);

      const totalValueAccountCurrency = valuation.totalValue;
      const fxRate = valuation.fxRateToBase ?? 1;
      const totalValueBaseCurrency = totalValueAccountCurrency * fxRate;
      const totalGainLossAmountAccountCurrency = gainLossAmount;
      const totalGainLossAmountBaseCurrency = gainLossAmount * fxRate;

      return {
        accountName: acc.name,
        totalValueBaseCurrency,
        baseCurrency,
        totalGainLossAmountBaseCurrency,
        totalValueAccountCurrency,
        accountCurrency: valuation.accountCurrency,
        totalGainLossAmountAccountCurrency,
        totalGainLossPercent: simpleReturn,
        accountId: acc.id,
        accountType: acc.accountType,
        accountGroup: acc.group ?? null,
        isGroup: false,
      };
    });

    // Add real estate as a separate entry if there are any properties
    if (realEstateSummary && realEstateSummary.propertyCount > 0) {
      const realEstateEquity = realEstateSummary.totalEquity;
      const realEstateAppreciation = realEstateSummary.totalAppreciation;
      const realEstateAppreciationPercent = realEstateSummary.appreciationPercent;

      accountViews.push({
        accountName: t("real_estate"),
        totalValueBaseCurrency: realEstateEquity,
        baseCurrency,
        totalGainLossAmountBaseCurrency: realEstateAppreciation,
        totalGainLossPercent: realEstateAppreciationPercent,
        // Also set account currency values so it displays correctly when displayInAccountCurrency is true
        totalValueAccountCurrency: realEstateEquity,
        totalGainLossAmountAccountCurrency: realEstateAppreciation,
        accountType: "REAL_ESTATE",
        accountGroup: null,
        isGroup: false,
        // accountCurrency will be undefined, so it will show baseCurrency as subtext
        // No accountId so it won't be clickable
      });
    }

    return accountViews;
  }, [accounts, latestValuations, baseCurrency, realEstateSummary, t]);

  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  }, []);

  const renderedContent = useMemo(() => {
    if (isLoadingAccounts) {
      return Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="border-border bg-card rounded-lg border px-4 py-3 shadow-xs md:px-5 md:py-4"
        >
          <AccountSummarySkeleton />
        </div>
      ));
    }

    if (isErrorAccounts) {
      return (
        <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4 md:p-5">
          <p className="text-destructive text-sm font-medium">
            {t("error_loading_accounts")}: {errorAccounts?.message}
          </p>
        </div>
      );
    }

    if (!combinedAccountViews || combinedAccountViews.length === 0) {
      return (
        <div className="border-border/50 bg-success/10 rounded-lg border p-6 text-center md:p-8">
          <p className="text-sm">{t("no_accounts_found")}</p>
          <Link
            to="/settings/accounts"
            className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
          >
            {t("add_first_account")}
            <Icons.ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      );
    }

    const isLoadingPerformance = isLoadingValuations;

    if (accountsGrouped) {
      const groups: Record<string, AccountSummaryDisplayData[]> = {};
      const standaloneAccounts: AccountSummaryDisplayData[] = [];

      combinedAccountViews.forEach((account) => {
        const groupName = account.accountGroup ?? t("uncategorized");
        if (groupName === t("uncategorized")) {
          standaloneAccounts.push(account);
        } else {
          if (!groups[groupName]) {
            groups[groupName] = [];
          }
          groups[groupName].push(account);
        }
      });

      const actualGroups: AccountSummaryDisplayData[] = [];

      Object.entries(groups).forEach(([groupName, groupAccounts]) => {
        if (groupAccounts.length === 1) {
          standaloneAccounts.push(groupAccounts[0]);
        } else {
          const baseCurrency = groupAccounts[0]?.baseCurrency ?? settings?.baseCurrency ?? "USD";
          const groupCurrencies = new Set(
            groupAccounts
              .map((acc) => acc.accountCurrency ?? acc.baseCurrency)
              .filter((currency): currency is string => Boolean(currency)),
          );
          const groupDisplaysAccountCurrency = groupCurrencies.size === 1;
          const groupDisplayCurrency = groupDisplaysAccountCurrency
            ? (groupAccounts[0]?.accountCurrency ?? groupAccounts[0]?.baseCurrency ?? baseCurrency)
            : baseCurrency;

          const totalValueBaseCurrency = groupAccounts.reduce(
            (sum, acc) => sum + Number(acc.totalValueBaseCurrency),
            0,
          );

          const totalGainLossAmountBase = groupAccounts.reduce(
            (sum, acc) => sum + Number(acc.totalGainLossAmountBaseCurrency ?? 0),
            0,
          );

          const totalNetContributionBase = groupAccounts.reduce((sum, acc) => {
            const netContribution =
              Number(acc.totalValueBaseCurrency) - Number(acc.totalGainLossAmountBaseCurrency ?? 0);
            return sum + netContribution;
          }, 0);

          const groupTotalReturnPercentBase =
            totalNetContributionBase !== 0
              ? totalGainLossAmountBase / totalNetContributionBase
              : null;

          const totalValueAccountCurrency = groupDisplaysAccountCurrency
            ? groupAccounts.reduce(
                (sum, acc) =>
                  sum + Number(acc.totalValueAccountCurrency ?? acc.totalValueBaseCurrency),
                0,
              )
            : undefined;

          const totalGainLossAmountAccountCurrency = groupDisplaysAccountCurrency
            ? groupAccounts.reduce(
                (sum, acc) => sum + Number(acc.totalGainLossAmountAccountCurrency ?? 0),
                0,
              )
            : undefined;

          const totalNetContributionAccountCurrency = groupDisplaysAccountCurrency
            ? groupAccounts.reduce((sum, acc) => {
                const accountValue = Number(
                  acc.totalValueAccountCurrency ?? acc.totalValueBaseCurrency,
                );
                const accountGainLoss = Number(acc.totalGainLossAmountAccountCurrency ?? 0);
                return sum + (accountValue - accountGainLoss);
              }, 0)
            : undefined;

          const groupTotalReturnPercent = groupDisplaysAccountCurrency
            ? totalNetContributionAccountCurrency !== undefined &&
              totalNetContributionAccountCurrency !== 0
              ? (totalGainLossAmountAccountCurrency ?? 0) / totalNetContributionAccountCurrency
              : null
            : groupTotalReturnPercentBase;

          actualGroups.push({
            accountName: groupName,
            totalValueBaseCurrency,
            baseCurrency,
            totalGainLossAmountBaseCurrency: totalGainLossAmountBase,
            totalGainLossPercent: groupTotalReturnPercent,
            accountCurrency: groupDisplayCurrency,
            totalValueAccountCurrency,
            totalGainLossAmountAccountCurrency: totalGainLossAmountAccountCurrency ?? null,
            isGroup: true,
            accountCount: groupAccounts.length,
            accounts: groupAccounts,
            displayInAccountCurrency: groupDisplaysAccountCurrency,
            singularLabel: t("account"),
            pluralLabel: t("accounts_plural"),
          });
        }
      });

      actualGroups.sort(
        (a, b) => Number(b.totalValueBaseCurrency) - Number(a.totalValueBaseCurrency),
      );
      standaloneAccounts.sort(
        (a, b) => Number(b.totalValueBaseCurrency) - Number(a.totalValueBaseCurrency),
      );

      return (
        <>
          {actualGroups.map((group) => {
            const isExpanded = expandedGroups[group.accountName];
            const sortedAccounts = [...(group.accounts ?? [])].sort(
              (a, b) => Number(b.totalValueBaseCurrency) - Number(a.totalValueBaseCurrency),
            );

            return (
              <div
                key={group.accountName}
                className="border-border bg-card overflow-hidden rounded-lg border shadow-xs transition-shadow duration-150 hover:shadow-md"
              >
                <div className="cursor-pointer">
                  <AccountSummaryComponent
                    item={group}
                    isExpanded={isExpanded}
                    onToggle={() => toggleGroup(group.accountName)}
                  />
                </div>
                {isExpanded && (
                  <div className="border-border/50 border-t">
                    <div className="divide-border/50 divide-y">
                      {sortedAccounts.map((account) => (
                        <div key={account.accountId} className="px-4 py-3 md:px-5 md:py-4">
                          <AccountSummaryComponent
                            item={account}
                            isLoadingValuation={isLoadingPerformance}
                            displayInAccountCurrency
                            isNested
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {standaloneAccounts.map((account) => (
            <AccountSummaryComponent
              key={account.accountId}
              item={account}
              isLoadingValuation={isLoadingPerformance}
              displayInAccountCurrency
            />
          ))}
        </>
      );
    } else {
      const sortedAccounts = [...combinedAccountViews].sort(
        (a, b) => Number(b.totalValueBaseCurrency) - Number(a.totalValueBaseCurrency),
      );

      return sortedAccounts.map((account) => (
        <AccountSummaryComponent
          key={account.accountId}
          item={account}
          isLoadingValuation={isLoadingPerformance}
          displayInAccountCurrency
        />
      ));
    }
  }, [
    combinedAccountViews,
    accountsGrouped,
    expandedGroups,
    toggleGroup,
    isLoadingAccounts,
    isLoadingValuations,
    isErrorAccounts,
    errorAccounts,
    settings?.baseCurrency,
  ]);

  return (
    <div className="mb-4 w-full space-y-0">
      <div className="flex flex-row items-center justify-between gap-2 pb-2">
        <h2 className="text-md font-semibold tracking-tight">{t("accounts")}</h2>
        <Button
          variant="outline"
          className="hover:bg-success/10 rounded-lg bg-transparent transition-colors duration-150"
          size="sm"
          onClick={() => setAccountsGrouped(!accountsGrouped)}
          aria-label={accountsGrouped ? t("list_view") : t("group_view")}
          title={accountsGrouped ? t("switch_to_list_view") : t("switch_to_group_view")}
          disabled={isLoadingAccounts || combinedAccountViews.length === 0}
        >
          {accountsGrouped ? (
            <Icons.ListCollapse className="h-4 w-4" />
          ) : (
            <Icons.Group className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="space-y-2 md:space-y-3">{renderedContent}</div>
    </div>
  );
});
AccountsSummary.displayName = "AccountsSummary";
