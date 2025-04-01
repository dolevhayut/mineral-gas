-- Function to get top products by order quantity
CREATE OR REPLACE FUNCTION get_top_products()
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  total_ordered BIGINT
)
LANGUAGE SQL
AS $$
  SELECT 
    oi.product_id,
    p.name as product_name,
    SUM(oi.quantity) as total_ordered
  FROM 
    order_items oi
  JOIN
    products p ON oi.product_id = p.id
  GROUP BY
    oi.product_id, p.name
  ORDER BY
    total_ordered DESC
  LIMIT 10;
$$;

-- Function to get monthly order statistics
CREATE OR REPLACE FUNCTION get_monthly_order_stats()
RETURNS TABLE (
  month TIMESTAMPTZ,
  order_count BIGINT,
  total_amount NUMERIC
)
LANGUAGE SQL
AS $$
  SELECT 
    DATE_TRUNC('month', o.created_at) as month,
    COUNT(*) as order_count,
    SUM(o.total) as total_amount
  FROM 
    orders o
  GROUP BY
    month
  ORDER BY
    month DESC
  LIMIT 12;
$$;

-- Function to get customer statistics for a specific customer
CREATE OR REPLACE FUNCTION get_customer_order_stats(customer_id_param UUID)
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  order_count BIGINT,
  total_amount NUMERIC,
  avg_order_amount NUMERIC
)
LANGUAGE SQL
AS $$
  SELECT 
    c.id as customer_id,
    c.name as customer_name,
    COUNT(o.id) as order_count,
    SUM(o.total) as total_amount,
    AVG(o.total) as avg_order_amount
  FROM 
    orders o
  JOIN
    customers c ON o.customer_id = c.id
  WHERE 
    c.id = customer_id_param
  GROUP BY
    c.id, c.name;
$$;

-- Function to get top customers by order amount
CREATE OR REPLACE FUNCTION get_top_customers()
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  order_count BIGINT,
  total_amount NUMERIC,
  avg_order_amount NUMERIC
)
LANGUAGE SQL
AS $$
  SELECT 
    c.id as customer_id,
    c.name as customer_name,
    COUNT(o.id) as order_count,
    SUM(o.total) as total_amount,
    AVG(o.total) as avg_order_amount
  FROM 
    orders o
  JOIN
    customers c ON o.customer_id = c.id
  GROUP BY
    c.id, c.name
  ORDER BY
    total_amount DESC
  LIMIT 10;
$$; 