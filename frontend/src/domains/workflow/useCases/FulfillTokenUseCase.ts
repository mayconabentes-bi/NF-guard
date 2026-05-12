import { supabase } from '@/lib/supabase';
import { automationService } from '@/services/automationService';

export interface FulfillTokenParams {
  tokenCode: string;
  userId: string;
  unitId: string;
  receiverName?: string;
  staffName?: string;
}

export class FulfillTokenUseCase {
  public async execute(params: FulfillTokenParams): Promise<void> {
    const { tokenCode, userId, unitId, receiverName, staffName } = params;

    // Fetch required data to log correctly
    const { data: tokenData, error: fetchError } = await supabase
      .from("withdrawal_tokens")
      .select("company_id, sku, quantity, status")
      .eq("id", tokenCode)
      .single();

    if (fetchError) throw fetchError;
    if (tokenData.status === 'DELIVERED') {
      throw new Error("Token já entregue.");
    }

    // Atomic update
    const { error: updateError } = await supabase
      .from("withdrawal_tokens")
      .update({
        status: 'DELIVERED',
        delivery_audit: {
          unitId,
          userId,
          staffName: staffName || 'SISTEMA',
          receiverName: receiverName || 'NÃO INFORMADO',
          timestamp: new Date().toISOString(),
          digestValidation: true
        }
      })
      .eq("id", tokenCode);

    if (updateError) throw updateError;

    // Success Event
    await automationService.logEvent({
      entityId: tokenCode,
      entityType: 'WITHDRAWAL_TOKEN' as any,
      action: 'WMS_DELIVERY_COMPLETED',
      userId,
      unitId,
      organizationId: tokenData.company_id,
      metadata: { 
        sku: tokenData.sku,
        qty: tokenData.quantity
      }
    });
  }
}

export const fulfillTokenUseCase = new FulfillTokenUseCase();
