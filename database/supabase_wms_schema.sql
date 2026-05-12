-- CONSOLIDATED NEXUS ERP SCHEMA FOR SUPABASE
-- Run this in the Supabase SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "http"; -- Required for webhooks

-- 1. COMPANIES (Tenants)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(20) UNIQUE,
    plan VARCHAR(50) DEFAULT 'basic',
    security_webhook_url TEXT, -- Dynamic webhook for alerts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.1 UNITS (Branches/Warehouses)
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- Internal code or branch number
    type VARCHAR(20) CHECK (type IN ('LOJA', 'GALPAO', 'CD')),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PROFILES (Users metadata)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    full_name TEXT,
    role VARCHAR(50) DEFAULT 'OPERATOR' CHECK (role IN ('OWNER', 'ADMIN', 'AUDITOR', 'OPERATOR', 'SECURITY')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.1 USER-UNIT PERMISSIONS (Granular Control)
CREATE TABLE IF NOT EXISTS profile_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    UNIQUE(profile_id, unit_id)
);

-- 3. INTEGRATIONS (Bling, etc)
CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY, -- e.g., 'bling_UUID'
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    apiKey TEXT,
    clientId TEXT,
    clientSecret TEXT,
    warehouseId TEXT,
    enabled BOOLEAN DEFAULT false,
    syncOrders BOOLEAN DEFAULT true,
    syncStock BOOLEAN DEFAULT true,
    lastSync TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. FISCAL XMLS
CREATE TABLE IF NOT EXISTS fiscal_xmls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    access_key CHAR(44) UNIQUE NOT NULL,
    digest_value TEXT NOT NULL,
    issuer_name TEXT,
    issue_date TIMESTAMP WITH TIME ZONE,
    total_value DECIMAL(18,4),
    status VARCHAR(20) DEFAULT 'PENDING',
    items JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. WITHDRAWAL TOKENS
CREATE TABLE IF NOT EXISTS withdrawal_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    xml_id UUID NOT NULL REFERENCES fiscal_xmls(id) ON DELETE CASCADE,
    access_key CHAR(44) NOT NULL,
    item_id TEXT NOT NULL,
    sku TEXT NOT NULL,
    quantity DECIMAL(18,4) NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    target_unit_type VARCHAR(20),
    delivery_audit JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TRACEABILITY EVENTS
CREATE TABLE IF NOT EXISTS traceability_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    unit_id UUID REFERENCES units(id),
    location TEXT,
    device TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS POLICIES (Simplified)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_xmls ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE traceability_events ENABLE ROW LEVEL SECURITY;

-- Note: In production, use more restrictive policies based on auth.uid()
DROP POLICY IF EXISTS "Enable all for authenticated users" ON companies;
CREATE POLICY "Enable all for authenticated users" ON companies FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated users" ON profiles;
CREATE POLICY "Enable all for authenticated users" ON profiles FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated users" ON integrations;
CREATE POLICY "Enable all for authenticated users" ON integrations FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated users" ON fiscal_xmls;
CREATE POLICY "Enable all for authenticated users" ON fiscal_xmls FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated users" ON withdrawal_tokens;
CREATE POLICY "Enable all for authenticated users" ON withdrawal_tokens FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated users" ON traceability_events;
CREATE POLICY "Enable all for authenticated users" ON traceability_events FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON units;
CREATE POLICY "Enable all for authenticated users" ON units FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE profile_units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON profile_units;
CREATE POLICY "Enable all for authenticated users" ON profile_units FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 7. NOTIFICATION CHANNELS
-- ==========================================

CREATE TABLE IF NOT EXISTS notification_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    channel_type VARCHAR(20) CHECK (channel_type IN ('TELEGRAM', 'EMAIL')),
    destination TEXT NOT NULL, -- Email address or Telegram Chat ID
    is_active BOOLEAN DEFAULT true,
    metadata JSONB, -- For extra info like 'Target Name'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON notification_channels;
CREATE POLICY "Enable all for authenticated users" ON notification_channels FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 8. MULTI-CHANNEL DISPATCHER
-- ==========================================

CREATE OR REPLACE FUNCTION notify_fraud_attempt()
RETURNS TRIGGER AS $$
DECLARE
    channel RECORD;
    payload JSONB;
    tg_url TEXT;
    email_url TEXT := 'https://api.resend.com/emails'; -- Example email provider
    api_key TEXT := 'YOUR_API_KEY'; -- Should be stored securely
BEGIN
    -- Only proceed for fraud attempts
    IF (NEW.action = 'FRAUD_ATTEMPT_DOUBLE_DIPPING') THEN
        
        -- Loop through all active channels for this company
        FOR channel IN 
            SELECT * FROM notification_channels 
            WHERE company_id = NEW.company_id AND is_active = true
        LOOP
            
            -- TELEGRAM DISPATCH
            IF (channel.channel_type = 'TELEGRAM') THEN
                -- Payload formatted for Telegram sendMessage API
                payload := jsonb_build_object(
                    'chat_id', channel.destination,
                    'text', format('🚨 *ALERTA DE SEGURANÇA - NEXUS ERP* 🚨%n%nTentativa de fraude detectada!%nItem: %s%nUnidade: %s%nAção: %s%nData: %s', 
                        NEW.entity_id, 
                        (NEW.metadata->>'unitId'), 
                        NEW.action, 
                        NEW.created_at),
                    'parse_mode', 'Markdown'
                );
                
                -- Note: You'll need to set your Bot Token in the URL below
                tg_url := 'https://api.telegram.org/bot' || (SELECT security_webhook_url FROM companies WHERE id = NEW.company_id) || '/sendMessage';
                PERFORM http_post(tg_url, payload::text, 'application/json');

            -- EMAIL DISPATCH
            ELSIF (channel.channel_type = 'EMAIL') THEN
                payload := jsonb_build_object(
                    'from', 'Nexus ERP Security <alerts@nexuserp.com>',
                    'to', ARRAY[channel.destination],
                    'subject', '🚨 ALERTA CRÍTICO: Tentativa de Fraude Detectada',
                    'html', format('<h3>Tentativa de Fraude Detectada</h3><p><b>Entidade:</b> %s</p><p><b>Ação:</b> %s</p><p><b>Data:</b> %s</p>', 
                        NEW.entity_id, NEW.action, NEW.created_at)
                );
                
                -- Send to your email service provider (example using Resend)
                -- PERFORM http_post(email_url, payload::text, 'application/json');
            END IF;

        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_fraud_notification ON traceability_events;
CREATE TRIGGER trigger_fraud_notification
AFTER INSERT ON traceability_events
FOR EACH ROW EXECUTE FUNCTION notify_fraud_attempt();
