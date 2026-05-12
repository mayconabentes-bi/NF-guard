-- PROFESSIONAL ERP SAAS DATABASE SCHEMA (POSTGRESQL)
-- Architecture: Multi-tenant with RLS (Row Level Security)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES (Master Tenant Table)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(20) UNIQUE, -- CNPJ/CPF
    plan VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. UNITS (Business Units/Branches)
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. WAREHOUSES
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_main BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. LOCATIONS (Picking/Storage Positions)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    aisle VARCHAR(50),
    shelf VARCHAR(50),
    position VARCHAR(50),
    code VARCHAR(100) UNIQUE, -- Unique code like WH-A1-S2-P1
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. USERS & PERMISSIONS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) CHECK (role IN ('owner', 'admin', 'manager', 'operator')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. SUPPLIERS
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(20),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- Recursive hierarchy
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    uom VARCHAR(20) NOT NULL, -- Unit of Measure
    min_stock DECIMAL(18,4) DEFAULT 0,
    cost_price DECIMAL(18,4),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, sku) -- SKU must be unique per company
);

-- 9. STOCK (Current Balance)
CREATE TABLE stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    quantity DECIMAL(18,4) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, product_id, location_id)
);

-- 10. STOCK_MOVEMENTS (Audit Trail)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) CHECK (type IN ('in', 'out', 'transfer', 'adjustment')),
    quantity DECIMAL(18,4) NOT NULL,
    reason TEXT,
    reference_id UUID, -- For linking to NFe or Orders
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. MATERIAL_BATCHES (Measurement Logic)
CREATE TABLE material_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    initial_measurement DECIMAL(18,4) NOT NULL,
    current_measurement DECIMAL(18,4) NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. CUTS (Cutting Logs)
CREATE TABLE cutting_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES material_batches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    measurement_taken DECIMAL(18,4) NOT NULL,
    waste_quantity DECIMAL(18,4) DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. NFE_DOCUMENTS (Fiscal)
CREATE TABLE nfe_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    access_key CHAR(44) UNIQUE,
    nfe_number VARCHAR(20),
    total_value DECIMAL(18,4),
    status VARCHAR(20) DEFAULT 'draft',
    xml_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON stock FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy: user can only see data from their own company
CREATE POLICY company_isolation_policy ON products
    FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY company_isolation_policy ON stock
    FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- INDICES for performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_stock_product ON stock(product_id);
CREATE INDEX idx_movements_org ON stock_movements(company_id);
CREATE INDEX idx_batches_product ON material_batches(product_id, status);
