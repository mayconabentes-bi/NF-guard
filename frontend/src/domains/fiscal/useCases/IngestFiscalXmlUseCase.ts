import { wmsService } from '@/lib/wmsService';

export interface IngestXmlParams {
  xmlText: string;
  organizationId: string;
  userId: string;
  unitId: string;
}

export class IngestFiscalXmlUseCase {
  /**
   * Executa a análise profunda (Parsing) de um XML de Nota Fiscal
   * e processa as regras de negócio para roteamento de produtos (Pesados x Leves).
   */
  public async execute(params: IngestXmlParams): Promise<void> {
    const { xmlText, organizationId, userId, unitId } = params;

    if (!xmlText) throw new Error("XML Vazio");

    // Lógica de Parsing purificada da Camada Visual
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // Validação básica antifraude de estrutura
    const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];
    if (!infNFe) {
      throw new Error("Estrutura infNFe ausente. XML Inválido ou Corrompido.");
    }

    const ide = xmlDoc.getElementsByTagName('ide')[0];
    const emit = xmlDoc.getElementsByTagName('emit')[0];
    const total = xmlDoc.getElementsByTagName('total')[0];
    const items = xmlDoc.getElementsByTagName('det');
    const accessKey = xmlDoc.getElementsByTagName('chNFe')[0]?.textContent || '';
    const digestValue = xmlDoc.getElementsByTagName('DigestValue')[0]?.textContent || '';

    if (!accessKey) {
      throw new Error("Chave de Acesso (chNFe) ausente. Assinatura não validada.");
    }

    // Regras de Negócio do Domínio de Estoque (WMS)
    // O ideal seria que isso estivesse no domínio de "inventory", mas deixaremos
    // aqui temporariamente como payload para o serviço de ingestão.
    const wmsData = {
      accessKey,
      digestValue,
      number: ide?.getElementsByTagName('nNF')[0]?.textContent || '0',
      issuer: emit?.getElementsByTagName('xNome')[0]?.textContent || 'Desconhecido',
      date: new Date().toISOString(),
      total: parseFloat(total?.getElementsByTagName('vNF')[0]?.textContent || '0'),
      items: Array.from(items).map((item) => {
        const prod = item.getElementsByTagName('prod')[0];
        const qty = parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || '0');
        
        return {
          sku: prod.getElementsByTagName('cProd')[0]?.textContent || '',
          name: prod.getElementsByTagName('xProd')[0]?.textContent || '',
          qty,
          uom: prod.getElementsByTagName('uCom')[0]?.textContent || 'UN',
          // Regra central de roteamento: Maior que 10 = Galpão (isHeavy)
          isHeavy: qty > 10 
        };
      })
    };

    // Delega a persistência para a camada de infraestrutura/repositório
    // No futuro, wmsService.ingestXML será substituído pelo FiscalRepository
    await wmsService.ingestXML(wmsData, organizationId, userId, unitId);
  }
}

// Singleton export (padrão factory/DI para projetos React puros)
export const ingestFiscalXmlUseCase = new IngestFiscalXmlUseCase();
