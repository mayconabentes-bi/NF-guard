import { describe, it, expect } from 'vitest';
import { nfeParser } from '../../backend/src/services/nfeParser';
import fs from 'fs';
import path from 'path';

describe('NFeParser Unit Test', () => {
  it('should correctly parse a real NFe XML', () => {
    const xmlPath = path.resolve(__dirname, '../fixtures/nfe/nfe_real_1.xml');
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    
    const parsed = nfeParser.parse(xmlContent);
    
    expect(parsed.chave).toBe('35230500000000000000550010000000011000000010');
    expect(parsed.numero).toBe('12345');
    expect(parsed.emitente.nome).toBe('EMITENTE TESTE LTDA');
    expect(parsed.itens).toHaveLength(2);
    expect(parsed.itens[0].sku).toBe('SKU001');
    expect(parsed.itens[0].quantidade).toBe(15);
    expect(parsed.itens[1].sku).toBe('SKU002');
    expect(parsed.itens[1].quantidade).toBe(5);
  });

  it('should correctly parse the partial test XML', () => {
    const xmlPath = path.resolve(__dirname, '../fixtures/nfe/nfe_partial.xml');
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    
    const parsed = nfeParser.parse(xmlContent);
    
    expect(parsed.chave).toBe('35230500000000000000550010000000021000000020');
    expect(parsed.itens[0].quantidade).toBe(24);
  });
});
