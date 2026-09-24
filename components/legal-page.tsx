import { getTranslations } from "next-intl/server";
import { Info } from "lucide-react";

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
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>

        <div
          role="note"
          className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 mb-8 text-amber-900"
        >
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">{t("title")}</p>
            <p className="text-sm">{t("text")}</p>
          </div>
        </div>

        <p className="text-lg text-gray-600 mb-8">{intro}</p>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.id}>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{section.title}</h2>
              <div className="space-y-2 text-gray-700">
                {section.body.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
