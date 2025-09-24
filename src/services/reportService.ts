import { supabase } from "@/integrations/supabase/client";
import { OrderLineItem } from "@/types";

// Interface for order item data
interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  day_of_week: string;
  cylinder_serial_number?: string;
  cylinder_condition?: string;
  installation_notes?: string;
  safety_check_completed: boolean;
  delivery_instructions?: string;
  // Extended fields from joins
  orders?: {
    id: string;
    customer_id: string;
    status: string;
    total: number;
    created_at: string;
    target_date?: string;
  };
  products?: {
    id: string;
    name: string;
    description?: string;
    price: number;
  };
  customers?: {
    id: string;
    name: string;
    phone: string;
  };
}

// Interface for report data structure
interface ReportData {
  summary?: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalServiceRequests: number;
    totalCustomers: number;
  };
  productStats?: Array<{
    itemCode: string;
    description: string;
    quantity: number;
    revenue: number;
  }>;
  customerStats?: Array<{
    cardCode: string;
    cardName: string;
    orderCount: number;
    totalAmount: number;
  }>;
  dailySales?: Array<{
    date: string;
    orderCount: number;
    totalAmount: number;
  }>;
}

/**
 * Get open orders within a date range for a specific user
 */
export const getOpenOrders = async (
  startDate: Date,
  endDate: Date,
  userId?: string,
  status?: 'Open' | 'Closed' | 'Canceled' | 'pending' | 'completed' | 'cancelled'
): Promise<OrderLineItem[]> => {
  try {
    console.log(`Fetching orders from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    if (!userId) {
      console.log('No userId provided, returning empty array');
      return [];
    }

    // Get customer ID for this user first by phone
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', userId) // Assuming userId is actually the phone number
      .single();

    if (customerError || !customer) {
      console.log('Customer not found for user:', userId);
      return [];
    }

    let query = supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(id, customer_id, status, total, created_at, target_date),
        products(id, name, description, price)
      `)
      .eq('orders.customer_id', customer.id)
      .gte('orders.created_at', startDate.toISOString())
      .lte('orders.created_at', endDate.toISOString());

    // Add status filter if provided
    if (status) {
      if (status === 'Open' || status === 'pending') {
        query = query.eq('orders.status', 'pending');
      } else if (status === 'Closed' || status === 'completed') {
        query = query.eq('orders.status', 'completed');
      } else if (status === 'Canceled' || status === 'cancelled') {
        query = query.eq('orders.status', 'cancelled');
      }
    }

    const { data, error } = await query.order('orders.created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} order items`);
    
    // Transform data to OrderLineItem format
    const transformedData: OrderLineItem[] = (data || []).map((item: any, index: number) => ({
      docEntry: parseInt(item.order_id) || index, // Use order_id as docEntry
      docNum: parseInt(item.order_id) || index, // Use order_id as docNum
      dueDate: item.orders?.target_date || item.orders?.created_at || new Date().toISOString().split('T')[0],
      description: item.products?.name || item.products?.description || 'מוצר לא ידוע',
      quantity: item.quantity,
      uom: item.products?.uom || 'יחידה',
      itemCode: item.products?.id || item.product_id || 'N/A',
      lineNum: index + 1,
      orderStatus: item.orders?.status === 'pending' ? 'Open' : 
                   item.orders?.status === 'completed' ? 'Closed' : 
                   item.orders?.status === 'cancelled' ? 'Canceled' : 'Open'
    }));
    
    return transformedData;
  } catch (error) {
    console.error('Error in getOpenOrders:', error);
    throw error;
  }
};

/**
 * Get comprehensive report data for a specific customer/user or admin (all customers)
 */
export const getReports = async (
  startDate: Date,
  endDate: Date,
  userId: string,
  reportType: string = 'all'
): Promise<ReportData | null> => {
  try {
    console.log(`Fetching reports for ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Check if this is an admin request
    const isAdmin = userId === 'admin';
    
    let customerId: string | null = null;
    
    if (!isAdmin) {
      // Get customer ID for this user by phone
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('phone', userId) // Assuming userId is actually the phone number
        .single();

      if (customerError || !customer) {
        console.error('Customer not found for user:', userId);
        return {
          summary: {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            totalServiceRequests: 0
          },
          productStats: [],
          customerStats: [],
          dailySales: []
        };
      }
      
      customerId = customer.id;
    }

    // Get orders for this specific customer or all customers (admin) in the date range
    let ordersQuery = supabase
      .from('orders')
      .select(`
        id,
        status,
        total,
        created_at,
        target_date,
        customer_id,
        order_items(
          id,
          product_id,
          quantity,
          price,
          products(id, name, description, price)
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    // Add customer filter only if not admin
    if (!isAdmin && customerId) {
      ordersQuery = ordersQuery.eq('customer_id', customerId);
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    // Get service requests for this customer or all customers (admin) in the date range
    let serviceQuery = supabase
      .from('service_requests')
      .select('id, status, priority, created_at, title, customer_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    // Add customer filter only if not admin
    if (!isAdmin && customerId) {
      serviceQuery = serviceQuery.eq('customer_id', customerId);
    }

    const { data: serviceRequests, error: serviceError } = await serviceQuery;

    if (serviceError) {
      console.error('Error fetching service requests:', serviceError);
      // Don't throw, just continue without service requests
    }

    console.log(`Found ${orders?.length || 0} orders and ${serviceRequests?.length || 0} service requests`);

    // Process summary statistics
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalServiceRequests = serviceRequests?.length || 0;
    
    // For admin reports, get total customers count
    let totalCustomers = 0;
    if (isAdmin) {
      const uniqueCustomerIds = new Set(orders?.map(order => order.customer_id) || []);
      totalCustomers = uniqueCustomerIds.size;
    } else {
      totalCustomers = 1; // For individual customer reports
    }

    const summary = {
      totalOrders: totalOrders,
      totalRevenue: totalRevenue,
      averageOrderValue: averageOrderValue,
      totalServiceRequests: totalServiceRequests,
      totalCustomers: totalCustomers
    };

    // Process product statistics from orders
    const productMap = new Map<string, { itemCode: string; description: string; quantity: number; revenue: number }>();
    
    orders?.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const productId = item.product_id;
        const productName = item.products?.name || 'מוצר לא ידוע';
        const quantity = item.quantity;
        const revenue = item.price * item.quantity;

        if (productMap.has(productId)) {
          const existing = productMap.get(productId)!;
          existing.quantity += quantity;
          existing.revenue += revenue;
        } else {
          productMap.set(productId, {
            itemCode: productId,
            description: productName,
            quantity: quantity,
            revenue: revenue
          });
        }
      });
    });

    const productStats = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity);

    // Process customer statistics (only for admin reports)
    let customerStats: any[] = [];
    
    if (isAdmin) {
      // Get customer statistics for admin reports
      const customerMap = new Map<string, { cardCode: string; cardName: string; orderCount: number; totalAmount: number }>();
      
      orders?.forEach(order => {
        const customerId = order.customer_id;
        const amount = order.total || 0;
        
        if (customerMap.has(customerId)) {
          const existing = customerMap.get(customerId)!;
          existing.orderCount += 1;
          existing.totalAmount += amount;
        } else {
          customerMap.set(customerId, {
            cardCode: customerId,
            cardName: `לקוח ${customerId}`, // Will be updated with actual names below
            orderCount: 1,
            totalAmount: amount
          });
        }
      });
      
      // Get customer names for the customer IDs we found
      if (customerMap.size > 0) {
        const customerIds = Array.from(customerMap.keys());
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('id, name')
          .in('id', customerIds);
        
        if (!customersError && customers) {
          // Update customer names
          customers.forEach(customer => {
            if (customerMap.has(customer.id)) {
              const existing = customerMap.get(customer.id)!;
              existing.cardName = customer.name || `לקוח ${customer.id}`;
            }
          });
        }
      }
      
      customerStats = Array.from(customerMap.values())
        .sort((a, b) => b.totalAmount - a.totalAmount);
    }

    // Process daily activity (orders and service requests)
    const dailyMap = new Map<string, { date: string; orderCount: number; totalAmount: number; serviceRequestCount: number }>();

    // Add orders to daily map
    orders?.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      const amount = order.total || 0;

      if (dailyMap.has(date)) {
        const existing = dailyMap.get(date)!;
        existing.orderCount += 1;
        existing.totalAmount += amount;
      } else {
        dailyMap.set(date, {
          date: date,
          orderCount: 1,
          totalAmount: amount,
          serviceRequestCount: 0
        });
      }
    });

    // Add service requests to daily map
    serviceRequests?.forEach(request => {
      const date = new Date(request.created_at).toISOString().split('T')[0];

      if (dailyMap.has(date)) {
        const existing = dailyMap.get(date)!;
        existing.serviceRequestCount += 1;
      } else {
        dailyMap.set(date, {
          date: date,
          orderCount: 0,
          totalAmount: 0,
          serviceRequestCount: 1
        });
      }
    });

    const dailySales = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary,
      productStats,
      customerStats,
      dailySales
    };
  } catch (error) {
    console.error('Error in getReports:', error);
    throw error;
  }
};
