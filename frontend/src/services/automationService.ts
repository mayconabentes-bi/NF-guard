import { supabase } from '@/lib/supabase';

/**
 * META ERP - SERVIÇO DE AUTOMAÇÃO E RASTREABILIDADE (SUPABASE EDITION)
 */

export enum EntityType {
  ORDER = 'ORDER',
  TASK = 'TASK',
  BATCH = 'BATCH',
  PRODUCT = 'PRODUCT',
  INVENTORY_SESSION = 'INVENTORY_SESSION',
  WITHDRAWAL_TOKEN = 'WITHDRAWAL_TOKEN',
  XML_INGESTION = 'XML_INGESTION'
}

export interface TraceEvent {
  entityId: string;
  entityType: EntityType;
  action: string;
  userId: string;
  unitId?: string;
  organizationId: string;
  location?: string;
  device?: string;
  metadata?: any;
}

export const automationService = {
  async logEvent(event: TraceEvent) {
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor
      };

      const { error } = await supabase
        .from('traceability_events')
        .insert({
          company_id: event.organizationId,
          entity_id: event.entityId,
          entity_type: event.entityType,
          action: event.action,
          user_id: event.userId !== 'SYSTEM' ? event.userId : null,
          unit_id: event.unitId,
          location: event.location,
          device: event.device || (window.innerWidth < 768 ? 'Mobile' : 'Desktop'),
          metadata: {
            ...event.metadata,
            deviceInfo
          }
        });

      if (error) throw error;
      console.log(`[Rastreio] Evento registrado para ${event.entityType}:${event.entityId}`);
    } catch (error) {
      console.error('Erro ao registrar evento de rastreabilidade:', error);
    }
  },

  async completeProductionTask(taskId: string, userId: string) {
    // In Supabase, we would typically use a stored procedure (RPC) for transactions
    // But for this migration, we'll keep it simple or suggest RPC
    console.warn("completeProductionTask needs RPC for atomic migration to Supabase");
  },

  async getRecentEvents(organizationId: string, limitCount: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('traceability_events')
        .select('*')
        .eq('company_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limitCount);

      if (error) throw error;
      
      return (data || []).map(event => ({
        id: event.id,
        ...event,
        organizationId: event.company_id,
        entityId: event.entity_id,
        entityType: event.entity_type,
        timestampDate: new Date(event.created_at)
      }));
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
  }
};

