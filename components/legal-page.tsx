import { getLocale, getTranslations } from "next-intl/server";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/page-header";

/** One block of a legal section. Strings are paragraphs; the others render structured content. */
export type LegalBlock =
  | string
  | { type: "lines"; lines: React.ReactNode[] }
  | { type: "list"; items: React.ReactNode[] }
  | { type: "link"; label?: string; href: string; text?: string };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

interface LegalPageProps {
  title: string;
  intro?: string;
  sections: LegalSection[];
  /** "Stand: ..." line below the content. */
  updated?: string;
  /** Show a table of contents (long pages such as the privacy policy). */
  toc?: boolean;
}

function isExternal(href: string) {
  return href.startsWith("http");
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") {
    return <p>{block}</p>;
  }
  if (block.type === "lines") {
    return (
      <p>
        {block.lines.map((line, index) => (
          <span key={index} className="block">
            {line}
          </span>
        ))}
      </p>
    );
  }
  if (block.type === "list") {
    return (
      <ul className="list-disc pl-5 space-y-1.5 marker:text-muted-foreground">
        {block.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <p>
      {block.label && <span>{block.label}: </span>}
      <a
        href={block.href}
        className="text-primary underline underline-offset-2 hover:text-primary-hover break-all"
        {...(isExternal(block.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {block.text ?? block.href.replace(/^https?:\/\//, "")}
      </a>
    </p>
  );
}

/** Shared layout for the Impressum and privacy policy pages. */
export async function LegalPage({ title, intro, sections, updated, toc = false }: LegalPageProps) {
  const t = await getTranslations("legalPages");
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-muted">
      <PageHeader title={title} width="narrow" />
      <div className="page-container-narrow">
        <div className="card p-6 sm:p-10">
          {/* Only the German version is legally binding */}
          {locale !== "de" && (
            <div
              role="note"
              className="flex gap-3 rounded-lg border border-info-border bg-info-subtle/50 p-4 mb-8 text-info-subtle-foreground"
            >
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm">{t("bindingNote")}</p>
            </div>
          )}

          {intro && <p className="text-lg text-muted-foreground mb-8">{intro}</p>}

          {toc && (
            <nav aria-label={t("contents")} className="mb-10 rounded-lg bg-muted p-5">
              <p className="font-semibold text-foreground mb-3">{t("contents")}</p>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="text-primary hover:underline">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="divide-y divide-border">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="scroll-mt-24 py-8 first:pt-0 last:pb-0"
              >
                <h2 id={`${section.id}-title`} className="section-title mb-4">
                  {toc && <span className="text-muted-foreground mr-2">{index + 1}.</span>}
                  {section.title}
                </h2>
                <div className="space-y-3 text-foreground/90 leading-relaxed break-words">
                  {section.blocks.map((block, blockIndex) => (
                    <Block key={blockIndex} block={block} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {updated && <p className="mt-10 pt-6 border-t border-border text-sm text-muted-foreground">{updated}</p>}
        </div>
      </div>
    </div>
  );
}
