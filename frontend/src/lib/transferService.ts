import { supabase } from './supabase';
import { UnitTransfer } from '@/types';

const TABLE_NAME = 'transfers';

export const transferService = {
  async getAll(company_id: string): Promise<UnitTransfer[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, products(name, sku), fromUnit:units!from_unit_id(name), toUnit:units!to_unit_id(name)')
        .eq('company_id', company_id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        organizationId: company_id,
        requestedAt: new Date(t.requested_at).getTime(),
        fromUnitId: t.from_unit_id,
        toUnitId: t.to_unit_id,
        productId: t.product_id
      } as any));
    } catch (error) {
      console.error('Error listing transfers:', error);
      return [];
    }
  },

  async request(data: Omit<UnitTransfer, 'id' | 'requestedAt' | 'status'>): Promise<string> {
    try {
      const { data: inserted, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          company_id: (data as any).organizationId || (data as any).company_id,
          product_id: data.productId,
          from_unit_id: data.fromUnitId,
          to_unit_id: data.toUnitId,
          quantity: data.quantity,
          status: 'PENDING',
          requester_id: (data as any).requesterId
        }])
        .select()
        .single();

      if (error) throw error;
      return inserted.id;
    } catch (error) {
      console.error('Error requesting transfer:', error);
      return '';
    }
  },

  async approve(id: string, userId: string, userName: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          status: 'APPROVED',
          approved_by: userId,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error approving transfer:', error);
    }
  },

  async complete(id: string): Promise<void> {
    try {
      // Guide suggests RPC for atomic multi-table updates
      const { error } = await supabase.rpc('complete_unit_transfer', {
        p_transfer_id: id
      });

      if (error) throw error;
    } catch (error) {
       console.error('Error completing transfer:', error);
    }
  },

  async reject(id: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          status: 'REJECTED',
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting transfer:', error);
    }
  }
};
