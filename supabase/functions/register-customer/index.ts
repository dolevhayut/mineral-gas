// Edge Function for registering new customers
// Simplified version for gas cylinder service
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  try {
    const { 
      phone, 
      name, 
      address, 
      delivery_instructions, 
      emergency_contact, 
      preferred_delivery_time, 
      gas_supplier_license 
    } = await req.json();
    
    // Validate required fields
    if (!phone || !name) {
      return new Response(JSON.stringify({
        error: "חסרים פרטים נדרשים",
        details: "מספר טלפון ושם נדרשים"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }

    // Validate phone number format
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(JSON.stringify({
        error: "מספר טלפון לא תקין",
        details: "מספר הטלפון חייב להיות בפורמט ישראלי (10 ספרות, מתחיל ב-0)"
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

    // Call the register_customer function
    const { data: result, error } = await supabase.rpc('register_customer', {
      p_phone: phone,
      p_name: name,
      p_address: address || null,
      p_delivery_instructions: delivery_instructions || null,
      p_emergency_contact: emergency_contact || null,
      p_preferred_delivery_time: preferred_delivery_time || null,
      p_gas_supplier_license: gas_supplier_license || null
    });

    if (error) {
      console.error("Error registering customer:", error);
      return new Response(JSON.stringify({
        error: "שגיאה ברישום לקוח",
        details: error.message
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }

    if (!result.success) {
      return new Response(JSON.stringify({
        error: "רישום נכשל",
        details: result.message || "אירעה שגיאה ברישום הלקוח"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "המשתמש נוצר בהצלחה",
      user: result.customer
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 201
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
});
