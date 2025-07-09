
-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  customer_number TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  industry TEXT,
  contract_type TEXT CHECK (contract_type IN ('time-based', 'milestone', 'mixed')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  description TEXT,
  contract_type TEXT CHECK (contract_type IN ('time-based', 'milestone', 'mixed')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  predicted_payment_date DATE,
  days_late INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consultancy_metrics table for dashboard metrics
CREATE TABLE public.consultancy_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2),
  contract_type TEXT,
  description TEXT,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create risk_factors table
CREATE TABLE public.risk_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  factor_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')) NOT NULL,
  count INTEGER DEFAULT 1,
  description TEXT NOT NULL,
  affected_customers TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forecast_data table for predictions
CREATE TABLE public.forecast_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL,
  forecast_amount DECIMAL(12,2) NOT NULL,
  collected_amount DECIMAL(12,2) DEFAULT 0,
  accuracy_percentage DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultancy_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (we'll implement authentication later)
-- For now, allow all operations for demonstration purposes
CREATE POLICY "Allow all operations" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.consultancy_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.risk_factors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON public.forecast_data FOR ALL USING (true) WITH CHECK (true);

-- Insert sample customers
INSERT INTO public.customers (name, customer_number, email, industry, contract_type, risk_level) VALUES
('Phillips', '870', 'contact@phillips.com', 'Manufacturing', 'time-based', 'high'),
('Western Union Co', '25', 'billing@westernunion.com', 'Financial Services', 'milestone', 'high'),
('Noble Energy', '199', 'accounts@nobleenergy.com', 'Energy', 'time-based', 'medium'),
('Delta', '527', 'payments@delta.com', 'Airlines', 'milestone', 'low'),
('TechCorp Ltd', '100', 'finance@techcorp.com', 'Technology', 'mixed', 'medium'),
('Global Systems Inc', '200', 'billing@globalsystems.com', 'IT Services', 'time-based', 'medium'),
('DataFlow Solutions', '300', 'accounts@dataflow.com', 'Software', 'milestone', 'high'),
('Enterprise Corp', '400', 'payments@enterprisecorp.com', 'Consulting', 'mixed', 'low'),
('TechFlow Ltd', '500', 'finance@techflow.com', 'Technology', 'time-based', 'low'),
('SystemsMax', '600', 'billing@systemsmax.com', 'IT Services', 'milestone', 'low'),
('QuickTech Services', '700', 'accounts@quicktech.com', 'Technology', 'mixed', 'medium');

-- Insert sample invoices
INSERT INTO public.invoices (invoice_number, customer_id, amount, due_date, status, contract_type, risk_level, predicted_payment_date, days_late) 
SELECT 
  'INV-' || LPAD(ROW_NUMBER() OVER()::TEXT, 3, '0'),
  c.id,
  CASE 
    WHEN c.customer_number = '870' THEN 190.83
    WHEN c.customer_number = '25' THEN 1908.27
    WHEN c.customer_number = '199' THEN 892.45
    WHEN c.customer_number = '527' THEN 1245.67
    WHEN c.customer_number = '100' THEN 15000.00
    WHEN c.customer_number = '200' THEN 28000.00
    WHEN c.customer_number = '300' THEN 67000.00
    WHEN c.customer_number = '400' THEN 8500.00
    WHEN c.customer_number = '500' THEN 32000.00
    WHEN c.customer_number = '600' THEN 45000.00
    ELSE 25000.00
  END,
  CASE 
    WHEN c.customer_number IN ('870', '25') THEN '2024-10-07'::DATE
    WHEN c.customer_number = '199' THEN '2024-10-07'::DATE
    WHEN c.customer_number = '527' THEN '2024-10-15'::DATE
    ELSE CURRENT_DATE + INTERVAL '30 days'
  END,
  CASE 
    WHEN c.customer_number IN ('870', '25') THEN 'overdue'
    WHEN c.customer_number = '199' THEN 'sent'
    WHEN c.customer_number = '527' THEN 'sent'
    ELSE 'sent'
  END,
  c.contract_type,
  c.risk_level,
  CASE 
    WHEN c.customer_number = '870' THEN '2024-09-24'::DATE
    WHEN c.customer_number = '25' THEN '2024-09-26'::DATE
    WHEN c.customer_number = '199' THEN '2024-10-10'::DATE
    WHEN c.customer_number = '527' THEN '2024-10-12'::DATE
    ELSE CURRENT_DATE + INTERVAL '25 days'
  END,
  CASE 
    WHEN c.customer_number = '870' THEN 236
    WHEN c.customer_number = '25' THEN 223
    ELSE 0
  END
FROM public.customers c;

-- Insert sample consultancy metrics
INSERT INTO public.consultancy_metrics (metric_type, metric_name, amount, percentage, contract_type, description) VALUES
('promise', 'Missed Customer Promise', 30513.00, 2.0, 'Mixed', 'From 2 invoices (1 time-based, 1 milestone)'),
('promise', 'No Customer Promise', 840098.00, 42.0, 'Mixed', 'From 137 invoices (95 time-based, 42 milestone)'),
('promise', 'Upcoming Customer Promise', 1139534.00, 57.0, 'Mixed', 'From 46 invoices (30 monthly, 16 milestone)'),
('financial', 'Forecast', 2980896.00, NULL, 'Recurring + Project', '$3,075,245 as of Sep 1 (62% time-based)'),
('financial', 'Collected', 970751.00, NULL, 'Mixed', 'From 50 Payments (35 monthly, 15 milestones)'),
('financial', 'Remaining', 2010145.00, NULL, 'Combined', 'To meet your forecast target (stable + variable)');

-- Insert sample risk factors
INSERT INTO public.risk_factors (factor_type, severity, count, description, affected_customers) VALUES
('Project Delays', 'medium', 2, 'SAP implementation milestones at risk', ARRAY['TechCorp Ltd', 'Global Systems Inc']),
('Contract Renewals', 'high', 1, 'Time-based contracts expiring soon', ARRAY['DataFlow Solutions']),
('Milestone Approvals', 'low', 3, 'Pending client approvals for completed work', ARRAY['Enterprise Corp', 'TechFlow Ltd', 'SystemsMax']),
('Client Engagement', 'medium', 1, 'Reduced communication frequency', ARRAY['QuickTech Services']);

-- Insert sample forecast data
INSERT INTO public.forecast_data (month, forecast_amount, collected_amount, accuracy_percentage) VALUES
('Jan 2024', 4200000, 4100000, 97.6),
('Feb 2024', 3800000, 3650000, 96.1),
('Mar 2024', 5100000, 4950000, 97.1),
('Apr 2024', 4700000, 4400000, 93.6),
('May 2024', 5300000, 5150000, 97.2),
('Jun 2024', 4500000, 3200000, 71.1),
('Jul 2024', 5800000, 4100000, 70.7),
('Aug 2024', 6200000, 5500000, 88.7),
('Sep 2024', 3400000, 1200000, 35.3),
('Oct 2024', 5200000, 0, 0),
('Nov 2024', 4800000, 0, 0),
('Dec 2024', 5500000, 0, 0);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultancy_metrics_updated_at BEFORE UPDATE ON public.consultancy_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_factors_updated_at BEFORE UPDATE ON public.risk_factors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forecast_data_updated_at BEFORE UPDATE ON public.forecast_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
