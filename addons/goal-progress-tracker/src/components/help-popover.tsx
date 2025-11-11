import { Button, Icons, Popover, PopoverContent, PopoverTrigger } from "@wealthfolio/ui";
import { useTranslation } from "react-i18next";

// Help popover component using shadcn Popover
function HelpPopover() {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t("help_aria_label")}>
          <Icons.HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">{t("help_how_it_works")}</h4>
            <div className="text-muted-foreground space-y-2 text-sm">
              <p>• {t("help_select_goal")}</p>
              <p>• {t("help_dot_represents")}</p>
              <p>• {t("help_green_dots")}</p>
              <p>• {t("help_partial_dot")}</p>
              <p>• {t("help_click_dot")}</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { HelpPopover };
