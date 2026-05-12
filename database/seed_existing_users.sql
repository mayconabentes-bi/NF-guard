-- Seed Profile and Unit associations for existing Supabase users
-- This aligns the existing Auth users with the multi-unit architecture

-- 1. Ensure Company exists
INSERT INTO companies (id, name, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Meta Vidros ERP', 'ENTERPRISE')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Profiles for the existing Auth users seen in screenshot
-- UID: 458a5dbd-3e94-436d-a12f-fbeaa47eeac0 (mayconabentes@gmail.com)
INSERT INTO profiles (id, company_id, full_name, role)
VALUES ('458a5dbd-3e94-436d-a12f-fbeaa47eeac0', '00000000-0000-0000-0000-000000000001', 'Maycon Abentes (Nexus Dev)', 'OWNER')
ON CONFLICT (id) DO UPDATE SET role = 'OWNER', company_id = '00000000-0000-0000-0000-000000000001';

-- UID: 0f6fdb08-2d5e-47b6-a743-a9d16bccdd11 (operador@nexus.com)
INSERT INTO profiles (id, company_id, full_name, role)
VALUES ('0f6fdb08-2d5e-47b6-a743-a9d16bccdd11', '00000000-0000-0000-0000-000000000001', 'Operador Logístico', 'OPERATOR')
ON CONFLICT (id) DO UPDATE SET role = 'OPERATOR';

-- UID: dc1123ca-9921-4448-8352-dc8566758dbb (vendedor@nexus.com)
INSERT INTO profiles (id, company_id, full_name, role)
VALUES ('dc1123ca-9921-4448-8352-dc8566758dbb', '00000000-0000-0000-0000-000000000001', 'Vendedor Loja', 'OPERATOR')
ON CONFLICT (id) DO UPDATE SET role = 'OPERATOR';

-- UID: 2005363e-c898-4b6b-a884-4eb0b5714d2d (auditor@nexus.com)
INSERT INTO profiles (id, company_id, full_name, role)
VALUES ('2005363e-c898-4b6b-a884-4eb0b5714d2d', '00000000-0000-0000-0000-000000000001', 'Auditor Fiscal', 'AUDITOR')
ON CONFLICT (id) DO UPDATE SET role = 'AUDITOR';

-- 3. Link Users to specific Units (Example permissions)
-- Linking Operador to all 3 Warehouses (GALPAO)
INSERT INTO profile_units (profile_id, unit_id)
SELECT '0f6fdb08-2d5e-47b6-a743-a9d16bccdd11', id FROM units WHERE type = 'GALPAO'
ON CONFLICT DO NOTHING;

-- Linking Vendedor to all 3 Stores (LOJA)
INSERT INTO profile_units (profile_id, unit_id)
SELECT 'dc1123ca-9921-4448-8352-dc8566758dbb', id FROM units WHERE type = 'LOJA'
ON CONFLICT DO NOTHING;
