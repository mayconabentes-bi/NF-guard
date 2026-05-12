import { supabase } from './supabase';
import { Location } from '@/types';

const TABLE_NAME = 'locations';

export const locationService = {
  async getAll(company_id: string): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('company_id', company_id)
        .order('full_address', { ascending: true });

      if (error) throw error;
      return (data || []).map(l => ({
        id: l.id,
        organizationId: l.company_id,
        unitId: l.unit_id,
        warehouseId: l.warehouse_id,
        label: l.label,
        type: l.type,
        parentId: l.parent_id,
        fullAddress: l.full_address,
        occupiedById: l.occupied_by_id,
        zoneCategory: l.zone_category,
        maxWeight: l.max_weight,
        maxVolume: l.max_volume,
        isLocked: l.is_locked,
        createdAt: new Date(l.created_at).getTime()
      }));
    } catch (error) {
       console.error('Error listing locations:', error);
       return [];
    }
  },

  async create(data: Partial<Location>): Promise<string> {
    try {
      const { data: inserted, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          company_id: data.organizationId,
          unit_id: data.unitId,
          warehouse_id: data.warehouseId,
          label: data.label,
          type: data.type,
          parent_id: data.parentId,
          full_address: data.fullAddress,
          occupied_by_id: data.occupiedById,
          zone_category: data.zoneCategory,
          max_weight: data.maxWeight,
          max_volume: data.maxVolume,
          is_locked: data.isLocked
        }])
        .select()
        .single();

      if (error) throw error;
      return inserted.id;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<Location>): Promise<void> {
    try {
      const updateData: any = {};
      if (data.organizationId) updateData.company_id = data.organizationId;
      if (data.unitId) updateData.unit_id = data.unitId;
      if (data.warehouseId) updateData.warehouse_id = data.warehouseId;
      if (data.label) updateData.label = data.label;
      if (data.type) updateData.type = data.type;
      if (data.parentId !== undefined) updateData.parent_id = data.parentId;
      if (data.fullAddress) updateData.full_address = data.fullAddress;
      if (data.occupiedById !== undefined) updateData.occupied_by_id = data.occupiedById;
      if (data.zoneCategory !== undefined) updateData.zone_category = data.zoneCategory;
      if (data.maxWeight !== undefined) updateData.max_weight = data.maxWeight;
      if (data.maxVolume !== undefined) updateData.max_volume = data.maxVolume;
      if (data.isLocked !== undefined) updateData.is_locked = data.isLocked;

      const { error } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }
};
