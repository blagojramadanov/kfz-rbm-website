import { getTranslations } from "next-intl/server";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export interface LegalSection {
  id: string;
  title: string;
  /** One paragraph per entry. */
  body: string[];
}

interface LegalPageProps {
  title: string;
  intro: string;
  sections: LegalSection[];
}

/** Shared layout for the demo privacy / terms / impressum pages. */
export async function LegalPage({ title, intro, sections }: LegalPageProps) {
  const t = await getTranslations("legalPages.demoNotice");

  return (
    <div className="min-h-screen bg-muted">
      <PageHeader title={title} width="narrow" />
      <div className="page-container-narrow">
        <div className="card p-6 sm:p-8">
          <div
            role="note"
            className="flex gap-3 rounded-lg border border-warning-border bg-warning-subtle/50 p-4 mb-8 text-warning-subtle-foreground"
          >
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold">{t("title")}</p>
              <p className="text-sm">{t("text")}</p>
            </div>
          </div>

          <p className="text-lg text-muted-foreground mb-8">{intro}</p>

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.id}>
                <h2 className="section-title mb-3">{section.title}</h2>
                <div className="space-y-2 text-foreground">
                  {section.body.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
