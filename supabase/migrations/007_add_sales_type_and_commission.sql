-- Add sales_type and commission columns to submitted_vehicles table
-- For storing selling option (Direktverkauf, Inzahlungnahme, Verkauf im Kundenauftrag)
-- and commission percentage for consignment sales

ALTER TABLE submitted_vehicles
ADD COLUMN sales_type VARCHAR(100) DEFAULT 'Direktverkauf an KFZ RBM';

ALTER TABLE submitted_vehicles
ADD COLUMN commission DECIMAL(5, 2) NULL;

-- Create indexes for filtering by sales_type (useful for admin dashboards)
CREATE INDEX idx_submitted_vehicles_sales_type ON submitted_vehicles(sales_type);

-- Create index for commission filtering (admin reporting)
CREATE INDEX idx_submitted_vehicles_commission ON submitted_vehicles(commission) WHERE commission IS NOT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN submitted_vehicles.sales_type IS
  'Selling option: Direktverkauf an KFZ RBM, Inzahlungnahme, or Verkauf im Kundenauftrag';

COMMENT ON COLUMN submitted_vehicles.commission IS
  'Commission percentage for Verkauf im Kundenauftrag sales (admin-only field)';
