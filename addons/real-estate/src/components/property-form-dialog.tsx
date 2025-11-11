import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@wealthfolio/ui";
import { worldCurrencies } from "@wealthfolio/ui";
import type { Property, PropertyType } from "../lib/types";
import { generateId, getCurrencyForCountry } from "../lib/utils";

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property;
  onSave: (property: Property) => Promise<void>;
}

const popularCurrencies = ["USD", "CAD", "EUR", "GBP", "AUD", "CHF", "JPY"];

export function PropertyFormDialog({
  open,
  onOpenChange,
  property,
  onSave,
}: PropertyFormDialogProps) {
  const { t } = useTranslation("real-estate");

  const propertyTypes: { value: PropertyType; label: string }[] = [
    { value: "residential", label: t("property_type_residential") },
    { value: "commercial", label: t("property_type_commercial") },
    { value: "land", label: t("property_type_land") },
    { value: "rental", label: t("property_type_rental") },
    { value: "vacation", label: t("property_type_vacation") },
    { value: "mixed-use", label: t("property_type_mixed_use") },
  ];
  const [formData, setFormData] = useState<Partial<Property>>({
    name: "",
    type: "residential",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchasePrice: 0,
    currentValue: 0,
    currency: "USD",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (property) {
      setFormData(property);
    } else {
      setFormData({
        name: "",
        type: "residential",
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        purchasePrice: 0,
        currentValue: 0,
        currency: "USD",
        notes: "",
      });
    }
  }, [property, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const propertyData: Property = {
        id: property?.id || generateId(),
        name: formData.name!,
        type: formData.type as PropertyType,
        address: formData.address!,
        city: formData.city,
        state: formData.state,
        country: formData.country!,
        postalCode: formData.postalCode,
        purchaseDate: formData.purchaseDate!,
        purchasePrice: Number(formData.purchasePrice),
        currentValue: Number(formData.currentValue),
        currency: formData.currency!,
        notes: formData.notes,
        createdAt: property?.createdAt || now,
        updatedAt: now,
      };

      await onSave(propertyData);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save property:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {property ? t("property_form_title_edit") : t("property_form_title_add")}
            </DialogTitle>
            <DialogDescription>
              {property ? t("property_form_description_edit") : t("property_form_description_add")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">{t("property_name")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("property_name_placeholder")}
                required
              />
            </div>

            {/* Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">{t("property_type")} *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as PropertyType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="address">{t("address")} *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t("address_placeholder")}
                required
              />
            </div>

            {/* City, State */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">{t("city")}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder={t("city_placeholder")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">{t("state")}</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder={t("state_placeholder")}
                />
              </div>
            </div>

            {/* Country, Postal Code */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="country">{t("country")} *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => {
                    const newCountry = e.target.value;
                    setFormData({
                      ...formData,
                      country: newCountry,
                      // Auto-set currency based on country
                      currency: getCurrencyForCountry(newCountry)
                    });
                  }}
                  placeholder={t("country_placeholder")}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postalCode">{t("postal_code")}</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder={t("postal_code_placeholder")}
                />
              </div>
            </div>

            {/* Purchase Date, Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchaseDate">{t("purchase_date")} *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchasePrice">{t("purchase_price")} *</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            {/* Current Value, Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currentValue">{t("current_value")} *</Label>
                <Input
                  id="currentValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">{t("currency")} *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {t("currency_popular")}
                    </div>
                    {popularCurrencies.map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {curr}
                      </SelectItem>
                    ))}
                    <div className="my-1 border-t" />
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {t("currency_all")}
                    </div>
                    {worldCurrencies
                      .filter((c) => !popularCurrencies.includes(c.value))
                      .map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t("notes_placeholder")}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : property ? t("update") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
