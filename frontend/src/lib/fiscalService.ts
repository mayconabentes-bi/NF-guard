import { supabase } from './supabase';
import { FiscalNote } from '@/types';

const TABLE_NAME = 'fiscal_notes';

export const fiscalService = {
  async getAll(company_id: string): Promise<FiscalNote[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(f => ({
        ...f,
        organizationId: company_id,
        createdAt: new Date(f.created_at).getTime(),
        noteNumber: f.note_number
      } as any));
    } catch (error) {
      console.error('Error listing fiscal notes:', error);
      return [];
    }
  },

  async importNote(data: Omit<FiscalNote, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const { data: inserted, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          company_id: (data as any).organizationId || (data as any).company_id,
          note_number: data.noteNumber,
          issuer_name: data.issuerName,
          issuer_cnpj: data.issuerCnpj,
          total_value: data.totalValue,
          items: data.items,
          status: 'DRAFT'
        }])
        .select()
        .single();

      if (error) throw error;
      return inserted.id;
    } catch (error) {
      console.error('Error importing fiscal note:', error);
      return '';
    }
  },

  async processNote(id: string): Promise<void> {
    try {
      // Guide suggests RPC for atomic multi-item stock updates
      const { error } = await supabase.rpc('process_fiscal_note', {
        p_note_id: id
      });

      if (error) throw error;
    } catch (error) {
       console.error('Error processing fiscal note:', error);
    }
  },

  async cancelNote(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          status: 'CANCELED',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error canceling fiscal note:', error);
    }
  }
};
