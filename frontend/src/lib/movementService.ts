import { supabase } from './supabase';
import { Movement, Stock } from '@/types';

const MOVEMENTS_TABLE = 'movements';
const STOCK_TABLE = 'stock';

export const stockService = {
  async getStock(company_id: string, unit_id: string, product_id: string): Promise<Stock | null> {
    try {
      const { data, error } = await supabase
        .from(STOCK_TABLE)
        .select('*')
        .eq('product_id', product_id)
        .eq('unit_id', unit_id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        organizationId: company_id,
        warehouseId: data.unit_id // Mapping
      } as any;
    } catch (error) {
      console.error('Error fetching stock:', error);
      return null;
    }
  },

  async getOrganizationStock(company_id: string): Promise<Stock[]> {
    try {
      // Joins can be used here if needed, but simple stock query for now
      const { data, error } = await supabase
        .from(STOCK_TABLE)
        .select('*, products(name, sku)')
        .eq('products.company_id', company_id);

      if (error) throw error;
      return (data || []).map(s => ({
        ...s,
        organizationId: company_id,
        warehouseId: s.unit_id
      } as any));
    } catch (error) {
      console.error('Error fetching org stock:', error);
      return [];
    }
  }
};

export const movementService = {
  async getRecent(company_id: string, limitCount = 50): Promise<Movement[]> {
    try {
      const { data, error } = await supabase
        .from(MOVEMENTS_TABLE)
        .select('*, products(name, sku), units(name)')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false })
        .limit(limitCount);

      if (error) throw error;
      return (data || []).map(m => ({
        ...m,
        organizationId: m.company_id,
        warehouseId: m.unit_id,
        createdAt: new Date(m.created_at).getTime()
      } as any));
    } catch (error) {
      console.error('Error listing movements:', error);
      return [];
    }
  },

  async performMovement(data: Omit<Movement, 'id' | 'createdAt'>): Promise<string> {
    try {
      // Guide recommends RPC for atomic movement
      const { data: movementId, error } = await supabase.rpc('perform_stock_movement', {
        p_product_id: data.productId,
        p_unit_id: data.warehouseId || (data as any).unitId,
        p_company_id: data.organizationId,
        p_type: data.type,
        p_quantity: data.quantity,
        p_reason: data.reason,
        p_user_id: data.userId || null
      });

      if (error) throw error;
      return movementId;
    } catch (error) {
      console.error('Error performing movement:', error);
      return '';
    }
  }
};
