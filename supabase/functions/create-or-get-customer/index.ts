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
    const requestBody = await req.json();
    const { userId, name, phone } = requestBody;
    
    console.log("Request received:", JSON.stringify(requestBody));
    
    if (!userId || !name || !phone) {
      console.error("Missing required fields:", { userId, name, phone });
      return new Response(
        JSON.stringify({ error: "Missing required fields", details: { userId, name, phone } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    console.log("Creating Supabase client with URL:", supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First check if a customer already exists for this user
    console.log("Checking for existing customer with user_id:", userId);
    const { data: existingCustomer, error: queryError } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (queryError) {
      console.error("Error querying customer:", queryError);
      return new Response(
        JSON.stringify({ error: "Error querying customer", details: queryError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    let customerId;

    // If customer exists, use that ID
    if (existingCustomer?.id) {
      console.log("Found existing customer with ID:", existingCustomer.id);
      customerId = existingCustomer.id;
    } else {
      // Otherwise create a new customer
      console.log("Creating new customer:", { user_id: userId, name, phone });
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
          JSON.stringify({ error: "Error creating customer", details: insertError }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      if (!newCustomer?.id) {
        console.error("No ID returned for new customer");
        return new Response(
          JSON.stringify({ error: "Failed to create customer - no ID returned" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      console.log("Created new customer with ID:", newCustomer.id);
      customerId = newCustomer.id;
    }

    // Return the customer ID
    console.log("Returning customer ID:", customerId);
    return new Response(
      JSON.stringify({ customerId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}); 