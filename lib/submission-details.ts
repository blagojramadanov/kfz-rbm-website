/**
 * The extra vehicle details the customer wizard collects (migration 026). The DB
 * stores the wizard's option values ("4+", "expired", ...), never translated text;
 * labels come from messages `wizard.fields.*` / `wizard.options.*`. An unknown value
 * falls back to the raw value, like lib/vehicle-labels.ts.
 */

// `t` must come from `useTranslations("wizard")`.
type WizardTranslator = {
  (key: any): string;
  has(key: any): boolean;
};

export interface SubmissionDetailValues {
  variant?: string | null;
  previous_owners?: string | null;
  hu_au?: string | null;
  accident_history?: string | null;
  service_book?: string | null;
}

/** Option group in `wizard.options` per column, and DB value -> option key where they differ. */
const OPTION_GROUPS = {
  previous_owners: { field: "previousOwners", keys: { "1": "one", "2": "two", "3": "three", "4+": "moreThanThree" } },
  hu_au: { field: "huAu", keys: {} },
  accident_history: { field: "accidentHistory", keys: {} },
  service_book: { field: "serviceBook", keys: {} },
} as const satisfies Record<string, { field: string; keys: Record<string, string> }>;

function optionLabel(t: WizardTranslator, column: keyof typeof OPTION_GROUPS, value: string): string {
  const { field, keys } = OPTION_GROUPS[column];
  const key = `options.${field}.${(keys as Record<string, string>)[value] ?? value}`;
  return !value.includes(".") && t.has(key) ? t(key) : value;
}

/** Label/value pairs for the details that are set, in wizard order. */
export function getSubmissionDetails(t: WizardTranslator, values: SubmissionDetailValues) {
  const details: { key: string; label: string; value: string }[] = [];
  if (values.variant) details.push({ key: "variant", label: t("fields.variant"), value: values.variant });
  for (const column of Object.keys(OPTION_GROUPS) as (keyof typeof OPTION_GROUPS)[]) {
    const value = values[column];
    if (value) details.push({ key: column, label: t(`fields.${OPTION_GROUPS[column].field}`), value: optionLabel(t, column, value) });
  }
  return details;
}
