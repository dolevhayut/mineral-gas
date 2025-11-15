-- Create delivery_days table for managing which cities are serviced on which days of the week
CREATE TABLE IF NOT EXISTS delivery_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  cities TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_day_of_week UNIQUE (day_of_week)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_days_day_of_week ON delivery_days(day_of_week);

-- Add RLS policies
ALTER TABLE delivery_days ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read delivery days (needed for customers to see available days)
CREATE POLICY "Allow public read access to delivery_days"
  ON delivery_days
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can insert/update/delete (we'll check for admin role in the app)
CREATE POLICY "Allow authenticated users to manage delivery_days"
  ON delivery_days
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_delivery_days_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_days_updated_at
  BEFORE UPDATE ON delivery_days
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_days_updated_at();

