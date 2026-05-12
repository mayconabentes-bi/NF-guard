import { supabase } from './supabase';
import { MaterialBatch, CuttingLog } from '@/types';

const BATCHES_TABLE = 'batches';
const CUTTINGS_TABLE = 'cuttings';

export const batchService = {
  async getByProduct(company_id: string, productId: string): Promise<MaterialBatch[]> {
    try {
      const { data, error } = await supabase
        .from(BATCHES_TABLE)
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'AVAILABLE')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(b => ({
        ...b,
        organizationId: company_id,
        productId: b.product_id,
        batchNumber: b.batch_number,
        initialMeasurement: b.initial_measurement,
        currentMeasurement: b.current_measurement,
        initialWeight: b.initial_weight,
        currentWeight: b.current_weight,
        createdAt: new Date(b.created_at).getTime()
      } as any));
    } catch (error) {
      console.error('Error fetching batches:', error);
      return [];
    }
  },

  async createBatch(data: Omit<MaterialBatch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const { data: inserted, error } = await supabase
        .from(BATCHES_TABLE)
        .insert([{
          product_id: data.productId,
          batch_number: data.batchNumber,
          initial_measurement: data.initialMeasurement,
          current_measurement: data.currentMeasurement,
          initial_weight: data.initialWeight,
          current_weight: data.currentWeight,
          uom: data.unitOfMeasure,
          status: data.status
        }])
        .select()
        .single();

      if (error) throw error;
      return inserted.id;
    } catch (error) {
      console.error('Error creating batch:', error);
      return '';
    }
  },

  async performCut(data: Omit<CuttingLog, 'id' | 'createdAt'>): Promise<string> {
    try {
      const { data: cuttingId, error } = await supabase.rpc('perform_batch_cut', {
        p_batch_id: data.batchId,
        p_measurement: data.measurementTaken,
        p_waste: data.wasteQuantity,
        p_user_id: data.operatorId,
        p_notes: data.notes
      });

      if (error) throw error;
      return cuttingId;
    } catch (error) {
       console.error('Error performing cut:', error);
       return '';
    }
  },

  async getCuttings(company_id: string): Promise<CuttingLog[]> {
    try {
      const { data, error } = await supabase
        .from(CUTTINGS_TABLE)
        .select('*, products(name, sku)')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(c => ({
        ...c,
        organizationId: company_id,
        createdAt: new Date(c.created_at).getTime()
      } as any));
    } catch (error) {
      console.error('Error fetching cuttings:', error);
      return [];
    }
  }
};
