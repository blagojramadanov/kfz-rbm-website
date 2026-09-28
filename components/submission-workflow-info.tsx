"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function SubmissionWorkflowInfo() {
  const t = useTranslations("wizard");

  return (
    <div className="bg-info-subtle/50 border border-info-border rounded-lg p-6">
      <div className="flex gap-3 mb-6">
        <AlertCircle className="w-6 h-6 text-info flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-info-subtle-foreground mb-1">{t("workflow.title")}</h3>
          <p className="text-sm text-info-subtle-foreground">
            {t("workflow.subtitle")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div className="w-0.5 h-12 bg-info-border mt-2"></div>
          </div>
          <div className="pb-6">
            <h4 className="font-semibold text-foreground">{t("workflow.step1Title")}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {t("workflow.step1Desc")}
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div className="w-0.5 h-12 bg-info-border mt-2"></div>
          </div>
          <div className="pb-6">
            <h4 className="font-semibold text-foreground">{t("workflow.step2Title")}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {t("workflow.step2Desc")}
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div className="w-0.5 h-12 bg-info-border mt-2"></div>
          </div>
          <div className="pb-6">
            <h4 className="font-semibold text-foreground">{t("workflow.step3Title")}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {t("workflow.step3Desc")}
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-success text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
              ✓
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{t("workflow.step4Title")}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {t("workflow.step4Desc")}
            </p>
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="mt-6 p-4 bg-card border border-info-border rounded-lg">
        <p className="text-sm text-foreground">
          <span className="font-semibold text-foreground">{t("workflow.importantNoteLabel")}</span> {t("workflow.importantNoteText")}
        </p>
      </div>
    </div>
  );
}
