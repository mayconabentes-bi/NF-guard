import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export class NFeRepository {
  async saveXML(xmlData: any) {
    const { data, error } = await supabase
      .from('fiscal_xmls')
      .insert(xmlData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async findByAccessKey(accessKey: string) {
    const { data, error } = await supabase
      .from('fiscal_xmls')
      .select('*')
      .eq('access_key', accessKey)
      .single();
    
    if (error) return null;
    return data;
  }
}

export const nfeRepository = new NFeRepository();
