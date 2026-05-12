import { supabase } from '@/lib/supabase';
import { automationService } from '@/services/automationService';

export interface ValidateTokenParams {
  tokenCode: string;
  unitId: string;
  expectedUnitType: 'LOJA' | 'GALPAO';
  userId: string;
}

export class ValidateTokenUseCase {
  public async execute(params: ValidateTokenParams) {
    const { tokenCode, unitId, expectedUnitType, userId } = params;

    const { data: tokenData, error } = await supabase
      .from("withdrawal_tokens")
      .select("*")
      .eq("id", tokenCode)
      .single();
    
    if (error || !tokenData) {
      throw new Error("Token inexistente ou inválido.");
    }

    const tokenTarget = tokenData.target_unit_type || (tokenData.is_heavy ? 'GALPAO' : 'LOJA');
    
    // Regra Antifraude: Double-Dipping
    if (tokenData.status === 'DELIVERED') {
      await automationService.logEvent({
        entityId: tokenCode,
        entityType: 'WITHDRAWAL_TOKEN' as any,
        action: 'FRAUD_ATTEMPT_DOUBLE_DIPPING',
        userId,
        unitId,
        organizationId: tokenData.company_id,
        metadata: { originalDelivery: tokenData.delivery_audit }
      });
      throw new Error(`FRAUDE DETECTADA: Item já entregue em ${tokenData.delivery_audit?.timestamp} na unidade ${tokenData.delivery_audit?.unitId}`);
    }

    // Regra: Desvio de Rota (Loja vs Galpão)
    if (tokenTarget !== expectedUnitType) {
      await automationService.logEvent({
        entityId: tokenCode,
        entityType: 'WITHDRAWAL_TOKEN' as any,
        action: 'FRAUD_ATTEMPT_WRONG_UNIT_TYPE',
        userId,
        unitId,
        organizationId: tokenData.company_id,
        metadata: { expected: expectedUnitType, actual: tokenTarget }
      });
      throw new Error(`DESVIO DE ROTA: Produto é do fluxo de ${tokenTarget}, mas lido no fluxo de ${expectedUnitType}.`);
    }

    return tokenData;
  }
}

export const validateTokenUseCase = new ValidateTokenUseCase();
