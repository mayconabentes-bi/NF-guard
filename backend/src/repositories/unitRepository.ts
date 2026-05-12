import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export class UnitRepository {
  async listByCompany(companyId: string) {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  }

  async listByUser(profileId: string) {
    const { data, error } = await supabase
      .from('profile_units')
      .select('units(*)')
      .eq('profile_id', profileId);
    
    if (error) throw error;
    return data.map((item: any) => item.units);
  }

  async checkPermission(profileId: string, unitId: string) {
    const { data, error } = await supabase
      .from('profile_units')
      .select('*')
      .eq('profile_id', profileId)
      .eq('unit_id', unitId)
      .single();
    
    if (error || !data) return false;
    return true;
  }
}

export const unitRepository = new UnitRepository();
