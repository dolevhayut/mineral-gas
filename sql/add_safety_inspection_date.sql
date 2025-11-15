-- Migration: Add safety inspection date field
-- This migration adds support for tracking last safety inspection date

-- Add last_safety_inspection_date column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_safety_inspection_date DATE;

-- Add helpful comment
COMMENT ON COLUMN customers.last_safety_inspection_date IS 'תאריך בדיקה תקנית אחרונה - התראה תופיע אחרי 4.5 שנים';

