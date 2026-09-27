import { revalidatePath } from "next/cache";
import { locales } from "@/lib/locales";
import { getVehicleSlug } from "@/lib/vehicle-slug";

type VehicleRef = { id: string; brand: string; model: string };

/**
 * Drops the cached public pages that can show these vehicles, for every locale:
 * homepage, /fahrzeuge, /fahrzeuge/export and each vehicle's detail page. Without
 * this a change (e.g. set back to draft) stays visible until the ISR window
 * (REVALIDATE_SECONDS) runs out. Call from server actions after the write succeeded;
 * pass the old and the new brand/model when they changed (the slug changes with them).
 */
export function revalidateVehiclePages(...vehicles: (VehicleRef | null | undefined)[]) {
  const slugs = new Set(vehicles.filter((v): v is VehicleRef => Boolean(v)).map(getVehicleSlug));
  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/fahrzeuge`);
    revalidatePath(`/${locale}/fahrzeuge/export`);
    for (const slug of slugs) revalidatePath(`/${locale}/fahrzeuge/${slug}`);
  }
}
