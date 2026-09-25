"use server";

import { z } from "zod";
import { ActionError, runAction } from "@/lib/action-result";
import { requireUser } from "@/lib/auth-guards";
import type { TradeInRequest } from "@/lib/supabase";

/**
 * Customer trade-in actions. Every export returns an ActionResult
 * ({ ok: false, error: CODE } on failure); no human-readable text.
 */

const DESIRED_VEHICLE_COLUMNS = `
  *,
  vehicles:desired_vehicle_id (
    id,
    brand,
    model,
    year,
    mileage,
    price,
    transmission,
    fuel_type,
    body_type,
    color_exterior,
    description
  )
`;

/** PostgREST may return the joined vehicle as an array or an object. */
function withDesiredVehicle(request: any): TradeInRequest {
  const desiredVehicle = Array.isArray(request.vehicles) ? request.vehicles[0] : request.vehicles;
  return { ...request, desired_vehicle: desiredVehicle ?? null } as TradeInRequest;
}

export async function getAvailableVehicles() {
  return runAction("getAvailableVehicles", "LOAD_FAILED", async () => {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { vehicles: data || [] };
  });
}

const tradeInSchema = z.object({
  current_vehicle_brand: z.string().trim().min(1).max(100),
  current_vehicle_model: z.string().trim().min(1).max(100),
  current_vehicle_year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  current_vehicle_mileage: z.number().int().min(0).max(5_000_000),
  current_vehicle_value_estimate: z.number().min(0).max(100_000_000),
  desired_vehicle_id: z.guid(),
});

export async function createTradeInRequest(tradeInData: unknown) {
  return runAction("createTradeInRequest", "CREATE_FAILED", async () => {
    const { supabase, user } = await requireUser();
    // Unknown fields are stripped: the client cannot set user_id, status, admin notes, ...
    const parsed = tradeInSchema.safeParse(tradeInData);
    if (!parsed.success) throw new ActionError("INVALID_INPUT");
    const data = parsed.data;

    const { data: request, error } = await supabase
      .from("trade_in_requests")
      .insert({
        user_id: user.id,
        current_vehicle_brand: data.current_vehicle_brand,
        current_vehicle_model: data.current_vehicle_model,
        current_vehicle_year: data.current_vehicle_year,
        current_vehicle_mileage: data.current_vehicle_mileage,
        current_vehicle_value_estimate: data.current_vehicle_value_estimate,
        desired_vehicle_id: data.desired_vehicle_id,
        status: "new",
      })
      .select("id")
      .single();
    if (error || !request) throw error ?? new ActionError("CREATE_FAILED");

    return { requestId: request.id as string };
  });
}

export async function getTradeInRequests() {
  return runAction("getTradeInRequests", "LOAD_FAILED", async () => {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("trade_in_requests")
      .select(DESIRED_VEHICLE_COLUMNS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { requests: (data || []).map(withDesiredVehicle) };
  });
}

export async function getTradeInRequestById(requestId: string) {
  return runAction("getTradeInRequestById", "LOAD_FAILED", async () => {
    const { supabase, user } = await requireUser();
    if (!z.guid().safeParse(requestId).success) throw new ActionError("NOT_FOUND");

    const { data, error } = await supabase
      .from("trade_in_requests")
      .select(DESIRED_VEHICLE_COLUMNS)
      .eq("id", requestId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ActionError("NOT_FOUND");

    return { request: withDesiredVehicle(data) };
  });
}
