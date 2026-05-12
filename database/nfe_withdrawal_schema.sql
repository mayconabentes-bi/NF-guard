-- NF-e Withdrawal Control System
-- Core tables for distributed balance control

-- 1. NFs (Main Record)
CREATE TABLE IF NOT EXISTS nfs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    chave_nfe CHAR(44) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'ENCERRADA', 'CANCELADA')),
    retirada_completa BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. NF Itens (Individual items with balance control)
CREATE TABLE IF NOT EXISTS nf_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nf_id UUID NOT NULL REFERENCES nfs(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    nome TEXT NOT NULL,
    quantidade_total DECIMAL(18,4) NOT NULL,
    quantidade_retirada DECIMAL(18,4) DEFAULT 0,
    saldo DECIMAL(18,4) NOT NULL,
    uom VARCHAR(10),
    UNIQUE(nf_id, sku)
);

-- 3. Retiradas (Audit Log and Transaction Record)
CREATE TABLE IF NOT EXISTS nfe_retiradas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nf_item_id UUID NOT NULL REFERENCES nf_itens(id) ON DELETE CASCADE,
    unidade_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    operador_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quantidade_retirada DECIMAL(18,4) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- RLS
ALTER TABLE nfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nf_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfe_retiradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON nfs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON nf_itens FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON nfe_retiradas FOR ALL USING (auth.role() = 'authenticated');
