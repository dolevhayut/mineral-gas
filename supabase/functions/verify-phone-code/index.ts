// Edge Function for verifying phone verification codes
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  try {
    const { phone, code } = await req.json();
    
    // Validate inputs
    if (!phone || !code) {
      return new Response(JSON.stringify({
        error: "נתונים חסרים",
        details: "חובה לספק מספר טלפון וקוד אימות"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({
        error: "Server configuration error"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call the verify_phone_number function
    const { data, error } = await supabase.rpc('verify_phone_number', {
      p_phone: phone,
      p_code: code
    });

    if (error) {
      console.error("Error verifying phone code:", error);
      return new Response(JSON.stringify({
        error: "אימות נכשל",
        details: error.message
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }

    if (!data?.success) {
      return new Response(JSON.stringify({
        error: "אימות נכשל",
        details: data?.message || "קוד אימות שגוי או פג תוקף"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }

    // Return success with user data
    return new Response(JSON.stringify({
      success: true,
      user: data.customer,
      message: "אימות הצליח"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({
      error: "שגיאה פנימית בשרת",
      message: error.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
}, {
  // Disable JWT verification
  noVerifyJWT: true
});
