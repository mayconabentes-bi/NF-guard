import { supabase } from './supabase';
import { Product } from '@/types';

const TABLE_NAME = 'products';

export const productService = {
  async getAll(company_id: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        organizationId: p.company_id, // Compatibility mapping
        currentStock: 0, // In SQL, stock is in a separate table or calculated
        unitOfMeasure: p.uom || 'UN',
        locationArea: p.location_area,
        locationCorridor: p.location_corridor,
        locationShelf: p.location_shelf,
        locationPosition: p.location_position
      } as any));
    } catch (error) {
      console.error('Error listing products:', error);
      return [];
    }
  },

  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const { data: inserted, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          company_id: (data as any).organizationId || (data as any).company_id,
          sku: data.sku,
          name: data.name,
          description: data.description,
          category: data.category,
          uom: data.unitOfMeasure,
          min_stock: data.minimumStock,
          weight_per_unit: data.weightPerUnit,
          meter_per_unit: data.meterPerUnit,
          location: data.location,
          location_area: data.locationArea,
          location_corridor: data.locationCorridor,
          location_shelf: data.locationShelf,
          location_position: data.locationPosition,
          status: data.status
        }])
        .select()
        .single();

      if (error) throw error;
      return inserted.id;
    } catch (error) {
      console.error('Error creating product:', error);
      return '';
    }
  },

  async update(id: string, data: Partial<Product>): Promise<void> {
    try {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.sku) updateData.sku = data.sku;
      if (data.description) updateData.description = data.description;
      if (data.category) updateData.category = data.category;
      if (data.unitOfMeasure) updateData.uom = data.unitOfMeasure;
      if (data.minimumStock !== undefined) updateData.min_stock = data.minimumStock;
      if (data.location) updateData.location = data.location;
      if (data.locationArea) updateData.location_area = data.locationArea;
      if (data.locationCorridor) updateData.location_corridor = data.locationCorridor;
      if (data.locationShelf) updateData.location_shelf = data.locationShelf;
      if (data.locationPosition) updateData.location_position = data.locationPosition;
      if (data.status) updateData.status = data.status;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating product:', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // Guide suggests soft delete, but for products we might want hard or soft.
      // Usually RLS handles access. Let's do a hard delete for now or implement deleted_at if table has it.
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  },

  async importBatch(company_id: string, products: any[]): Promise<{ success: number; errors: number }> {
    try {
      const formatted = products.map(p => ({
        company_id: company_id,
        sku: p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: p.name || 'Sem Nome',
        description: p.description || '',
        category: p.category || 'Geral',
        uom: p.unitOfMeasure || p.uom || 'UN',
        min_stock: p.minimumStock || p.min_stock || 0,
        weight_per_unit: p.weightPerUnit || p.weight_per_unit || 0,
        meter_per_unit: p.meterPerUnit || p.meter_per_unit || 0
      }));

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .upsert(formatted, { 
          onConflict: 'company_id,sku',
          ignoreDuplicates: false 
        })
        .select();

      if (error) throw error;
      
      return { 
        success: data?.length || 0, 
        errors: formatted.length - (data?.length || 0) 
      };
    } catch (error) {
      console.error('Error in batch import:', error);
      throw error;
    }
  },

  async getBySku(company_id: string, sku: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('company_id', company_id)
        .eq('sku', sku)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        organizationId: data.company_id,
        unitOfMeasure: data.uom
      } as any;
    } catch (error) {
      console.error('Error searching product by SKU:', error);
      return null;
    }
  },

  async recordMovement(data: any): Promise<void> {
    try {
      const { error } = await supabase.rpc('perform_stock_movement', {
        p_product_id: data.productId,
        p_unit_id: data.unitId,
        p_company_id: data.organizationId || data.company_id,
        p_type: data.type,
        p_quantity: data.quantity,
        p_reason: data.reason,
        p_user_id: data.userId
      });

      if (error) throw error;
    } catch (e) {
      console.error('Erro ao registrar movimentação no terminal:', e);
      throw e;
    }
  }
};
