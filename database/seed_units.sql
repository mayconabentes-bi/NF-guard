-- Seed 3 Stores and 3 Warehouses
-- Note: This assumes a company already exists. 
-- In a real scenario, we'd use the current user's company ID.

INSERT INTO units (name, code, type, is_active, company_id)
SELECT 'Loja Centro', 'L01', 'LOJA', true, id FROM companies LIMIT 1;

INSERT INTO units (name, code, type, is_active, company_id)
SELECT 'Loja Shopping', 'L02', 'LOJA', true, id FROM companies LIMIT 1;

INSERT INTO units (name, code, type, is_active, company_id)
SELECT 'Loja Bairro', 'L03', 'LOJA', true, id FROM companies LIMIT 1;

INSERT INTO units (name, code, type, is_active, company_id)
SELECT 'Depósito Norte', 'D01', 'GALPAO', true, id FROM companies LIMIT 1;

INSERT INTO units (name, code, type, is_active, company_id)
SELECT 'Depósito Sul', 'D02', 'GALPAO', true, id FROM companies LIMIT 1;

INSERT INTO units (name, code, type, is_active, company_id)
SELECT 'Depósito Leste', 'D03', 'GALPAO', true, id FROM companies LIMIT 1;
