-- SD-Monitoring Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ingestion logs table (create first for foreign key references)
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('backup', 'vm_failover')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  records_count INTEGER DEFAULT 0,
  error_message TEXT,
  source_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backup reports table
CREATE TABLE IF NOT EXISTS backup_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  computer_name TEXT NOT NULL,
  backup_status TEXT NOT NULL,
  file_age INTEGER,
  modified_time TIMESTAMPTZ,
  ingestion_id UUID REFERENCES ingestion_logs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VM failover reports table
CREATE TABLE IF NOT EXISTS vm_failover_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  computer_name TEXT NOT NULL,
  failover_status TEXT NOT NULL,
  vm_name TEXT,
  ingestion_id UUID REFERENCES ingestion_logs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_backup_reports_created_at ON backup_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_reports_ingestion_id ON backup_reports(ingestion_id);
CREATE INDEX IF NOT EXISTS idx_vm_failover_reports_created_at ON vm_failover_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vm_failover_reports_ingestion_id ON vm_failover_reports(ingestion_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_created_at ON ingestion_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_source_type ON ingestion_logs(source_type);

-- Insert default settings
INSERT INTO app_settings (key, value) VALUES
  ('refresh_interval', '{"seconds": 60}'::jsonb),
  ('data_retention_days', '{"days": 90}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS Policies (optional but recommended)
-- Enable RLS on all tables
ALTER TABLE ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE vm_failover_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API ingestion)
CREATE POLICY "Service role has full access to ingestion_logs" ON ingestion_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to backup_reports" ON backup_reports
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to vm_failover_reports" ON vm_failover_reports
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to app_settings" ON app_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anon role to read data (for dashboard)
CREATE POLICY "Anon can read ingestion_logs" ON ingestion_logs
  FOR SELECT USING (true);

CREATE POLICY "Anon can read backup_reports" ON backup_reports
  FOR SELECT USING (true);

CREATE POLICY "Anon can read vm_failover_reports" ON vm_failover_reports
  FOR SELECT USING (true);

CREATE POLICY "Anon can read app_settings" ON app_settings
  FOR SELECT USING (true);
