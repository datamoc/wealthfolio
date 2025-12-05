import { Holding, HoldingType } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DonutChart,
  EmptyPlaceholder,
  Skeleton,
  toast,
} from "@wealthfolio/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/ui/icons";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type TranslateFn = ReturnType<typeof useTranslation<"holdings">>["t"];

function getClassData(holdings: Holding[], t: TranslateFn) {
  if (!holdings?.length) return [];

  const currency = holdings[0]?.baseCurrency || "USD";

  const classes = holdings.reduce(
    (acc, holding) => {
      const isCash = holding.holdingType === HoldingType.CASH;
      const assetSubClass = isCash ? t("cash") : holding.instrument?.assetSubclass || t("other");

      const current = acc[assetSubClass] || 0;
      const value = Number(holding.marketValue?.base) || 0;
      acc[assetSubClass] = current + value;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(classes)
    .filter(([_, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value, currency }));
}

interface ClassesChartProps {
  holdings?: Holding[];
  isLoading?: boolean;
  onClassSectionClick?: (className: string) => void;
}

export function ClassesChart({ holdings, isLoading, onClassSectionClick }: ClassesChartProps) {
  const { t } = useTranslation("holdings");
  const [activeIndex, setActiveIndex] = useState(0);
  const chartContentRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => getClassData(holdings ?? [], t), [holdings, t]);

  const handleInternalSectionClick = (sectionData: {
    name: string;
    value: number;
    currency: string;
  }) => {
    if (onClassSectionClick) {
      onClassSectionClick(sectionData.name);
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
        t("asset_allocation"),
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
          <div className="flex h-[250px] items-center justify-center">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
            {t("asset_allocation")}
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
          />
        ) : (
          <EmptyPlaceholder description={t("no_class_data")} />
        )}
      </CardContent>
    </Card>
  );
}
