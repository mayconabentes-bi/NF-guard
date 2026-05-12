import { supabase } from "./supabase";
import { NFXML, WithdrawalToken, NFItem } from "@/types";
import { automationService, EntityType } from "@/services/automationService";

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
      throw e;
    }
  },



  async listActiveXMLs(organizationId: string) {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");
      
      const { data, error } = await supabase
        .from("fiscal_xmls")
        .select("*")
        .eq("company_id", organizationId)
        .in("status", ["PENDING", "PARTIAL"]);
      
      if (error) throw error;
      return data as any[];
    } catch (e) {
      console.error('listActiveXMLs Error:', e);
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

