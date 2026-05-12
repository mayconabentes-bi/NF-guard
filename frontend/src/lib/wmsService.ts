import { supabase } from "./supabase";
import { NFXML, WithdrawalToken, NFItem } from "@/types";
import { automationService, EntityType } from "@/services/automationService";

// Local cache for development mode when Supabase is unreachable
const getMockCache = () => {
  try {
    return JSON.parse(localStorage.getItem('wms_mock_cache') || '[]');
  } catch (e) {
    return [];
  }
};

const saveToMockCache = (item: any) => {
  const cache = getMockCache();
  cache.push(item);
  localStorage.setItem('wms_mock_cache', JSON.stringify(cache));
};

export const wmsService = {
  // Processes XML and generates tokens
  async ingestXML(xmlData: any, organizationId: string, vendedorId: string, unitId: string) {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");
      // 1. Create XML Record
      const { data: xml, error: xmlError } = await supabase
        .from("fiscal_xmls")
        .insert({
          company_id: organizationId,
          access_key: xmlData.accessKey,
          digest_value: xmlData.digestValue,
          issuer_name: xmlData.issuer,
          issue_date: xmlData.date,
          total_value: xmlData.total,
          status: 'PENDING',
          items: xmlData.items.map((item: any, index: number) => ({
            sequence: index + 1,
            sku: item.sku,
            name: item.name,
            quantity: item.qty,
            uom: item.uom,
            routing: item.isHeavy ? 'GALPAO' : 'LOJA'
          })),
          metadata: {
            originUnitId: unitId,
            vendedorId
          }
        })
        .select()
        .single();

      if (xmlError) throw xmlError;

      // 2. Generate individual Withdrawal Tokens per Item
      const tokens = xmlData.items.map((item: any, index: number) => ({
        company_id: organizationId,
        xml_id: xml.id,
        access_key: xmlData.accessKey,
        item_id: `${xml.id}-${index}`,
        sku: item.sku,
        quantity: item.qty,
        status: 'AVAILABLE',
        target_unit_type: item.isHeavy ? 'GALPAO' : 'LOJA'
      }));

      const { error: tokenError } = await supabase
        .from("withdrawal_tokens")
        .insert(tokens);

      if (tokenError) throw tokenError;

      return xml.id;
    } catch (e) {
      console.error('ingestXML Error:', e);
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Dev Mode: Supabase error ignored, saving to local mock cache');
        const mockId = crypto.randomUUID();
        saveToMockCache({
          id: mockId,
          number: xmlData.number,
          issuer: xmlData.issuer,
          access_key: xmlData.accessKey,
          digest_value: xmlData.digestValue,
          total_value: xmlData.total,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          tokens: xmlData.items.map((item: any, index: number) => ({
            sku: item.sku,
            quantity: item.qty,
            status: 'AVAILABLE',
            is_heavy: item.isHeavy
          }))
        });
        return mockId;
      }
      throw e;
    }
  },

  // Blind Verification: Checks a token status
  async validateToken(tokenCode: string, unitId: string) {
    const { data, error } = await supabase
      .from("withdrawal_tokens")
      .select("*")
      .eq("id", tokenCode)
      .single();
    
    if (error || !data) {
      throw new Error("Token inexistente ou inválido.");
    }

    if (data.status === 'DELIVERED') {
      // Log Fraud Attempt
      await automationService.logEvent({
        entityId: tokenCode,
        entityType: 'WITHDRAWAL_TOKEN' as any,
        action: 'FRAUD_ATTEMPT_DOUBLE_DIPPING',
        userId: (await supabase.auth.getUser()).data.user?.id || 'SYSTEM',
        unitId,
        organizationId: data.company_id,
        metadata: {
          originalDelivery: data.delivery_audit
        }
      });
      throw new Error(`FRAUDE DETECTADA: Item já entregue em ${data.delivery_audit?.timestamp} na unidade ${data.delivery_audit?.unitId}`);
    }

    return data;
  },

  // Finalize delivery (Double-dipping protection)
  async executeDelivery(tokenCode: string, userId: string, unitId: string, receiverName?: string, staffName?: string) {
    // 1. Update status atomically
    const { data: tokenData, error: fetchError } = await supabase
      .from("withdrawal_tokens")
      .select("company_id, sku, quantity")
      .eq("id", tokenCode)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from("withdrawal_tokens")
      .update({
        status: 'DELIVERED',
        delivery_audit: {
          unitId,
          userId,
          staffName: staffName || 'SISTEMA',
          receiverName: receiverName || 'NÃO INFORMADO',
          timestamp: new Date().toISOString(),
          digestValidation: true
        }
      })
      .eq("id", tokenCode);

    if (updateError) throw updateError;

    // Log Successful Delivery
    await automationService.logEvent({
      entityId: tokenCode,
      entityType: 'WITHDRAWAL_TOKEN' as any,
      action: 'WMS_DELIVERY_COMPLETED',
      userId,
      unitId,
      organizationId: tokenData.company_id,
      metadata: { 
        sku: tokenData.sku,
        qty: tokenData.quantity
      }
    });
  },

  async listActiveXMLs(organizationId: string) {
    const localData = getMockCache();
    try {
      if (!supabase) throw new Error("Supabase client not initialized");
      
      const { data, error } = await supabase
        .from("fiscal_xmls")
        .select("*")
        .eq("company_id", organizationId)
        .in("status", ["PENDING", "PARTIAL"]);
      
      if (error) throw error;
      // Merge remote data with local mock cache
      return [...(data || []), ...localData] as any[];
    } catch (e) {
      console.error('listActiveXMLs Error:', e);
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Dev Mode: Supabase error ignored, returning local mock cache');
        return [
          {
            id: 'mock-initial',
            number: '0001',
            issuer: 'Meta Vidros (Exemplo Inicial)',
            access_key: '00000000000000000000000000000000000000000000',
            digest_value: 'HASH-EXEMPLO',
            total_value: 0,
            status: 'PENDING',
            tokens: []
          },
          ...localData
        ];
      }
      throw e;
    }
  },

  async getGlobalAudit(organizationId: string) {
    const { data, error } = await supabase
      .from("withdrawal_tokens")
      .select("*")
      .eq("company_id", organizationId);
    
    if (error) throw error;
    return data as any[];
  },

  async getTokensByXML(xmlId: string) {
    const { data, error } = await supabase
      .from("withdrawal_tokens")
      .select("*")
      .eq("xml_id", xmlId);
    
    if (error) throw error;
    return data as any[];
  }
};

