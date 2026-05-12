import { LocationType, ZoneCategory } from '@/types';

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  ZONE: 'Área',
  STREET: 'Rua',
  SHELF: 'Estante',
  COLUMN: 'Coluna',
  LEVEL: 'Nível',
  BIN: 'Posição / Bin',
  DOCK: 'Doca / Expedição'
};

export const ZONE_CATEGORY_LABELS: Record<ZoneCategory, string> = {
  RECEIVING: 'Recebimento',
  QUARANTINE: 'Quarentena',
  PICKING_A: 'Picking Alto Giro',
  PICKING_B: 'Picking Médio Giro',
  PICKING_C: 'Picking Baixo Giro',
  BULK: 'Pulmão / Palete',
  EXPEDITION: 'Expedição',
  RETURN: 'Logística Reversa',
  FLAMMABLE: 'Inflamáveis',
  COLD_STORAGE: 'Câmara Fria'
};
