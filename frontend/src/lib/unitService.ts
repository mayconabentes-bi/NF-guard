import { supabase } from './supabase';
import { Unit } from '@/types';

const TABLE_NAME = 'units';

export const unitService = {
  async getAll(company_id: string): Promise<Unit[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(u => ({
      ...u,
      organizationId: u.company_id, // Compatibility
      createdAt: new Date(u.created_at).getTime()
    } as any));
  },

  async create(data: Omit<Unit, 'id' | 'createdAt'>): Promise<string> {
    const { data: inserted, error } = await supabase
      .from(TABLE_NAME)
      .insert([{
        company_id: (data as any).organizationId || (data as any).company_id,
        name: data.name,
        address: data.address,
        is_main: data.isMain
      }])
      .select()
      .single();

    if (error) throw error;
    return inserted.id;
  },

  async update(id: string, data: Partial<Unit>): Promise<void> {
    const updateData: any = { ...data };
    if (data.isMain !== undefined) updateData.is_main = data.isMain;
    delete updateData.isMain;

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
