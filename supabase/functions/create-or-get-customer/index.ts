// Follow this setup guide to integrate the Deno runtime and the Supabase JS library
// https://deno.land/manual/examples/supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request body
    const { userId, name, phone } = await req.json();
    
    if (!userId || !name || !phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First check if a customer already exists for this user
    const { data: existingCustomer, error: queryError } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (queryError && queryError.code !== "PGRST116") {
      console.error("Error querying customer:", queryError);
      return new Response(
        JSON.stringify({ error: "Error querying customer" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    let customerId;

    // If customer exists, use that ID
    if (existingCustomer?.id) {
      customerId = existingCustomer.id;
    } else {
      // Otherwise create a new customer
      const { data: newCustomer, error: insertError } = await supabase
        .from("customers")
        .insert({
          user_id: userId,
          name,
          phone
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating customer:", insertError);
        return new Response(
          JSON.stringify({ error: "Error creating customer" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      customerId = newCustomer.id;
    }

    // Return the customer ID
    return new Response(
      JSON.stringify({ customerId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}); 