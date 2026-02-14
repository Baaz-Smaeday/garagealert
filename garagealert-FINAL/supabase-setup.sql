-- ============================================
-- GarageAlert — Full Database Setup
-- Run this in Supabase SQL Editor (one go)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- GARAGES
CREATE TABLE IF NOT EXISTS garages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postcode TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  default_sms_enabled BOOLEAN DEFAULT true,
  default_whatsapp_enabled BOOLEAN DEFAULT true,
  default_email_enabled BOOLEAN DEFAULT true,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'cancelled', 'past_due')),
  subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'growth', 'pro')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  preferred_channel TEXT DEFAULT 'sms' CHECK (preferred_channel IN ('sms', 'whatsapp', 'email')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONSENT RECORDS
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email')),
  status TEXT NOT NULL CHECK (status IN ('opted_in', 'opted_out')),
  method TEXT CHECK (method IN ('verbal', 'written', 'online_form', 'csv_import', 'unsubscribe_link', 'stop_keyword')),
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  notes TEXT
);

-- VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE NOT NULL,
  registration TEXT NOT NULL,
  make TEXT,
  model TEXT,
  colour TEXT,
  year INTEGER,
  mileage INTEGER,
  mot_due_date DATE,
  last_service_date DATE,
  next_service_date DATE,
  tyre_check_due_date DATE,
  repair_followup_date DATE,
  repair_followup_notes TEXT,
  mot_reminder_enabled BOOLEAN DEFAULT true,
  service_reminder_enabled BOOLEAN DEFAULT true,
  tyre_reminder_enabled BOOLEAN DEFAULT false,
  repair_reminder_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REMINDER SCHEDULES
CREATE TABLE IF NOT EXISTS reminder_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('mot', 'service', 'tyre', 'repair')),
  days_before INTEGER NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(garage_id, reminder_type, days_before)
);

-- MESSAGE TEMPLATES
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('mot', 'service', 'tyre', 'repair', 'ad_hoc')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email')),
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SCHEDULED REMINDERS
CREATE TABLE IF NOT EXISTS scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id UUID REFERENCES garages(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('mot', 'service', 'tyre', 'repair')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email')),
  template_id UUID REFERENCES message_templates(id),
  scheduled_for DATE NOT NULL,
  days_before_due INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, reminder_type, days_before_due, scheduled_for)
);

-- MESSAGE LOGS
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id UUID REFERENCES garages(id) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  scheduled_reminder_id UUID REFERENCES scheduled_reminders(id),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email')),
  recipient TEXT NOT NULL,
  template_id UUID REFERENCES message_templates(id),
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'bounced')),
  provider_message_id TEXT,
  cost_pence NUMERIC(6,2),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  garage_id UUID,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_customers_garage ON customers(garage_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_garage ON vehicles(garage_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_mot_due ON vehicles(mot_due_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_date ON scheduled_reminders(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_garage ON scheduled_reminders(garage_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_garage ON message_logs(garage_id);
CREATE INDEX IF NOT EXISTS idx_consent_customer ON consent_records(customer_id, channel);

-- ROW LEVEL SECURITY
ALTER TABLE garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
DO $$ BEGIN
  -- Drop existing policies if they exist (safe re-run)
  DROP POLICY IF EXISTS "Users can view own garage" ON garages;
  DROP POLICY IF EXISTS "Garage sees own customers" ON customers;
  DROP POLICY IF EXISTS "Garage sees own consent" ON consent_records;
  DROP POLICY IF EXISTS "Garage sees own vehicles" ON vehicles;
  DROP POLICY IF EXISTS "Garage sees own schedules" ON reminder_schedules;
  DROP POLICY IF EXISTS "Garage sees own templates" ON message_templates;
  DROP POLICY IF EXISTS "Garage sees own reminders" ON scheduled_reminders;
  DROP POLICY IF EXISTS "Garage sees own logs" ON message_logs;
  DROP POLICY IF EXISTS "Garage sees own audit" ON audit_logs;
END $$;

CREATE POLICY "Users can view own garage" ON garages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Garage sees own customers" ON customers FOR ALL USING (garage_id IN (SELECT id FROM garages WHERE user_id = auth.uid()));
CREATE POLICY "Garage sees own consent" ON consent_records FOR ALL USING (customer_id IN (SELECT id FROM customers WHERE garage_id IN (SELECT id FROM garages WHERE user_id = auth.uid())));
CREATE POLICY "Garage sees own vehicles" ON vehicles FOR ALL USING (garage_id IN (SELECT id FROM garages WHERE user_id = auth.uid()));
CREATE POLICY "Garage sees own schedules" ON reminder_schedules FOR ALL USING (garage_id IN (SELECT id FROM garages WHERE user_id = auth.uid()));
CREATE POLICY "Garage sees own templates" ON message_templates FOR ALL USING (garage_id IN (SELECT id FROM garages WHERE user_id = auth.uid()));
CREATE POLICY "Garage sees own reminders" ON scheduled_reminders FOR ALL USING (garage_id IN (SELECT id FROM garages WHERE user_id = auth.uid()));
CREATE POLICY "Garage sees own logs" ON message_logs FOR ALL USING (garage_id IN (SELECT id FROM garages WHERE user_id = auth.uid()));
CREATE POLICY "Garage sees own audit" ON audit_logs FOR ALL USING (garage_id IN (SELECT id FROM garages WHERE user_id = auth.uid()));

-- AUTO-CREATE GARAGE ON USER SIGN-UP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.garages (user_id, name, email)
  VALUES (NEW.id, '', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- AUTO-CREATE DEFAULT REMINDER SCHEDULES FOR NEW GARAGE
CREATE OR REPLACE FUNCTION public.handle_new_garage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO reminder_schedules (garage_id, reminder_type, days_before) VALUES
    (NEW.id, 'mot', 30), (NEW.id, 'mot', 14), (NEW.id, 'mot', 7), (NEW.id, 'mot', 1),
    (NEW.id, 'service', 30), (NEW.id, 'service', 14), (NEW.id, 'service', 7),
    (NEW.id, 'tyre', 14), (NEW.id, 'tyre', 7),
    (NEW.id, 'repair', 7), (NEW.id, 'repair', 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_garage_created ON garages;
CREATE TRIGGER on_garage_created
  AFTER INSERT ON garages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_garage();
