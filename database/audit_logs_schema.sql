-- Operational Audit System
-- Table for immutable audit trail

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    operation VARCHAR(100) NOT NULL, -- e.g., 'NFE_WITHDRAWAL_SUCCESS', 'NFE_WITHDRAWAL_FAILED_BALANCE'
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    entity_type VARCHAR(50), -- 'NFE', 'ITEM', etc.
    entity_id TEXT,
    prev_balance DECIMAL(18,4),
    new_balance DECIMAL(18,4),
    status VARCHAR(20), -- 'SUCCESS', 'FAILURE'
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON audit_logs FOR ALL USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_unit ON audit_logs(unit_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_id);
