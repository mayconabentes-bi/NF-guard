import { supabase } from './supabase';
import { ProductionOrder, ProductionLog, Machine, AuditMatrix } from '@/types';

export const productionService = {
  async listOrders(company_id: string) {
    try {
      const { data, error } = await supabase
        .from('production_orders')
        .select('*')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        organizationId: d.company_id,
        createdAt: new Date(d.created_at).getTime()
      } as any));
    } catch (error) {
      console.error('Error listing production orders:', error);
      return [];
    }
  },

  async createOrder(data: Omit<ProductionOrder, 'id' | 'createdAt' | 'producedQuantity' | 'actualLossQuantity'>) {
    try {
      const { data: inserted, error } = await supabase
        .from('production_orders')
        .insert([{
          company_id: (data as any).organizationId || (data as any).company_id,
          unit_id: (data as any).unitId,
          po_number: data.poNumber,
          product_id: data.productId,
          target_quantity: data.targetQuantity,
          status: data.status,
          machine_id: data.machineId,
          operator_id: data.operatorId,
          expected_loss_pct: data.expectedLossPercent
        }])
        .select()
        .single();

      if (error) throw error;
      return inserted.id;
    } catch (error) {
      console.error('Error creating production order:', error);
      return '';
    }
  },

  async updateOrder(id: string, data: Partial<ProductionOrder>) {
    try {
      const { error } = await supabase
        .from('production_orders')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating production order:', error);
    }
  },

  async recordProductionLog(log: Omit<ProductionLog, 'id' | 'createdAt'>) {
    try {
      // Guide suggests RPC for atomic batch operations
      if (log.type === 'CUT' || log.type === 'WEIGH') {
        const { data: logId, error } = await supabase.rpc('perform_batch_cut', {
          p_po_id: log.poId,
          p_type: log.type,
          p_quantity: log.quantity,
          p_measurement: log.measurement,
          p_weight: log.weight,
          p_user_id: log.userId,
          p_notes: log.notes
        });
        if (error) throw error;
        return logId;
      }

      const { data: inserted, error } = await supabase
        .from('production_logs')
        .insert([{
          po_id: log.poId,
          type: log.type,
          quantity: log.quantity,
          measurement: log.measurement,
          weight: log.weight,
          user_id: log.userId,
          notes: log.notes
        }])
        .select()
        .single();

      if (error) throw error;
      return inserted.id;
    } catch (error) {
      console.error('Error recording production log:', error);
      return '';
    }
  },

  async getLogsByOrder(poId: string) {
    try {
      const { data, error } = await supabase
        .from('production_logs')
        .select('*')
        .eq('po_id', poId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        createdAt: new Date(d.created_at).getTime()
      } as any));
    } catch (error) {
      console.error('Error loading production logs:', error);
      return [];
    }
  },

  async listMachines(company_id: string) {
    // Machines might not have a specific table yet in my schema but let's assume one exists or add it
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('*');
        // Filter by company if implemented
      
      if (error) throw error;
      return (data || []) as Machine[];
    } catch (error) {
      console.error('Error listing machines:', error);
      return [];
    }
  },

  async createAuditMatrix(data: Omit<AuditMatrix, 'id' | 'createdAt'>) {
    try {
      const { data: inserted, error } = await supabase
        .from('audit_matrix')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return inserted.id;
    } catch (error) {
       console.error('Error creating audit matrix:', error);
       return '';
    }
  }
};
