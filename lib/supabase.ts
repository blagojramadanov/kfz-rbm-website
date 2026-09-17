'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for client-side operations (reads/writes cookies automatically)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Database types (to be expanded as we build)
export interface Vehicle {
  id: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  transmission: string;
  fuel_type: string;
  body_type: string;
  color_exterior: string;
  color_interior: string;
  engine_cc: number;
  power_hp: number;
  description: string;
  status: "available" | "sold" | "reserved" | "draft";
  featured: boolean;
  primary_image_id?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  created_at: string;
}

export interface CustomerInquiry {
  id: string;
  vehicle_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  message: string;
  inquiry_type: "general" | "test_drive" | "part_exchange";
  status: "new" | "read" | "responded" | "closed";
  created_at: string;
  updated_at: string;
}

export type UserRole = "CUSTOMER" | "ADMIN";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

export type VehicleStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected" | "sold";

export interface SubmittedVehicle {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price?: number;
  transmission: string;
  fuel_type: string;
  body_type: string;
  color: string;
  power_hp: number;
  description: string;
  status: VehicleStatus;
  images: string[];
  status_reason?: string;
  sales_type?: string;
  commission?: number; // Commission percentage for "Verkauf im Kundenauftrag"
  created_at: string;
  updated_at: string;
}

export interface CustomerInquiryMessage {
  id: string;
  vehicle_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  message: string;
  inquiry_type: "general" | "test_drive" | "part_exchange";
  status: "new" | "read" | "responded" | "closed";
  created_at: string;
}

export interface FavoriteVehicle {
  id: string;
  user_id: string;
  vehicle_id: string;
  created_at: string;
}

export interface TradeInRequest {
  id: string;
  user_id: string;
  current_vehicle_brand: string;
  current_vehicle_model: string;
  current_vehicle_year: number;
  current_vehicle_mileage: number;
  current_vehicle_value_estimate: number;
  desired_vehicle_id: string;
  desired_vehicle?: Vehicle; // For populated requests
  estimated_price_difference?: number; // Calculated, non-binding
  status: "new" | "reviewing" | "contact_made" | "completed" | "cancelled";
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}
