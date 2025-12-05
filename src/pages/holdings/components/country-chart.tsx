import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/ui/icons";
import { Country, Holding } from "@/lib/types";
import { DonutChart, EmptyPlaceholder, Skeleton, toast } from "@wealthfolio/ui";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface CountryChartProps {
  holdings?: Holding[];
  isLoading?: boolean;
  onCountrySectionClick?: (countryName: string) => void;
}

export const CountryChart = ({ holdings, isLoading, onCountrySectionClick }: CountryChartProps) => {
  const { t } = useTranslation("holdings");
  const [activeIndex, setActiveIndex] = useState(0);
  const chartContentRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    // Assume baseCurrency is consistent across holdings or default to USD
    const currency = holdings[0]?.baseCurrency || "USD";

    const countryMap = new Map<string, number>();
    holdings.forEach((holding) => {
      const countries = holding.instrument?.countries;
      const marketValue = Number(holding.marketValue?.base) || 0;

      if (countries && countries.length > 0 && !isNaN(marketValue)) {
        countries.forEach((country: Country) => {
          const currentValue = countryMap.get(country.name) || 0;
          const weight = Number(country.weight) || 0;
          const weightedValue = marketValue * (weight > 1 ? weight / 100 : weight);
          countryMap.set(country.name, currentValue + weightedValue);
        });
      }
    });

    return Array.from(countryMap, ([name, value]) => ({ name, value, currency }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Show top 10 countries
  }, [holdings]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-[180px]" />
            <Skeleton className="h-5 w-[80px]" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex h-[200px] items-center justify-center">
            <Skeleton className="h-[150px] w-[150px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleInternalSectionClick = (sectionData: {
    name: string;
    value: number;
    currency: string;
  }) => {
    if (onCountrySectionClick) {
      onCountrySectionClick(sectionData.name);
    }
    const clickedIndex = data.findIndex((d) => d.name === sectionData.name);
    if (clickedIndex !== -1) {
      setActiveIndex(clickedIndex);
    }
  };

  const handleExportSvgChart = async () => {
    try {
      const { exportSvgToFile } = await import("@/lib/svg-export");
      const success = await exportSvgToFile(chartContentRef.current);
      if (success) {
        toast.success(t("export_svg_success"));
      }
    } catch (error) {
      console.error("Failed to export SVG:", error);
      toast.error(t("export_svg_error"));
    }
  };

  const handleExportSvgFull = async () => {
    try {
      const { exportSvgWithHeader } = await import("@/lib/svg-export");
      const success = await exportSvgWithHeader(
        chartContentRef.current,
        t("country_allocation"),
        "",
      );
      if (success) {
        toast.success(t("export_full_success"));
      }
    } catch (error) {
      console.error("Failed to export full SVG:", error);
      toast.error(t("export_full_error"));
    }
  };

  return (
    <Card className="overflow-hidden backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
            {t("country_allocation")}
          </CardTitle>
          {data.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" className="rounded-full">
                  <Icons.Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportSvgChart}>
                  {t("export_chart")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportSvgFull}>
                  {t("export_full")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0" ref={chartContentRef}>
        {data.length > 0 ? (
          <DonutChart
            data={data}
            activeIndex={activeIndex}
            onSectionClick={handleInternalSectionClick}
            startAngle={180}
            endAngle={0}
            displayTooltip={false}
          />
        ) : (
          <EmptyPlaceholder
            description={t("no_country_data")}
            className="max-h-[160px]"
          />
        )}
      </CardContent>
    </Card>
  );
};
