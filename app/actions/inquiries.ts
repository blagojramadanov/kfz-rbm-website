"use server";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ActionError, runAction } from "@/lib/action-result";
import { requireUser } from "@/lib/auth-guards";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getVehicleSlug } from "@/lib/vehicle-slug";

/**
 * Vehicle inquiries and contact form messages (table customer_inquiries).
 *
 * sendVehicleInquiry() and sendContactMessage() are the only public actions in the
 * project: guests may send them too, so they cannot start with requireUser(). They
 * read the session only to link the row to a logged-in sender (user_id comes from the
 * session, never from the client). Since migration 028 neither anon nor authenticated
 * may INSERT into the table directly, so after the zod validation and the honeypot
 * check the row is written with the service-role client and an explicit column list.
 */

/** Hidden field in both forms; people leave it empty, bots fill it in. */
const HONEYPOT_FIELD = "website";

const senderFields = {
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().pipe(z.email().max(100)),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+()/.\s-]*$/)
    .optional()
    .transform((value) => value || null),
  [HONEYPOT_FIELD]: z.string().max(500).optional(),
};

const MESSAGE_MAX = 2000;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD from today (one day of slack for time zones) up to one year ahead. */
function isValidPreferredDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(date) || new Date(date).toISOString().slice(0, 10) !== value) return false;
  const now = Date.now();
  return date >= now - 2 * DAY_MS && date <= now + 366 * DAY_MS;
}

const vehicleInquirySchema = z
  .object({
    ...senderFields,
    vehicleId: z.guid(),
    type: z.enum(["general", "test_drive"]),
    message: z.string().trim().max(MESSAGE_MAX).optional().default(""),
    preferredDate: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "general" && data.message.length === 0) {
      ctx.addIssue({ code: "custom", path: ["message"], message: "required" });
    }
    if (data.type === "test_drive" && !(data.preferredDate && isValidPreferredDate(data.preferredDate))) {
      ctx.addIssue({ code: "custom", path: ["preferredDate"], message: "invalid" });
    }
  });

const contactMessageSchema = z.object({
  ...senderFields,
  message: z.string().trim().min(1).max(MESSAGE_MAX),
});

/** The logged-in sender's id, or null for a guest. */
async function getOptionalUserId(): Promise<string | null> {
  try {
    const { user } = await requireUser();
    return user.id;
  } catch {
    return null;
  }
}

/** Cookie-less client with the anon role (never a session, whoever is logged in). */
function getAnonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isHoneypotFilled(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;
  const value = (input as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim().length > 0;
}

export async function sendVehicleInquiry(input: unknown) {
  return runAction("sendVehicleInquiry", "CREATE_FAILED", async () => {
    // Pretend success so a bot gets no signal; nothing is stored.
    if (isHoneypotFilled(input)) return {};
    const parsed = vehicleInquirySchema.safeParse(input);
    if (!parsed.success) throw new ActionError("INVALID_INPUT");
    const data = parsed.data;

    // Only publicly listed vehicles can be asked about. Read as anon, so the public
    // SELECT policy on vehicles decides: a draft or sold vehicle id is not found.
    const { data: vehicle, error: vehicleError } = await getAnonClient()
      .from("vehicles")
      .select("id, brand, model, year")
      .eq("id", data.vehicleId)
      .maybeSingle();
    if (vehicleError) throw vehicleError;
    if (!vehicle) throw new ActionError("NOT_FOUND");

    const userId = await getOptionalUserId();
    const { error } = await getSupabaseAdminClient()
      .from("customer_inquiries")
      .insert({
        user_id: userId,
        vehicle_id: vehicle.id,
        vehicle_label: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`.slice(0, 200),
        customer_name: data.name,
        customer_email: data.email,
        customer_phone: data.phone,
        message: data.message,
        inquiry_type: data.type,
        preferred_date: data.type === "test_drive" ? data.preferredDate : null,
        status: "new",
      });
    if (error) throw error;
    return {};
  });
}

export async function sendContactMessage(input: unknown) {
  return runAction("sendContactMessage", "CREATE_FAILED", async () => {
    if (isHoneypotFilled(input)) return {};
    const parsed = contactMessageSchema.safeParse(input);
    if (!parsed.success) throw new ActionError("INVALID_INPUT");
    const data = parsed.data;

    const userId = await getOptionalUserId();
    const { error } = await getSupabaseAdminClient()
      .from("customer_inquiries")
      .insert({
        user_id: userId,
        vehicle_id: null,
        customer_name: data.name,
        customer_email: data.email,
        customer_phone: data.phone,
        message: data.message,
        inquiry_type: "contact",
        status: "new",
      });
    if (error) throw error;
    return {};
  });
}

export interface MyInquiry {
  id: string;
  inquiry_type: string;
  status: string;
  message: string;
  preferred_date: string | null;
  vehicle_label: string | null;
  /** Detail page slug while the vehicle is still publicly listed, otherwise null. */
  vehicle_slug: string | null;
  created_at: string;
}

/** The logged-in customer's own inquiries (RLS: user_id = auth.uid()). */
export async function getMyInquiries() {
  return runAction("getMyInquiries", "LOAD_FAILED", async () => {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("customer_inquiries")
      .select("id, inquiry_type, status, message, preferred_date, vehicle_label, created_at, vehicle:vehicle_id (id, brand, model)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const inquiries: MyInquiry[] = (data || []).map(({ vehicle: joined, ...row }: any) => {
      const vehicle = Array.isArray(joined) ? joined[0] : joined;
      return { ...row, vehicle_slug: vehicle ? getVehicleSlug(vehicle) : null };
    });
    return { inquiries };
  });
}

export async function countMyInquiries() {
  return runAction("countMyInquiries", "LOAD_FAILED", async () => {
    const { supabase, user } = await requireUser();
    const { count, error } = await supabase
      .from("customer_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (error) throw error;
    return { count: count || 0 };
  });
}
