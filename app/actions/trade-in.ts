"use server";

import { z } from "zod";
import { getSupabaseServerClient, getSupabaseUser } from "@/lib/supabase-server";
import type { TradeInRequest } from "@/lib/supabase";

export async function getAvailableVehicles() {
  try {
    const { supabase } = await getSupabaseServerClient();

    const { data: vehicles, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return vehicles || [];
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    throw new Error(
      error instanceof Error ? error.message : "Fehler beim Abrufen der Fahrzeuge"
    );
  }
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
  try {
    const { supabase, user } = await getSupabaseUser();
    // Unknown fields are stripped: the client cannot set user_id, status, admin notes, ...
    const data = tradeInSchema.parse(tradeInData);

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
      .select()
      .single();

    if (error) throw error;

    return { success: true, requestId: request.id, message: "Inzahlungnahmeanfrage erfolgreich erstellt" };
  } catch (error) {
    console.error("Error creating trade-in request:", error);
    if (error instanceof z.ZodError) throw new Error("INVALID_INPUT");
    throw new Error(
      error instanceof Error ? error.message : "Fehler beim Erstellen der Inzahlungnahmeanfrage"
    );
  }
}

export async function getTradeInRequests(): Promise<TradeInRequest[]> {
  try {
    const { supabase, user } = await getSupabaseUser();

    const { data: requests, error } = await supabase
      .from("trade_in_requests")
      .select(
        `
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
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map the data to include desired_vehicle
    // PostgREST returns foreign key relationships as arrays, get first element
    const mappedRequests = (requests || []).map((req: any) => {
      const desiredVehicle = Array.isArray(req.vehicles)
        ? req.vehicles[0]
        : req.vehicles;

      return {
        ...req,
        desired_vehicle: desiredVehicle,
      };
    });

    console.log("[trade-in] getTradeInRequests - sample result:", {
      count: mappedRequests.length,
      first_item_vehicles_type: requests?.[0]?.vehicles ? (Array.isArray(requests[0].vehicles) ? "array" : typeof requests[0].vehicles) : "N/A",
    });

    return mappedRequests as TradeInRequest[];
  } catch (error) {
    console.error("Error fetching trade-in requests:", error);
    throw new Error(
      error instanceof Error ? error.message : "Fehler beim Abrufen der Anfragen"
    );
  }
}

export async function getTradeInRequestById(requestId: string) {
  try {
    const { supabase, user } = await getSupabaseUser();

    const { data: request, error } = await supabase
      .from("trade_in_requests")
      .select(
        `
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
      `
      )
      .eq("id", requestId)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    if (!request) throw new Error("Anfrage nicht gefunden");

    // Handle relationship response - might be array or object
    let desiredVehicle = null;
    if (request.vehicles) {
      // PostgREST returns foreign key relationships as arrays
      desiredVehicle = Array.isArray(request.vehicles)
        ? request.vehicles[0]
        : request.vehicles;
    }

    console.log("[trade-in] getTradeInRequestById result:", {
      requestId,
      desired_vehicle_id: request.desired_vehicle_id,
      vehicles_type: Array.isArray(request.vehicles) ? "array" : typeof request.vehicles,
      vehicles_length: Array.isArray(request.vehicles) ? request.vehicles.length : "N/A",
      vehicles_value: request.vehicles,
      desiredVehicle,
    });

    return {
      ...request,
      desired_vehicle: desiredVehicle,
    } as TradeInRequest;
  } catch (error) {
    console.error("Error fetching trade-in request:", error);
    throw new Error(
      error instanceof Error ? error.message : "Fehler beim Abrufen der Anfrage"
    );
  }
}
