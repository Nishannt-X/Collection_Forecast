
-- Add missing columns to customers table for ML features
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 700;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'Average';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS location TEXT;

-- Add missing columns to invoices table for ML features  
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Bank Transfer';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS has_early_discount BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS market_condition DECIMAL(5,3) DEFAULT 1.0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_urgency DECIMAL(3,2) DEFAULT 0.5;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_due_days INTEGER DEFAULT 30;

-- Create a table to store ML predictions and model features
CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  predicted_days_to_payment DECIMAL(5,1),
  confidence_score DECIMAL(3,2),
  model_version TEXT DEFAULT 'v1.0',
  prediction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sequence_features JSONB,
  static_features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a table to store company payment history for ML features
CREATE TABLE IF NOT EXISTS company_payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  payment_efficiency DECIMAL(4,3),
  payment_velocity DECIMAL(8,3),
  days_to_payment DECIMAL(5,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ml_predictions_invoice_id ON ml_predictions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_company_payment_history_customer_id ON company_payment_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id_created_at ON invoices(customer_id, created_at);

-- Update customer segments based on credit score
UPDATE customers 
SET segment = CASE 
  WHEN credit_score > 720 THEN 'Reliable'
  WHEN credit_score < 650 THEN 'At-risk'
  ELSE 'Average'
END;
