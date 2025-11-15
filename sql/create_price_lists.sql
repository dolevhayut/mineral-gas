-- Migration: Create Price Lists System
-- This migration adds support for multiple price lists (מחירונים)

-- Create price_lists table
CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create price_list_items table
CREATE TABLE IF NOT EXISTS price_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(price_list_id, product_id)
);

-- Add price_list_id column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS price_list_id UUID REFERENCES price_lists(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_price_list_items_price_list_id ON price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product_id ON price_list_items(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_price_list_id ON customers(price_list_id);

-- Insert default price lists
INSERT INTO price_lists (id, name, description, is_default)
VALUES 
    (gen_random_uuid(), 'מחירון A', 'מחירון בסיסי - מחירים נמוכים יותר', true),
    (gen_random_uuid(), 'מחירון B', 'מחירון מורחב - מחירים גבוהים יותר', false);

-- Get the IDs of the price lists we just created
DO $$
DECLARE
    price_list_a_id UUID;
    price_list_b_id UUID;
    product_48kg_id UUID;
BEGIN
    -- Get price list IDs
    SELECT id INTO price_list_a_id FROM price_lists WHERE name = 'מחירון A';
    SELECT id INTO price_list_b_id FROM price_lists WHERE name = 'מחירון B';
    
    -- Get the 48kg gas cylinder product ID
    SELECT id INTO product_48kg_id FROM products WHERE name = 'בלון גז 48 ק"ג';
    
    -- Insert price for 48kg cylinder in price list A (400 ILS)
    IF product_48kg_id IS NOT NULL THEN
        INSERT INTO price_list_items (price_list_id, product_id, price)
        VALUES (price_list_a_id, product_48kg_id, 400.00);
        
        -- Insert price for 48kg cylinder in price list B (420 ILS)
        INSERT INTO price_list_items (price_list_id, product_id, price)
        VALUES (price_list_b_id, product_48kg_id, 420.00);
    END IF;
    
    -- Update all existing customers to use price list A (default, lower price)
    UPDATE customers 
    SET price_list_id = price_list_a_id
    WHERE price_list_id IS NULL;
END $$;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_price_lists_updated_at ON price_lists;
CREATE TRIGGER update_price_lists_updated_at 
    BEFORE UPDATE ON price_lists 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_price_list_items_updated_at ON price_list_items;
CREATE TRIGGER update_price_list_items_updated_at 
    BEFORE UPDATE ON price_list_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE price_lists IS 'מחירונים - מאפשר להגדיר מחירים שונים למוצרים עבור לקוחות שונים';
COMMENT ON TABLE price_list_items IS 'פריטי מחיר - מחירים מותאמים אישית למוצרים במחירון מסוים';
COMMENT ON COLUMN customers.price_list_id IS 'המחירון המשויך ללקוח - קובע אילו מחירים הוא רואה';

