import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, this should be done server-side
});

// Define the available functions for OpenAI to call
const functions = [
  {
    name: 'get_customer_orders_by_name',
    description: 'מחזיר את כל ההזמנות של לקוח לפי שם או חלק משם. ניתן לסנן לפי חודש ושנה.',
    parameters: {
      type: 'object',
      properties: {
        customer_name: {
          type: 'string',
          description: 'שם הלקוח או חלק משמו'
        },
        month: {
          type: 'number',
          description: 'מספר החודש (1-12) - אופציונלי',
          minimum: 1,
          maximum: 12
        },
        year: {
          type: 'number',
          description: 'השנה (למשל 2024) - אופציונלי'
        }
      },
      required: ['customer_name']
    }
  },
  {
    name: 'get_customer_orders_by_phone',
    description: 'מחזיר את כל ההזמנות של לקוח לפי מספר טלפון. ניתן לסנן לפי חודש ושנה.',
    parameters: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'מספר טלפון של הלקוח'
        },
        month: {
          type: 'number',
          description: 'מספר החודש (1-12) - אופציונלי',
          minimum: 1,
          maximum: 12
        },
        year: {
          type: 'number',
          description: 'השנה (למשל 2024) - אופציונלי'
        }
      },
      required: ['phone']
    }
  },
  {
    name: 'get_orders_by_status',
    description: 'מחזיר הזמנות לפי סטטוס (pending, confirmed, in_transit, delivered, cancelled)',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'],
          description: 'סטטוס ההזמנה'
        },
        month: {
          type: 'number',
          description: 'מספר החודש (1-12) - אופציונלי',
          minimum: 1,
          maximum: 12
        },
        year: {
          type: 'number',
          description: 'השנה (למשל 2024) - אופציונלי'
        }
      },
      required: ['status']
    }
  },
  {
    name: 'get_orders_by_date_range',
    description: 'מחזיר הזמנות בטווח תאריכים מסוים',
    parameters: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'תאריך התחלה בפורמט YYYY-MM-DD'
        },
        end_date: {
          type: 'string',
          description: 'תאריך סיום בפורמט YYYY-MM-DD'
        }
      },
      required: ['start_date', 'end_date']
    }
  },
  {
    name: 'get_service_requests_by_customer',
    description: 'מחזיר קריאות שירות של לקוח לפי שם',
    parameters: {
      type: 'object',
      properties: {
        customer_name: {
          type: 'string',
          description: 'שם הלקוח או חלק משמו'
        },
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'cancelled'],
          description: 'סטטוס קריאת השירות - אופציונלי'
        }
      },
      required: ['customer_name']
    }
  },
  {
    name: 'get_service_requests_by_status',
    description: 'מחזיר קריאות שירות לפי סטטוס',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed', 'cancelled'],
          description: 'סטטוס קריאת השירות'
        }
      },
      required: ['status']
    }
  },
  {
    name: 'get_customer_details',
    description: 'מחזיר פרטים מלאים על לקוח לפי שם או טלפון',
    parameters: {
      type: 'object',
      properties: {
        search_term: {
          type: 'string',
          description: 'שם הלקוח או מספר טלפון'
        }
      },
      required: ['search_term']
    }
  },
  {
    name: 'get_total_revenue',
    description: 'מחזיר את סך ההכנסות בתקופה מסוימת',
    parameters: {
      type: 'object',
      properties: {
        month: {
          type: 'number',
          description: 'מספר החודש (1-12) - אופציונלי',
          minimum: 1,
          maximum: 12
        },
        year: {
          type: 'number',
          description: 'השנה (למשל 2024) - אופציונלי'
        }
      }
    }
  }
];

// Function implementations
async function get_customer_orders_by_name(params: { customer_name: string; month?: number; year?: number }) {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        customers!inner(id, name, phone),
        order_items(*, products(*))
      `)
      .ilike('customers.name', `%${params.customer_name}%`);

    if (params.month && params.year) {
      const startDate = new Date(params.year, params.month - 1, 1);
      const endDate = new Date(params.year, params.month, 0);
      query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { error: 'שגיאה בשליפת הזמנות' };
  }
}

async function get_customer_orders_by_phone(params: { phone: string; month?: number; year?: number }) {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        customers!inner(id, name, phone),
        order_items(*, products(*))
      `)
      .eq('customers.phone', params.phone);

    if (params.month && params.year) {
      const startDate = new Date(params.year, params.month - 1, 1);
      const endDate = new Date(params.year, params.month, 0);
      query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { error: 'שגיאה בשליפת הזמנות' };
  }
}

async function get_orders_by_status(params: { status: string; month?: number; year?: number }) {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        customers(id, name, phone),
        order_items(*, products(*))
      `)
      .eq('status', params.status);

    if (params.month && params.year) {
      const startDate = new Date(params.year, params.month - 1, 1);
      const endDate = new Date(params.year, params.month, 0);
      query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { error: 'שגיאה בשליפת הזמנות' };
  }
}

async function get_orders_by_date_range(params: { start_date: string; end_date: string }) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(id, name, phone),
        order_items(*, products(*))
      `)
      .gte('created_at', params.start_date)
      .lte('created_at', params.end_date);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { error: 'שגיאה בשליפת הזמנות' };
  }
}

async function get_service_requests_by_customer(params: { customer_name: string; status?: string }) {
  try {
    let query = supabase
      .from('service_requests')
      .select(`
        *,
        customers!inner(id, name, phone)
      `)
      .ilike('customers.name', `%${params.customer_name}%`);

    if (params.status) {
      query = query.eq('status', params.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return { error: 'שגיאה בשליפת קריאות שירות' };
  }
}

async function get_service_requests_by_status(params: { status: string }) {
  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        customers(id, name, phone)
      `)
      .eq('status', params.status);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return { error: 'שגיאה בשליפת קריאות שירות' };
  }
}

async function get_customer_details(params: { search_term: string }) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${params.search_term}%,phone.eq.${params.search_term}`);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return { error: 'שגיאה בשליפת פרטי לקוח' };
  }
}

async function get_total_revenue(params: { month?: number; year?: number }) {
  try {
    let query = supabase
      .from('orders')
      .select('total, created_at')
      .eq('status', 'delivered');

    if (params.month && params.year) {
      const startDate = new Date(params.year, params.month - 1, 1);
      const endDate = new Date(params.year, params.month, 0);
      query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
    } else if (params.year) {
      const startDate = new Date(params.year, 0, 1);
      const endDate = new Date(params.year, 11, 31);
      query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    const total = data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    return { total_revenue: total, orders_count: data?.length || 0 };
  } catch (error) {
    console.error('Error calculating revenue:', error);
    return { error: 'שגיאה בחישוב הכנסות' };
  }
}

// Map function names to implementations
const functionMap: Record<string, (params: any) => Promise<any>> = {
  get_customer_orders_by_name,
  get_customer_orders_by_phone,
  get_orders_by_status,
  get_orders_by_date_range,
  get_service_requests_by_customer,
  get_service_requests_by_status,
  get_customer_details,
  get_total_revenue
};

// Main function to process user query
export async function processAIQuery(userQuery: string): Promise<string> {
  try {
    // Get current date and time
    const now = new Date();
    const hebrewMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    
    const currentDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentMonth = hebrewMonths[now.getMonth()];
    const currentYear = now.getFullYear();
    const currentDay = hebrewDays[now.getDay()];
    
    // Step 1: Send query to OpenAI with function definitions
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `אתה עוזר וירטואלי מקצועי ומנומס למנהל מכירות של חברת גז "מינרל גז". 
          
          תפקידך:
          - לעזור למנהל המכירות לקבל מידע מפורט על הזמנות, לקוחות וקריאות שירות
          - לספק תשובות ברורות, מקצועיות ומנומסות בעברית
          - להיות מדויק במיוחד בנושאים פיננסיים ומספריים
          
          כללי תשובה:
          1. **נימוס**: התחל כל תשובה בצורה מנומסת (למשל: "בשמחה!", "כמובן", "הנה המידע שביקשת")
          2. **פירוט**: תן תשובות מפורטות ככל האפשר, במיוחד בנושאים פיננסיים
          3. **מספרים**: הצג מספרים עם פסיקים (למשל: 1,234) וסימן ₪ לסכומים
          4. **ניתוח**: בנושאים פיננסיים, הוסף ניתוח קצר (למשל: "זה גידול של X% לעומת...")
          5. **סיכום**: סיים תשובות ארוכות עם סיכום קצר
          
          דוגמאות לתשובות טובות:
          - "בשמחה! בחודש ${currentMonth} היו 15 הזמנות בסך כולל של ₪12,500. זהו גידול של 20% לעומת החודש הקודם."
          - "כמובן! הנה פירוט ההכנסות: ינואר: ₪10,000, פברואר: ₪12,500, מרץ: ₪15,000. סה״כ: ₪37,500."
          
          מידע עדכני חשוב:
          - התאריך הנוכחי: ${currentDate} (יום ${currentDay})
          - השעה הנוכחית: ${currentTime}
          - החודש הנוכחי: ${currentMonth} ${currentYear}
          - מספר החודש: ${now.getMonth() + 1}
          - השנה הנוכחית: ${currentYear}
          
          שמות חודשים בעברית: ינואר, פברואר, מרץ, אפריל, מאי, יוני, יולי, אוגוסט, ספטמבר, אוקטובר, נובמבר, דצמבר.
          
          כאשר המשתמש שואל על "החודש" או "היום", התייחס לתאריכים הנוכחיים האלה.
          כאשר המשתמש שואל על חודש ספציפי ללא שנה, התייחס לשנה הנוכחית (${currentYear}).`
        },
        {
          role: 'user',
          content: userQuery
        }
      ],
      functions: functions as any,
      function_call: 'auto'
    });

    const responseMessage = completion.choices[0].message;

    // Step 2: Check if OpenAI wants to call a function
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      console.log('Calling function:', functionName, 'with args:', functionArgs);

      // Step 3: Execute the function
      const functionToCall = functionMap[functionName];
      if (!functionToCall) {
        return 'מצטער, לא מצאתי את הפונקציה המתאימה.';
      }

      const functionResponse = await functionToCall(functionArgs);

      // Step 4: Send function response back to OpenAI for natural language formatting
      const secondCompletion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `אתה עוזר וירטואלי מקצועי ומנומס למנהל מכירות של חברת גז "מינרל גז". 
            
            כללי תשובה:
            1. **נימוס**: התחל כל תשובה בצורה מנומסת (למשל: "בשמחה!", "כמובן", "הנה המידע המפורט")
            2. **פירוט מקסימלי**: תן תשובות מפורטות ככל האפשר, במיוחד בנושאים פיננסיים
            3. **מספרים**: הצג מספרים עם פסיקים (למשל: 1,234) וסימן ₪ לסכומים
            4. **ניתוח פיננסי**: בשאלות על הכנסות/מכירות, הוסף:
               - סכומים מדויקים
               - השוואות (אם רלוונטי)
               - אחוזי שינוי
               - ממוצעים
            5. **סיכום**: סיים תשובות ארוכות עם סיכום ברור
            6. **מבנה**: ארגן מידע רב בנקודות או טבלה
            
            דוגמאות לתשובות מצוינות:
            - "בשמחה! הנה פירוט מלא של ההכנסות בחודש ${currentMonth}:
              • סה״כ הכנסות: ₪12,500
              • מספר הזמנות: 15
              • ממוצע להזמנה: ₪833
              • גידול של 20% לעומת החודש הקודם
              
              סיכום: חודש מצוין עם עלייה משמעותית במכירות! 📈"
            
            מידע עדכני:
            - התאריך: ${currentDate} (יום ${currentDay})
            - השעה: ${currentTime}
            - החודש: ${currentMonth} ${currentYear}
            - השנה: ${currentYear}
            
            שמות חודשים: ינואר, פברואר, מרץ, אפריל, מאי, יוני, יולי, אוגוסט, ספטמבר, אוקטובר, נובמבר, דצמבר.`
          },
          {
            role: 'user',
            content: userQuery
          },
          {
            role: 'assistant',
            content: null,
            function_call: responseMessage.function_call
          },
          {
            role: 'function',
            name: functionName,
            content: JSON.stringify(functionResponse)
          }
        ]
      });

      return secondCompletion.choices[0].message.content || 'לא הצלחתי לעבד את התשובה.';
    }

    // If no function call, return the direct response
    return responseMessage.content || 'לא הצלחתי להבין את השאלה.';
  } catch (error) {
    console.error('Error processing AI query:', error);
    if (error instanceof Error) {
      return `שגיאה: ${error.message}`;
    }
    return 'אירעה שגיאה בעיבוד השאלה. אנא נסה שוב.';
  }
}

