-- Add order_number column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number SERIAL;

-- Create a sequence starting from 1
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;

-- Set default value for order_number
ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT nextval('order_number_seq');

-- Update existing orders to have sequential numbers
UPDATE orders 
SET order_number = nextval('order_number_seq') 
WHERE order_number IS NULL;

-- Make order_number unique and not null
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE orders ADD CONSTRAINT unique_order_number UNIQUE (order_number);

-- Create a function to format order number with leading zeros
CREATE OR REPLACE FUNCTION format_order_number(order_num INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(order_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
