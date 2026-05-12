export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'OPERATOR';

export interface UserProfile {
  id: string; // Changed from uid to id
  email: string;
  fullName: string; 
  displayName: string; // Added back for compatibility
  organizationId: string;
  role: UserRole;
  unitIds: string[]; 
  createdAt: number;
}

export interface Organization {
  id: string;
  name: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  ownerId: string;
  createdAt: number;
}

export interface Unit {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  isMain: boolean; // Added for unitService
  createdAt: number;
}

export interface Warehouse {
  id: string;
  unitId: string;
  organizationId: string;
  name: string;
  createdAt: number;
}

export interface Product {
  id: string;
  organizationId: string;
  sku: string;           // Código Interno
  barcode?: string;      // Código de Barras
  name: string;          // Descrição
  description: string;
  category: string;
  subcategory?: string;
  unitOfMeasure: string;
  measurement?: number;  // Metragem
  cost?: number;         // Custo
  minimumStock: number;
  supplier?: string;     // Fornecedor
  location?: string;     // Localização Física (Joined)
  locationArea?: string;
  locationCorridor?: string;
  locationShelf?: string;
  locationPosition?: string;
  unitId: string;        // Unidade empresarial
  weightPerUnit?: number; // Added for productService
  meterPerUnit?: number;  // Added for productService
  status: 'ACTIVE' | 'INACTIVE';
  currentStock: number;  // Added for real-time tracking
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export type LocationType = 'STREET' | 'SHELF' | 'COLUMN' | 'LEVEL' | 'BIN' | 'ZONE' | 'DOCK';

export type ZoneCategory = 
  | 'RECEIVING' 
  | 'QUARANTINE' 
  | 'PICKING_A' 
  | 'PICKING_B' 
  | 'PICKING_C' 
  | 'BULK' 
  | 'EXPEDITION' 
  | 'RETURN' 
  | 'FLAMMABLE'
  | 'COLD_STORAGE';

export interface Location {
  id: string;
  organizationId: string;
  unitId: string;
  warehouseId: string;
  label: string;
  parentId?: string;
  type: LocationType;
  fullAddress: string;
  occupiedById?: string;
  maxWeight?: number;
  maxVolume?: number;
  zoneCategory?: ZoneCategory;
  isLocked?: boolean;
  createdAt: number;
}

export interface MovementAudit {
  id: string;
  organizationId: string;
  operatorId: string;
  productId: string;
  originLocationId?: string;
  destinationLocationId: string;
  movementType: 'PUTAWAY' | 'PICKING' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  batchNumber?: string;
  serialNumber?: string;
  timestamp: number;
  hash: string;
}

export interface Stock {
  productId: string;
  warehouseId: string;
  organizationId: string;
  quantity: number;
  updatedAt: number;
}

export type MovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

export interface Movement {
  id: string;
  organizationId: string;
  unitId: string;
  warehouseId: string;
  productId: string;
  type: MovementType;
  quantity: number;
  userId: string;
  userName?: string;
  reason: string;
  documentNumber?: string;
  createdAt: number;
  sourceWarehouseId?: string; // For transfers
}

export interface MaterialBatch {
  id: string;
  productId: string;
  organizationId: string;
  warehouseId: string;
  batchNumber: string; // Lote
  initialMeasurement: number; // Metragem Inicial
  currentMeasurement: number; // Metragem Atual
  initialWeight?: number;      // Peso Inicial
  currentWeight?: number;      // Peso Atual
  unitOfMeasure: string;
  location?: string;
  createdAt: number;
  updatedAt: number;
  status: 'AVAILABLE' | 'CONSUMED' | 'SCRAPPED';
}

export type POStatus = 'DRAFT' | 'RELEASED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface ProductionOrder {
  id: string;
  organizationId: string;
  unitId: string;
  poNumber: string;
  productId: string;
  productName: string;
  targetQuantity: number;
  producedQuantity: number;
  status: POStatus;
  machineId?: string;
  operatorId?: string;
  weightPerUnit?: number;
  meterPerUnit?: number;
  expectedLossPercent: number;
  actualLossQuantity: number;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
}

export interface ProductionLog {
  id: string;
  poId: string;
  organizationId: string;
  type: 'START' | 'STOP' | 'REUSE' | 'LOSS' | 'SCRAP' | 'WEIGH' | 'CUT';
  quantity: number;
  measurement?: number;
  weight?: number;
  userId: string;
  userName: string;
  notes?: string;
  createdAt: number;
}

export interface Machine {
  id: string;
  organizationId: string;
  unitId: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  currentPoId?: string;
  lastMaintenance: number;
  nextMaintenance: number;
}

export interface AuditMatrix {
  id: string;
  poId: string;
  organizationId: string;
  divergenceScore: number; // 0-100
  checks: {
    category: 'WEIGHT' | 'METER' | 'INVENTORY' | 'PROCESS';
    status: 'PASS' | 'FAIL' | 'WARNING';
    detail: string;
  }[];
  auditedBy: 'AI' | 'MANUAL';
  createdAt: number;
}

export interface CuttingLog {
  id: string;
  batchId: string;
  productId: string;
  organizationId: string;
  measurementTaken: number; 
  wasteQuantity: number; 
  reason?: string;
  operatorId: string; // Added for batchService
  notes?: string;     // Added for batchService
  userId: string;
  createdAt: number;
}

export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface UnitTransfer {
  id: string;
  organizationId: string;
  productId: string;
  quantity: number;
  fromUnitId: string;
  toUnitId: string;
  requestedBy: string;
  requestedByName?: string;
  requestedAt: number;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: number;
  status: TransferStatus;
  notes?: string;
}

export interface FiscalItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  mappedProductId?: string; // ID do produto interno associado
}

export interface FiscalNote {
  id: string;
  organizationId: string;
  accessKey: string; 
  number: string;
  noteNumber: string; // Added for fiscalService
  series: string;
  issuerName: string;
  issuerCnpj: string;
  totalValue: number;
  items: FiscalItem[];
  status: 'DRAFT' | 'PROCESSED' | 'ERROR' | 'CANCELED';
  xmlUrl?: string;
  createdAt: number;
  processedAt?: number;
}

export interface NFXML {
  id: string;
  organizationId: string;
  accessKey: string;
  digestValue: string;
  issuerName: string;
  issueDate: string;
  totalValue: number;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'FLAGGED';
  items: NFItem[];
  metadata: {
    originUnitId: string;
    vendedorId: string;
  };
  createdAt: string;
}

export interface NFItem {
  id: string;
  sequence: number;
  sku: string;
  name: string;
  quantity: number;
  deliveredQuantity: number;
  uom: string;
  routing: 'LOJA' | 'GALPAO';
  deliveryTokens: string[]; // IDs of generated tokens
}

export interface WithdrawalToken {
  id: string; // Token UUID or QR Content
  organizationId: string;
  xmlId: string;
  accessKey: string;
  itemId: string;
  sku: string;
  quantity: number;
  status: 'AVAILABLE' | 'DELIVERED' | 'CANCELLED';
  targetUnitType: 'LOJA' | 'GALPAO';
  deliveryAudit?: {
    unitId: string;
    userId: string;
    timestamp: string;
    digestValidation: boolean;
  };
}

export interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  totalUnits: number;
  monthlyMovements: number;
}
