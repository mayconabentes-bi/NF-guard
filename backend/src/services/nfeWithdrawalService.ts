import { nfeWithdrawalRepository } from '../repositories/nfeWithdrawalRepository.js';

export class NFeWithdrawalService {
  async consultNF(chaveNfe: string) {
    const nf = await nfeWithdrawalRepository.findNFWithItems(chaveNfe);
    if (!nf) throw new Error('Nota Fiscal não encontrada');
    if (nf.status === 'ENCERRADA') throw new Error('Esta Nota Fiscal já foi totalmente retirada e está encerrada');
    return nf;
  }

  async executeWithdrawal(
    chaveNfe: string, 
    itemId: string, 
    quantidade: number, 
    unidadeId: string, 
    operadorId: string,
    companyId: string,
    auditInfo: { ip: string, ua: string }
  ) {
    const nf = await nfeWithdrawalRepository.findNFWithItems(chaveNfe);
    if (!nf) throw new Error('Nota Fiscal não encontrada');
    if (nf.status === 'ENCERRADA') throw new Error('Nota Fiscal encerrada');

    return await nfeWithdrawalRepository.processWithdrawal(
      nf.id, 
      itemId, 
      quantidade, 
      unidadeId, 
      operadorId,
      companyId,
      auditInfo
    );
  }

  async getNFStatus(chaveNfe: string) {
    return await nfeWithdrawalRepository.findNFWithItems(chaveNfe);
  }
}

export const nfeWithdrawalService = new NFeWithdrawalService();
