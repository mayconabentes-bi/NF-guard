import { XMLParser } from 'fast-xml-parser';

export interface ParsedNFe {
  chave: string;
  numero: string;
  emitente: {
    cnpj: string;
    nome: string;
  };
  itens: {
    sku: string;
    nome: string;
    quantidade: number;
    uom: string;
  }[];
  total: number;
}

export class NFeParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
  }

  parse(xmlContent: string): ParsedNFe {
    const jsonObj = this.parser.parse(xmlContent);
    const nfe = jsonObj.nfeProc?.NFe || jsonObj.NFe;
    const infNFe = nfe?.infNFe;
    const protNFe = jsonObj.nfeProc?.protNFe || jsonObj.protNFe;

    if (!infNFe) throw new Error('XML de NF-e inválido');

    const det = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
    
    return {
      chave: protNFe?.infProt?.chNFe || infNFe['@_Id']?.replace('NFe', ''),
      numero: infNFe.ide.nNF.toString(),
      emitente: {
        cnpj: infNFe.emit.CNPJ,
        nome: infNFe.emit.xNome
      },
      itens: det.map((item: any) => ({
        sku: item.prod.cProd.toString(),
        nome: item.prod.xProd,
        quantidade: parseFloat(item.prod.qCom),
        uom: item.prod.uCom
      })),
      total: parseFloat(infNFe.total.ICMSTot.vNF)
    };
  }
}

export const nfeParser = new NFeParser();
