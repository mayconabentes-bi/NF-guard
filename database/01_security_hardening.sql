-- ========================================================================================
-- NF-GUARD: SECURITY HARDENING & MULTITENANCY SCRIPT
-- ========================================================================================
-- Execute este script no Editor SQL do Supabase.
-- Ele não apaga seus dados atuais, apenas fortifica a arquitetura e blinda as regras.

-- ----------------------------------------------------------------------------------------
-- FASE 1: FUNÇÃO DE CONTEXTO DE SEGURANÇA (MULTITENANCY)
-- ----------------------------------------------------------------------------------------
-- Essa função permite que o banco saiba automaticamente qual é a empresa do usuário logado.
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ----------------------------------------------------------------------------------------
-- FASE 2: ISOLAMENTO ESTRITO POR EMPRESA (RLS Hardening)
-- ----------------------------------------------------------------------------------------

-- 2.1 Tabela: nfs (Notas Fiscais)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON nfs;
CREATE POLICY "Isolate nfs per company" ON nfs 
FOR ALL USING (company_id = public.user_company_id());

-- 2.2 Tabela: units (Unidades Operacionais)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON units;
CREATE POLICY "Isolate units per company" ON units 
FOR ALL USING (company_id = public.user_company_id());

-- 2.3 Tabela: nf_itens (Itens da Nota)
-- Como o item não tem company_id direto, ele valida pela NF pai.
DROP POLICY IF EXISTS "Enable all for authenticated users" ON nf_itens;
CREATE POLICY "Isolate nf_itens per company" ON nf_itens 
FOR ALL USING (
  EXISTS (SELECT 1 FROM nfs WHERE nfs.id = nf_itens.nf_id AND nfs.company_id = public.user_company_id())
);

-- ----------------------------------------------------------------------------------------
-- FASE 3: IMUTABILIDADE DA TRILHA DE AUDITORIA (Append-Only)
-- ----------------------------------------------------------------------------------------

-- Tabela: audit_logs
DROP POLICY IF EXISTS "Enable all for authenticated users" ON audit_logs;

-- Permite apenas LER os logs da própria empresa
CREATE POLICY "Select own company logs" ON audit_logs 
FOR SELECT USING (company_id = public.user_company_id());

-- Permite INSERIR logs apenas na própria empresa
CREATE POLICY "Insert own company logs" ON audit_logs 
FOR INSERT WITH CHECK (company_id = public.user_company_id());

-- Bloqueio absoluto: NINGUÉM pode alterar ou deletar logs via cliente
-- (Não criamos políticas de UPDATE ou DELETE)

-- Tabela: traceability_events (Se existir no schema consolidado)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'traceability_events') THEN
        DROP POLICY IF EXISTS "Enable all for authenticated users" ON traceability_events;
        CREATE POLICY "Select own traceability" ON traceability_events FOR SELECT USING (company_id = public.user_company_id());
        CREATE POLICY "Insert own traceability" ON traceability_events FOR INSERT WITH CHECK (company_id = public.user_company_id());
    END IF;
END $$;

-- ----------------------------------------------------------------------------------------
-- FASE 4: BLINDAGEM MATEMÁTICA (Generated Columns)
-- ----------------------------------------------------------------------------------------
-- Garante que o saldo do item seja SEMPRE = (quantidade_total - quantidade_retirada)
-- Nenhuma requisição poderá enviar um "saldo" falso. O banco de dados passa a ser o juiz absoluto.

-- (Nota: Para alterar para Generated Column, a coluna existente precisa ser recriada)
ALTER TABLE nf_itens DROP COLUMN IF EXISTS saldo;
ALTER TABLE nf_itens ADD COLUMN saldo DECIMAL(18,4) GENERATED ALWAYS AS (quantidade_total - quantidade_retirada) STORED;

-- ========================================================================================
-- FIM DO SCRIPT DE HARDENING
-- ========================================================================================
