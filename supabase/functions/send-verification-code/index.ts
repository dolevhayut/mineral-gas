// Edge Function for sending phone verification codes via WhatsApp or SMS
// Simplified version for gas cylinder service
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

const WHATSAPP_WEBHOOK_URL = "https://hook.eu1.make.com/coccz0nnnykn9snw7sw6obl9m37s3d0j";
const SMS_WEBHOOK_URL = "https://hook.eu1.make.com/coccz0nnnykn9snw7sw6obl9m37s3d0j"; // Replace with your SMS webhook URL

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  try {
    const { phone, method = 'whatsapp' } = await req.json();
    
    console.log("Received request:", { phone, method });
    
    // Validate phone number format (Israeli format)
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
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

    // Validate method parameter
    if (!['whatsapp', 'sms'].includes(method)) {
      return new Response(JSON.stringify({
        error: "שיטת שליחה לא תקינה",
        details: "השיטה חייבת להיות 'whatsapp' או 'sms'"
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

    // Call the send_verification_code function
    const { data: verificationCode, error } = await supabase.rpc('send_verification_code', {
      p_phone: phone
    });

    console.log("Database RPC result:", { verificationCode, error });

    if (error) {
      console.error("Error sending verification code:", error);
      return new Response(JSON.stringify({
        error: "שגיאה בשליחת קוד אימות",
        details: error.message
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }

    // Send message via the selected method
    try {
      let webhookUrl;
      let message;
      let serviceMessage;

      if (method === 'whatsapp') {
        webhookUrl = WHATSAPP_WEBHOOK_URL;
        message = `שירותי גז מינרל\n\nקוד האימות שלך: ${verificationCode}\n\nהקוד תקף למשך 10 דקות.\n\nאם לא ביקשת קוד זה, אנא התעלם מהודעה זו.`;
        serviceMessage = "קוד אימות נשלח בווטסאפ";
      } else {
        webhookUrl = SMS_WEBHOOK_URL;
        message = `קוד האימות שלך: ${verificationCode}\n\nשירותי גז מינרל\nהקוד תקף למשך 10 דקות.`;
        serviceMessage = "קוד אימות נשלח ב-SMS";
      }

      const webhookPayload = {
        phone: phone,
        message: message,
        service: "gas_mineral",
        method: method
      };

      console.log("Sending webhook to:", webhookUrl, "with payload:", webhookPayload);

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      });

      console.log("Webhook response status:", webhookResponse.status);

      if (!webhookResponse.ok) {
        console.error(`${method} webhook failed:`, await webhookResponse.text());
        // Don't fail the request, just log the error
      }
    } catch (webhookError) {
      console.error(`Error sending ${method} message:`, webhookError);
      // Don't fail the request, just log the error
    }

    // In development, return the code for testing
    const isDevelopment = Deno.env.get("ENVIRONMENT") === "development";
    
    const response = {
      success: true,
      message: method === 'whatsapp' ? "קוד אימות נשלח בווטסאפ" : "קוד אימות נשלח ב-SMS",
      method: method,
      // Only return code in development
      ...(isDevelopment && {
        verification_code: verificationCode
      })
    };

    console.log("Returning response:", response);
    
    return new Response(JSON.stringify(response), {
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
