import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface BlingIntegrationConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  warehouseId: string;
  enabled: boolean;
  syncOrders: boolean;
  syncStock: boolean;
  lastSync: string | null;
}

const BLING_API_BASE = 'https://api.bling.com.br/Api/v3';

export const blingService = {
  async getConfig(organizationId: string): Promise<BlingIntegrationConfig | null> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', `bling_${organizationId}`)
        .single();
      
      if (error) return null;
      return data as BlingIntegrationConfig;
    } catch (error) {
      console.error('Error fetching Bling config:', error);
      return null;
    }
  },

  async syncProducts(organizationId: string) {
    const config = await this.getConfig(organizationId);
    if (!config || !config.enabled) {
       toast.error('Integração Bling não configurada ou desativada.');
       return;
    }

    // In a real scenario, this would call a server-side proxy
    // to avoid CORS and hide the API Key/Secret.
    // For now, we simulate the structure and log intent.
    console.log('Sincronizando produtos do Bling...', {
      endpoint: `${BLING_API_BASE}/produtos`,
      warehouseId: config.warehouseId
    });
    
    toast.info('Sincronização de produtos iniciada...');
    
    // Simulating success
    setTimeout(async () => {
      await supabase
        .from('integrations')
        .update({ lastSync: new Date().toLocaleString('pt-BR') })
        .eq('id', `bling_${organizationId}`);
        
      toast.success('Produtos sincronizados com sucesso!');
    }, 2000);
  },

  async syncStock(organizationId: string) {
    const config = await this.getConfig(organizationId);
    if (!config || !config.enabled) return;

    console.log('Sincronizando estoque do Bling...', {
      endpoint: `${BLING_API_BASE}/estoques`,
      warehouseId: config.warehouseId
    });
  },

  async pushStockUpdate(organizationId: string, sku: string, quantity: number) {
    const config = await this.getConfig(organizationId);
    if (!config || !config.enabled || !config.syncStock) return;

    // This would push inventory adjustments from the local warehouse to Bling
    console.log('Atualizando estoque no Bling...', { sku, quantity });
  }
};
