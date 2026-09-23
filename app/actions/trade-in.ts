"use server";

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

export async function createTradeInRequest(
  tradeInData: {
    current_vehicle_brand: string;
    current_vehicle_model: string;
    current_vehicle_year: number;
    current_vehicle_mileage: number;
    current_vehicle_value_estimate: number;
    desired_vehicle_id: string;
  }
) {
  try {
    const { supabase, user } = await getSupabaseUser();

    const { data: request, error } = await supabase
      .from("trade_in_requests")
      .insert({
        user_id: user.id,
        ...tradeInData,
        status: "new",
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, requestId: request.id, message: "Inzahlungnahmeanfrage erfolgreich erstellt" };
  } catch (error) {
    console.error("Error creating trade-in request:", error);
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
