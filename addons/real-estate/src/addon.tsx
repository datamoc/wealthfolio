import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AddonContext } from "@wealthfolio/addon-sdk";
import {
  Icons,
  EmptyPlaceholder,
  Button,
  Page,
  PageContent,
  PageHeader,
  Input,
} from "@wealthfolio/ui";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import {
  PortfolioSummaryCard,
  PropertyCard,
  PropertyFormDialog,
  LoanFormDialog,
  LoansDialog,
} from "./components";
import { useRealEstateData } from "./hooks/use-real-estate-data";
import { calculatePropertyMetrics, calculatePortfolioSummary, filterProperties } from "./lib/utils";
import type { Property } from "./lib/types";

/**
 * Main Real Estate Tracker Component
 */
function RealEstateTracker({ ctx }: { ctx: AddonContext }) {
  const { t } = useTranslation("real-estate");
  const { data, isLoading, error, saveProperty, deleteProperty, saveLoan, deleteLoan } =
    useRealEstateData(ctx);

  const [propertyFormOpen, setPropertyFormOpen] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [loansDialogOpen, setLoansDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [selectedPropertyForLoan, setSelectedPropertyForLoan] = useState<Property | undefined>();
  const [selectedPropertyForLoans, setSelectedPropertyForLoans] = useState<Property | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  const properties = data?.properties || [];
  const loans = data?.loans || [];

  // Filter properties based on search
  const filteredProperties = filterProperties(properties, searchTerm);

  // Calculate metrics for each property
  const propertyMetrics = filteredProperties.map((property) =>
    calculatePropertyMetrics(property, loans)
  );

  // Calculate portfolio summary
  const portfolioSummary = calculatePortfolioSummary(properties, loans);

  const handleAddProperty = () => {
    setEditingProperty(undefined);
    setPropertyFormOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setPropertyFormOpen(true);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (confirm(t("delete_confirm"))) {
      try {
        await deleteProperty(propertyId);
      } catch (error) {
        console.error("Failed to delete property:", error);
      }
    }
  };

  const handleAddLoan = (property: Property) => {
    setSelectedPropertyForLoan(property);
    setLoanFormOpen(true);
  };

  const handleManageLoans = (property: Property) => {
    setSelectedPropertyForLoans(property);
    setLoansDialogOpen(true);
  };

  const headerActions = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      {properties.length > 0 && (
        <Input
          placeholder={t("search_placeholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64"
        />
      )}
      <Button onClick={handleAddProperty}>
        <Icons.Plus className="mr-2 h-4 w-4" />
        {t("add_property")}
      </Button>
    </div>
  );

  const header = (
    <PageHeader actions={headerActions}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-xl">{t("title")}</h1>
        </div>
      </div>
    </PageHeader>
  );

  if (isLoading) {
    return (
      <Page>
        {header}
        <PageContent>
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center">
              <Icons.Loader className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
              <p className="text-muted-foreground text-sm">Loading data...</p>
            </div>
          </div>
        </PageContent>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        {header}
        <PageContent>
          <div className="flex min-h-[40vh] items-center justify-center px-4">
            <div className="text-destructive max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
              <h3 className="mb-2 text-base font-semibold">Error Loading Data</h3>
              <p className="text-sm">{error?.message}</p>
            </div>
          </div>
        </PageContent>
      </Page>
    );
  }

  if (properties.length === 0) {
    return (
      <Page>
        {header}
        <PageContent>
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <EmptyPlaceholder className="mt-16">
                <EmptyPlaceholder.Icon name="Home" />
                <EmptyPlaceholder.Title>{t("no_properties_title")}</EmptyPlaceholder.Title>
                <EmptyPlaceholder.Description>
                  {t("no_properties_description")}
                </EmptyPlaceholder.Description>
                <Button onClick={handleAddProperty}>
                  <Icons.Plus className="mr-2 h-4 w-4" />
                  {t("no_properties_action")}
                </Button>
              </EmptyPlaceholder>
            </div>
          </div>
        </PageContent>

        <PropertyFormDialog
          open={propertyFormOpen}
          onOpenChange={setPropertyFormOpen}
          property={editingProperty}
          onSave={saveProperty}
        />
      </Page>
    );
  }

  return (
    <Page>
      {header}
      <PageContent>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          {/* Portfolio Summary */}
          <PortfolioSummaryCard
            summary={portfolioSummary}
            currency={properties[0]?.currency || "USD"}
          />

          {/* Properties Grid */}
          {filteredProperties.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <p>No properties match your search.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {propertyMetrics.map((metrics) => (
                <PropertyCard
                  key={metrics.property.id}
                  metrics={metrics}
                  onEdit={() => handleEditProperty(metrics.property)}
                  onDelete={() => handleDeleteProperty(metrics.property.id)}
                  onAddLoan={() => handleAddLoan(metrics.property)}
                  onManageLoans={() => handleManageLoans(metrics.property)}
                />
              ))}
            </div>
          )}
        </div>
      </PageContent>

      {/* Dialogs */}
      <PropertyFormDialog
        open={propertyFormOpen}
        onOpenChange={setPropertyFormOpen}
        property={editingProperty}
        onSave={saveProperty}
      />

      {selectedPropertyForLoan && (
        <LoanFormDialog
          open={loanFormOpen}
          onOpenChange={setLoanFormOpen}
          propertyId={selectedPropertyForLoan.id}
          onSave={saveLoan}
          currency={selectedPropertyForLoan.currency}
        />
      )}

      {selectedPropertyForLoans && (
        <LoansDialog
          open={loansDialogOpen}
          onOpenChange={setLoansDialogOpen}
          propertyId={selectedPropertyForLoans.id}
          propertyName={selectedPropertyForLoans.name}
          loans={loans.filter((loan) => loan.propertyId === selectedPropertyForLoans.id)}
          currency={selectedPropertyForLoans.currency}
          onSaveLoan={saveLoan}
          onDeleteLoan={deleteLoan}
        />
      )}
    </Page>
  );
}

/**
 * Real Estate Tracker Addon
 *
 * Features:
 * - Track multiple real estate properties
 * - Manage loans/mortgages associated with each property
 * - Calculate equity and appreciation automatically
 * - Portfolio summary with total value, equity, and loans
 * - Property valuation history tracking
 */
export default function enable(ctx: AddonContext) {
  ctx.api.logger.info("🏠 Real Estate Tracker addon is being enabled!");

  const addedItems: Array<{ remove: () => void }> = [];

  try {
    // Add sidebar navigation item
    const sidebarItem = ctx.sidebar.addItem({
      id: "real-estate-tracker",
      label: "Real Estate",
      icon: <Icons.Home className="h-5 w-5" />,
      route: "/addon/real-estate",
      order: 210,
    });
    addedItems.push(sidebarItem);

    ctx.api.logger.debug("Sidebar navigation item added successfully");

    // Create wrapper component with QueryClientProvider
    const RealEstateTrackerWrapper = () => {
      const sharedQueryClient = ctx.api.query.getClient() as QueryClient;
      return (
        <QueryClientProvider client={sharedQueryClient}>
          <RealEstateTracker ctx={ctx} />
        </QueryClientProvider>
      );
    };

    // Register route
    ctx.router.add({
      path: "/addon/real-estate",
      component: React.lazy(() =>
        Promise.resolve({
          default: RealEstateTrackerWrapper,
        })
      ),
    });

    ctx.api.logger.debug("Route registered successfully");
    ctx.api.logger.info("Real Estate Tracker addon enabled successfully");
  } catch (error) {
    ctx.api.logger.error("Failed to initialize addon: " + (error as Error).message);
    throw error;
  }

  // Register cleanup callback
  ctx.onDisable(() => {
    ctx.api.logger.info("🛑 Real Estate Tracker addon is being disabled");

    // Remove UI elements
    addedItems.forEach((item) => {
      try {
        item.remove();
      } catch (error) {
        ctx.api.logger.error("Error removing sidebar item: " + (error as Error).message);
      }
    });

    // Clean up localStorage data
    try {
      localStorage.removeItem("real-estate-data");
      ctx.api.logger.info("Cleaned up real estate data from localStorage");
    } catch (error) {
      ctx.api.logger.error("Error cleaning up localStorage: " + (error as Error).message);
    }

    ctx.api.logger.info("Real Estate Tracker addon disabled successfully");
  });
}
