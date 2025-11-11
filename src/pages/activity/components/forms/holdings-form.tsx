import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  MoneyInput,
  QuantityInput,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wealthfolio/ui";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ASSET_SUBCLASS_TYPES } from "@/lib/constants";
import { ConfigurationCheckbox, CommonFields, AssetSymbolInput } from "./common";
import { AccountSelectOption } from "../activity-form";
import {
  ActivityTypeSelector,
  type ActivityType as ActivityTypeUI,
} from "../activity-type-selector";

export const HoldingsForm = ({ accounts }: { accounts: AccountSelectOption[] }) => {
  const { t } = useTranslation(["activity", "asset"]);
  const { control, watch, setValue } = useFormContext();
  const isManualAsset = watch("assetDataSource") === "MANUAL";
  const simplifiedMode = watch("simplifiedMode");

  const holdingTypes: ActivityTypeUI[] = [
    {
      value: "ADD_HOLDING",
      label: t("type_add_holding"),
      icon: "PlusCircle",
      description: t("type_add_holding_desc"),
    },
    {
      value: "REMOVE_HOLDING",
      label: t("type_remove_holding"),
      icon: "MinusCircle",
      description: t("type_remove_holding_desc"),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <ActivityTypeSelector control={control} types={holdingTypes} columns={2} />
        </div>
      </div>
      <Card>
        <CardContent className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {!simplifiedMode && <ConfigurationCheckbox showCurrencyOption={true} />}
            </div>
            <FormField
              control={control}
              name="simplifiedMode"
              render={({ field }) => (
                <FormItem className="mt-2 space-y-1">
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="simplified-mode-checkbox"
                      className="text-muted-foreground hover:text-foreground cursor-pointer text-sm"
                    >
                      {t("asset_without_symbol")}
                    </label>
                    <Checkbox
                      id="simplified-mode-checkbox"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          setValue("assetDataSource", "MANUAL");
                        }
                      }}
                      className="h-4 w-4"
                    />
                  </div>
                </FormItem>
              )}
            />
          </div>

          {simplifiedMode ? (
            <>
              <FormField
                control={control}
                name="assetName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("asset_name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("asset_name_placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="assetSubClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("asset_subclass")}</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("asset:subclass_placeholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSET_SUBCLASS_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {t(`asset:${type.translationKey}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("total_amount")}</FormLabel>
                    <FormControl>
                      <MoneyInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : (
            <>
              <FormField
                control={control}
                name="assetId"
                render={({ field }) => <AssetSymbolInput field={field} isManualAsset={isManualAsset} />}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("field_shares")}</FormLabel>
                      <FormControl>
                        <QuantityInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("field_average_cost")}</FormLabel>
                      <FormControl>
                        <MoneyInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}
          <CommonFields accounts={accounts} />
        </CardContent>
      </Card>
    </div>
  );
};
