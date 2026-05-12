import * as React from 'react';
import { 
  QrCode, 
  Plus, 
  Minus, 
  ArrowRightLeft, 
  Package, 
  ChevronLeft,
  History,
  Box,
  MapPin,
  Bot,
  Send,
  Activity,
  Timer,
  Square,
  Factory,
  Database,
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Keyboard
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { useAuth } from '@/lib/AuthContext';
import { productService } from '@/lib/productService';
import { aiService } from '@/lib/aiService';
import { unitService } from '@/lib/unitService';
import { locationService } from '@/lib/locationService';
import { automationService, EntityType } from '@/services/automationService';
import { Product, Unit, Location } from '@/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type OperationMode = 'ENTRADA' | 'SAIDA' | 'TRANSFER' | 'COUNT' | 'NONE';

interface ScanLog {
  id: string;
  sku: string;
  name: string;
  mode: OperationMode;
  qty: number;
  timestamp: number;
}

export default function MobileTerminal() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [mode, setMode] = React.useState<'MENU' | 'SCANNER' | 'RESULT' | 'LOGS' | 'SETUP'>('MENU');
  const [opMode, setOpMode] = React.useState<OperationMode>('NONE');
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [selectedUnit, setSelectedUnit] = React.useState('');
  const [selectedArea, setSelectedArea] = React.useState('');
  const [selectedStreet, setSelectedStreet] = React.useState('');
  const [product, setProduct] = React.useState<Product | null>(null);
  const [movementQty, setMovementQty] = React.useState(1);
  const [scanHistory, setScanHistory] = React.useState<ScanLog[]>([]);
  const [manualSku, setManualSku] = React.useState('');
  const [showManualInput, setShowManualInput] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Scanner Refs
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const [isScannerReady, setIsScannerReady] = React.useState(false);

  // AI Chat State
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);
  const [aiInput, setAiInput] = React.useState('');
  const [aiMessages, setAiMessages] = React.useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isAITyping, setIsAITyping] = React.useState(false);

  // Load Units and Locations
  React.useEffect(() => {
    if (profile?.organizationId) {
      unitService.getAll(profile.organizationId).then(setUnits).catch(() => {});
      locationService.getAll(profile.organizationId).then(setLocations).catch(() => {});
    }
  }, [profile?.organizationId]);

  // Filtered Locations
  const areas = React.useMemo(() => {
    if (!selectedUnit) return [];
    return locations.filter(l => l.unitId === selectedUnit && (l.type === 'ZONE' || !l.parentId));
  }, [locations, selectedUnit]);

  const streets = React.useMemo(() => {
    if (!selectedArea) return [];
    return locations.filter(l => l.parentId === selectedArea);
  }, [locations, selectedArea]);

  const currentAddress = React.useMemo(() => {
    const u = units.find(u => u.id === selectedUnit)?.name || '';
    const a = locations.find(l => l.id === selectedArea)?.label || '';
    const s = locations.find(l => l.id === selectedStreet)?.label || '';
    return [u, a, s].filter(Boolean).join(' > ');
  }, [units, locations, selectedUnit, selectedArea, selectedStreet]);

  // Audio/Haptic Feedback
  const playBeep = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.1);
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio feedback failed');
    }
    
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  // Scanner Initialization
  const startScanner = async () => {
    if (scannerRef.current) return;
    
    // Check if element exists
    const element = document.getElementById("qr-reader-full");
    if (!element) return;

    const html5QrCode = new Html5Qrcode("qr-reader-full");
    scannerRef.current = html5QrCode;
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const config = { fps: 20, qrbox: { width: 280, height: 280 } };
    
    // Detect environment camera vs user
    const facingMode = isMobile ? { facingMode: "environment" } : "user";

    try {
      await html5QrCode.start(
        facingMode,
        config,
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {} // Quiet on failure
      );
      setIsScannerReady(true);
    } catch (err) {
      console.error("Scanner failed to start with exact environment", err);
      // Fallback to basic case (facingMode as string or simpler object)
      try {
        await html5QrCode.start({ facingMode: "environment" }, config, handleSuccessfulScan, () => {});
        setIsScannerReady(true);
      } catch (e) {
        try {
           await html5QrCode.start("user", config, handleSuccessfulScan, () => {});
           setIsScannerReady(true);
        } catch (finalErr) {
           toast.error("Erro ao acessar câmera. Verifique permissões.");
           setMode('MENU');
        }
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current = null;
        setIsScannerReady(false);
      } catch (e) {
        console.error("Failed to stop scanner", e);
      }
    }
  };

  React.useEffect(() => {
    if (mode === 'SCANNER') {
      // Small timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => { 
        clearTimeout(timer);
        stopScanner(); 
      };
    }
  }, [mode]);

  const handleSuccessfulScan = async (sku: string) => {
    playBeep();
    if (opMode === 'COUNT') {
      // Direct physical count mode - log and continue
      await logScanAction(sku, 'COUNT', 1);
      toast.success(`Item ${sku} contabilizado.`);
    } else {
      // Search for product details for movement
      lookupProduct(sku);
    }
  };

  const lookupProduct = async (sku: string) => {
    if (!profile?.organizationId) return;
    setIsLoading(true);
    try {
      const data = await productService.getBySku(profile.organizationId, sku);
      if (data) {
        setProduct(data);
        setMode('RESULT');
      } else {
        toast.error('Produto não identificado no catálogo.');
      }
    } catch (e) {
      toast.error('Gargalo na consulta via nuvem');
    } finally {
      setIsLoading(false);
    }
  };

  const logScanAction = async (sku: string, operation: OperationMode, qty: number, prodName: string = 'Item Identificado') => {
    const log: ScanLog = {
      id: Math.random().toString(36).slice(2),
      sku,
      name: prodName,
      mode: operation,
      qty,
      timestamp: Date.now()
    };
    setScanHistory(prev => [log, ...prev].slice(0, 50));
    
    // Remote logging with device recognition
    await automationService.logEvent({
      entityId: sku,
      entityType: EntityType.PRODUCT,
      action: `TERMINAL_${operation}`,
      userId: user?.id || 'terminal',
      organizationId: profile?.organizationId || 'DEMO',
      location: currentAddress || 'UNASSIGNED',
      metadata: { 
        qty, 
        operation, 
        unitId: selectedUnit,
        areaId: selectedArea,
        streetId: selectedStreet,
        device: window.innerWidth < 768 ? 'Mobile' : 'Desktop',
        timestamp: Date.now() 
      }
    });
  };

  const handleMovement = async () => {
    if (!product || !profile?.organizationId || !user) return;
    setIsLoading(true);
    try {
      const type = opMode === 'ENTRADA' ? ('IN' as any) : ('OUT' as any);
      
      await productService.recordMovement({
        organizationId: profile.organizationId,
        unitId: selectedUnit || 'DEFAULT',
        warehouseId: selectedStreet || selectedArea || 'PHASE-TERMINAL',
        productId: product.id,
        type,
        quantity: movementQty,
        userId: user.id,
        userName: profile.displayName || 'Terminal User',
        reason: `Terminal Ops [${currentAddress}]: ${opMode}`,
        createdAt: Date.now()
      });

      await logScanAction(product.sku, opMode, movementQty, product.name);
      toast.success(`Operação ${opMode} concluída e sincronizada.`);
      setMode('MENU');
      setProduct(null);
      setMovementQty(1);
    } catch (e) {
      toast.error('Falha na sincronização ou estoque insuficiente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAISend = async () => {
    if (!aiInput.trim() || isAITyping) return;
    const userMsg = aiInput.trim();
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAiInput('');
    setIsAITyping(true);
    try {
      const response = await aiService.chat(userMsg, aiMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })));
      setAiMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      toast.error("Erro na resposta da IA Meta.");
    } finally {
      setIsAITyping(false);
    }
  };

  const renderScanner = () => (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
      <div className="p-4 flex items-center justify-between text-white border-b border-white/10 backdrop-blur-md bg-black/50 z-10">
        <Button variant="ghost" onClick={() => setMode('MENU')} className="text-white h-12 w-12 rounded-full p-0">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="text-center">
          <Badge className={cn(
             "text-white border-none mb-1",
             opMode === 'ENTRADA' ? "bg-emerald-600" : opMode === 'SAIDA' ? "bg-rose-600" : "bg-blue-600"
          )}>MODO: {opMode}</Badge>
          <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Scanner RF Industrial</p>
        </div>
        <Button variant="ghost" onClick={() => setShowManualInput(!showManualInput)} className="text-white h-12 w-12 rounded-full p-0">
          <Keyboard className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col bg-black">
        <div id="qr-reader-full" className="absolute inset-0 h-full w-full object-cover"></div>
        
        {/* Overlay Guide */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
           <div className="w-[280px] h-[280px] border-2 border-dashed border-blue-500/50 rounded-[40px] relative">
              <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl"></div>
              <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl"></div>
              <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl"></div>
              <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-3xl"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="h-[1px] w-full bg-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan-line"></div>
              </div>
           </div>
           
           <div className="absolute bottom-[20%] text-center px-10">
              <p className="text-sm font-black text-white/90 uppercase tracking-widest bg-black/60 px-6 py-3 rounded-full backdrop-blur-md border border-white/5">Centralize o Código</p>
           </div>
        </div>

        {showManualInput && (
          <div className="absolute bottom-10 left-6 right-6 z-20 animate-in slide-in-from-bottom-2">
            <div className="bg-[#070b14]/90 border border-white/10 rounded-3xl p-4 backdrop-blur-xl shadow-2xl flex gap-2">
              <Input 
                placeholder="Digitar SKU/EAN..." 
                className="bg-transparent border-white/10 text-white h-14 rounded-2xl focus:ring-blue-500 placeholder:text-slate-600"
                value={manualSku}
                onChange={(e) => setManualSku(e.target.value)}
                autoFocus
              />
              <Button className="h-14 w-14 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg" onClick={() => handleSuccessfulScan(manualSku)}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans p-4 pb-28 selection:bg-blue-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-900/40 border border-white/10">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black tracking-tighter uppercase text-slate-100 leading-none">META RF</h1>
            <div className="flex items-center gap-2 mt-1.5">
               <Badge variant="outline" className="text-[7px] border-blue-500/30 text-blue-400 uppercase font-black px-1.5 py-0 h-4 tracking-tighter">Multi-Device Ops</Badge>
               <div className="h-1 w-1 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        <Button variant="ghost" onClick={() => navigate('/')} className="text-slate-500 hover:text-white bg-slate-800/10 h-12 w-12 p-0 rounded-2xl border border-white/5">
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      {mode === 'MENU' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* Section Setup */}
           <div className="bg-slate-900/40 rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
              <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
                 <MapPin className="h-32 w-32 text-blue-500" />
              </div>
              <div className="relative z-10 flex items-center justify-between mb-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Alocação de Terminal</p>
                 <Button variant="ghost" size="sm" onClick={() => setMode('SETUP')} className="text-blue-500 font-black text-[10px] h-6 uppercase hover:bg-blue-500/10">Trocar Unidade</Button>
              </div>
              <div className="relative z-10 flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/10">
                    <MapPin className="h-6 w-6 text-blue-500" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white uppercase truncate">{currentAddress || "Setup Pendente"}</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Operador: {profile?.displayName?.split(' ')[0]}</p>
                 </div>
              </div>
           </div>

           {/* Full Power Actions */}
           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setOpMode('ENTRADA'); setMode('SCANNER'); }}
                className="h-44 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-[2.5rem] flex flex-col items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all border-b-8 border-emerald-900 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="h-12 w-12 mb-1 drop-shadow-lg" />
                <span className="text-xl font-heading font-black uppercase tracking-tight">Entrada</span>
                <span className="text-[10px] font-bold text-emerald-100/60 uppercase tracking-widest italic">Estoque (+)</span>
              </button>

              <button 
                onClick={() => { setOpMode('SAIDA'); setMode('SCANNER'); }}
                className="h-44 bg-rose-600/90 hover:bg-rose-600 text-white rounded-[2.5rem] flex flex-col items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all border-b-8 border-rose-900 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Minus className="h-12 w-12 mb-1 drop-shadow-lg" />
                <span className="text-xl font-heading font-black uppercase tracking-tight">Saída</span>
                <span className="text-[10px] font-bold text-rose-100/60 uppercase tracking-widest italic">Baixa (-)</span>
              </button>

              <button 
                onClick={() => { setOpMode('TRANSFER'); setMode('SCANNER'); }}
                className="h-36 bg-slate-900 hover:bg-slate-800 rounded-[2.2rem] flex flex-col items-center justify-center gap-2 border border-white/5 active:scale-95 transition-all shadow-xl group"
              >
                <ArrowRightLeft className="h-7 w-7 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Transferência</span>
              </button>

              <button 
                onClick={() => { setOpMode('COUNT'); setMode('SCANNER'); }}
                className="h-36 bg-slate-900 hover:bg-slate-800 rounded-[2.2rem] flex flex-col items-center justify-center gap-2 border border-white/5 active:scale-95 transition-all shadow-xl group"
              >
                <RotateCcw className="h-7 w-7 text-emerald-500 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Contagem RF</span>
              </button>
           </div>

           {/* Metrics/Stats Card */}
           <Card className="bg-[#0f172a] border-white/5 p-6 rounded-[2.5rem] shadow-2xl overflow-hidden relative border-t border-t-white/5">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/10">
                    <Activity className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-100">Live Telemetry</p>
                    <p className="text-[10px] font-bold text-slate-600">Sincronização Industrial Automática</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/5 p-4 rounded-[1.5rem] text-center border border-white/5">
                        <p className="text-xl font-black text-white">{scanHistory.length}</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase mt-0.5">Scans</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-[1.5rem] text-center border border-white/5">
                        <p className="text-xl font-black text-emerald-500">OK</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase mt-0.5">Health</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-[1.5rem] text-center border border-white/5">
                        <p className="text-xl font-black text-blue-500">{new Date().getHours() > 12 ? '2nd' : '1st'}</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase mt-0.5">Shift</p>
                    </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-5 rotate-12">
                <Database className="h-44 w-44" />
              </div>
           </Card>

           <div className="pt-2">
              <Button 
                variant="ghost" 
                onClick={() => setMode('LOGS')} 
                className="w-full text-slate-600 h-14 uppercase font-black tracking-widest text-[9px] hover:text-white transition-colors"
              >
                <History className="h-3 w-3 mr-2" /> Auditoria de Leitura Local
              </Button>
           </div>
        </div>
      )}

      {mode === 'SCANNER' && renderScanner()}

      {mode === 'RESULT' && product && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <Card className="bg-[#070b14] border-white/5 text-white rounded-[3.5rem] overflow-hidden shadow-2xl relative border border-white/10">
            <div className={cn(
              "p-6 flex items-center justify-between",
              opMode === 'ENTRADA' ? "bg-emerald-600 shadow-[0_4px_20px_rgba(16,185,129,0.3)]" : "bg-rose-600 shadow-[0_4px_20px_rgba(225,29,72,0.3)]"
            )}>
               <span className="text-[10px] font-black uppercase tracking-[2px] text-white/70">Aguardando Confirmação</span>
               <Badge className="bg-black/20 text-white border border-white/10 font-mono py-1 text-xs">{product.sku}</Badge>
            </div>
            <CardContent className="p-8 pb-10">
              <div className="text-center mb-8">
                 <h2 className="text-3xl font-heading font-black mb-2 tracking-tighter leading-none uppercase text-white drop-shadow-sm">{product.name}</h2>
                 <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black opacity-80 max-w-xs mx-auto">{product.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl text-center shadow-inner">
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1.5">Saldo Cloud</p>
                    <p className="text-3xl font-heading font-black text-blue-500 leading-none">{product.currentStock}</p>
                    <p className="text-[10px] text-slate-700 uppercase font-black mt-1">{product.unitOfMeasure}</p>
                 </div>
                 <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl text-center shadow-inner">
                    <MapPin className="h-4 w-4 text-slate-700 mx-auto mb-1.5" />
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1.5">Endereço</p>
                    <p className="text-2xl font-black text-slate-100 uppercase tracking-tighter">{product.location || 'N/D'}</p>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="flex items-center justify-center gap-10 p-6 bg-slate-900/50 rounded-[3rem] border border-white/5 shadow-2xl">
                    <button 
                      onClick={() => setMovementQty(Math.max(1, movementQty - 1))}
                      className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-all text-slate-300 shadow-xl"
                    >
                      <Minus className="h-7 w-7" />
                    </button>
                    <div className="flex flex-col items-center min-w-[100px]">
                       <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">Mover</span>
                       <span className="text-7xl font-heading font-black text-white leading-none tabular-nums">{movementQty}</span>
                    </div>
                    <button 
                      onClick={() => setMovementQty(movementQty + 1)}
                      className={cn(
                        "h-16 w-16 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all",
                        opMode === 'ENTRADA' ? "bg-emerald-600" : "bg-rose-600"
                      )}
                    >
                      <Plus className="h-7 w-7" />
                    </button>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    <Button 
                      className={cn(
                        "h-24 rounded-[2.5rem] text-xl font-black uppercase flex items-center gap-4 shadow-2xl border-b-8 transition-all hover:translate-y-[-2px] disabled:opacity-50",
                        opMode === 'ENTRADA' ? "bg-emerald-600 border-emerald-900" : "bg-rose-600 border-rose-900"
                      )}
                      onClick={handleMovement}
                      disabled={isLoading}
                    >
                       <CheckCircle2 className="h-10 w-10" /> 
                       {isLoading ? "Processando..." : `Confirmar ${opMode}`}
                    </Button>

                    <Button 
                      variant="ghost" 
                      className="w-full h-16 text-slate-600 uppercase font-black text-[10px] tracking-widest mt-2 hover:text-white"
                      onClick={() => { setMode('MENU'); setProduct(null); }}
                    >
                       <X className="h-4 w-4 mr-2" /> Cancelar Lote
                    </Button>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {mode === 'LOGS' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-600">
           <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Auditoria RF</h2>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Últimos 50 eventos locais</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMode('MENU')} className="bg-slate-900 h-10 w-10 p-0 rounded-xl border border-white/5 text-slate-500">
                 <X className="h-4 w-4" />
              </Button>
           </div>
           <ScrollArea className="h-[68vh] rounded-[3rem] bg-black/40 border border-white/5 p-5">
              <div className="space-y-3">
                 {scanHistory.length > 0 ? scanHistory.map(log => (
                    <div key={log.id} className="p-5 bg-[#0f172a] rounded-3xl border border-white/5 flex items-center gap-5 transition-all hover:bg-slate-900 group">
                       <div className={cn(
                         "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border",
                         log.mode === 'ENTRADA' ? "bg-emerald-600/10 text-emerald-500 border-emerald-500/20" : 
                         log.mode === 'SAIDA' ? "bg-rose-600/10 text-rose-500 border-rose-500/20" : "bg-blue-600/10 text-blue-500 border-blue-500/20"
                       )}>
                          {log.mode === 'ENTRADA' ? <Plus className="h-6 w-6" /> : log.mode === 'SAIDA' ? <Minus className="h-6 w-6" /> : <RotateCcw className="h-6 w-6" />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <p className="text-[10px] font-black uppercase text-slate-100 truncate group-hover:text-blue-400 transition-colors">{log.name}</p>
                             <p className="text-[8px] text-slate-600 font-bold ml-2 shrink-0">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                             <Badge variant="outline" className="h-4 p-0 px-1 border-white/10 text-slate-600 text-[7px]">{log.sku}</Badge>
                             <span>•</span>
                             <span className="text-slate-400 font-black">{log.qty} {log.mode === 'COUNT' ? 'CONTADO' : 'UN'}</span>
                          </p>
                       </div>
                    </div>
                 )) : (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-800">
                       <History className="h-16 w-16 mb-4 opacity-10" />
                       <p className="text-[10px] font-black uppercase tracking-[4px]">Sem Atividade RF</p>
                    </div>
                 )}
              </div>
           </ScrollArea>
           <Button 
            className="w-full h-18 rounded-[2rem] bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-500 uppercase font-black text-xs tracking-widest" 
            onClick={() => setMode('MENU')}
           >
              Retornar ao Dashboard
           </Button>
        </div>
      )}

      {mode === 'SETUP' && (
        <div className="space-y-6 animate-in zoom-in-95 duration-400">
           <Card className="bg-[#0f172a] border border-white/10 rounded-[3.5rem] p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                 <Factory className="h-24 w-24" />
              </div>
              <div className="relative z-10 text-center mb-8">
                 <div className="h-16 w-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-4 border border-blue-500/20">
                    <Database className="h-8 w-8" />
                 </div>
                 <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1">Configuração Logística</h2>
                 <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Defina o ponto de operação do terminal</p>
              </div>

              <div className="relative z-10 space-y-6">
                 {/* Unit Selection */}
                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                       <div className="h-1 w-1 bg-blue-500 rounded-full" /> 01. Unidade Operacional
                    </label>
                    <ScrollArea className="h-32 bg-black/20 rounded-2xl border border-white/5 p-2">
                       <div className="space-y-1.5">
                          {units.map(unit => (
                            <button
                              key={unit.id}
                              onClick={() => { setSelectedUnit(unit.id); setSelectedArea(''); setSelectedStreet(''); }}
                              className={cn(
                                "w-full px-4 py-3 rounded-xl border text-left transition-all text-[11px] font-black uppercase tracking-tight",
                                selectedUnit === unit.id ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                              )}
                            >
                               {unit.name}
                            </button>
                          ))}
                       </div>
                    </ScrollArea>
                 </div>

                 {/* Area Selection */}
                 <div className={cn("space-y-3 transition-opacity", !selectedUnit && "opacity-30 pointer-events-none")}>
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                       <div className="h-1 w-1 bg-emerald-500 rounded-full" /> 02. Área / Almoxarifado
                    </label>
                    <ScrollArea className="h-32 bg-black/20 rounded-2xl border border-white/5 p-2">
                       <div className="space-y-1.5">
                          {areas.map(area => (
                            <button
                              key={area.id}
                              onClick={() => { setSelectedArea(area.id); setSelectedStreet(''); }}
                              className={cn(
                                "w-full px-4 py-3 rounded-xl border text-left transition-all text-[11px] font-black uppercase tracking-tight",
                                selectedArea === area.id ? "bg-emerald-600 border-emerald-500 text-white shadow-lg" : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                              )}
                            >
                               {area.label}
                            </button>
                          ))}
                          {selectedUnit && areas.length === 0 && (
                             <p className="text-center py-8 text-[8px] font-bold text-slate-700 uppercase tracking-widest">Nenhuma Área Identificada</p>
                          )}
                       </div>
                    </ScrollArea>
                 </div>

                 {/* Street Selection */}
                 <div className={cn("space-y-3 transition-opacity", !selectedArea && "opacity-30 pointer-events-none")}>
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                       <div className="h-1 w-1 bg-amber-500 rounded-full" /> 03. Rua / Setor de Scanner
                    </label>
                    <ScrollArea className="h-32 bg-black/20 rounded-2xl border border-white/5 p-2">
                       <div className="space-y-1.5">
                          {streets.map(street => (
                            <button
                              key={street.id}
                              onClick={() => setSelectedStreet(street.id)}
                              className={cn(
                                "w-full px-4 py-3 rounded-xl border text-left transition-all text-[11px] font-black uppercase tracking-tight",
                                selectedStreet === street.id ? "bg-amber-600 border-amber-500 text-white shadow-lg" : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                              )}
                            >
                               {street.label}
                            </button>
                          ))}
                          {selectedArea && streets.length === 0 && (
                             <p className="text-center py-8 text-[8px] font-bold text-slate-700 uppercase tracking-widest">Nenhuma Rua Identificada</p>
                          )}
                       </div>
                    </ScrollArea>
                 </div>

                 <div className="pt-4 flex gap-3">
                    <Button variant="ghost" onClick={() => setMode('MENU')} className="flex-1 h-14 rounded-2xl uppercase font-black text-[9px] tracking-widest hover:bg-white/5">Cancelar</Button>
                    <Button 
                      className="flex-[2] h-14 bg-blue-600 rounded-2xl uppercase font-black tracking-tight shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:bg-blue-500 text-sm"
                      onClick={() => {
                         toast.success("Terminal Alocado", {
                           description: currentAddress
                         });
                         setMode('MENU');
                      }}
                      disabled={!selectedUnit}
                    >
                       Ativar Terminal
                    </Button>
                 </div>
              </div>
           </Card>
        </div>
      )}

      {/* Industrial Footer Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#070b14]/95 backdrop-blur-3xl border-t border-white/5 px-8 pt-4 pb-10 flex items-center justify-between z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
         <div className="flex flex-col items-center">
            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse mb-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">RF System 3.5</span>
         </div>
         
         <Sheet open={isAIChatOpen} onOpenChange={setIsAIChatOpen}>
           <SheetTrigger>
             <Button className="h-20 w-20 rounded-[2rem] bg-blue-600 shadow-[0_8px_30px_rgba(37,99,235,0.5)] relative -top-10 border-8 border-[#070b14] hover:bg-blue-500 transition-all active:scale-90 group">
                <Bot className="h-9 w-9 text-white group-hover:scale-110 transition-transform" />
             </Button>
          </SheetTrigger>
           <SheetContent side="bottom" className="h-[85vh] bg-[#070b14] border-white/5 rounded-t-[4rem] p-0 flex flex-col text-white">
              <SheetHeader className="p-10 border-b border-white/5 flex-row items-center justify-between space-y-0 bg-slate-900/30">
                 <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-blue-600 rounded-[1.8rem] flex items-center justify-center shadow-2xl border border-white/10 group">
                       <Bot className="h-8 w-8 text-white group-hover:rotate-12 transition-transform" />
                    </div>
                    <div>
                       <SheetTitle className="text-white font-black tracking-tighter uppercase text-2xl">META AI RF-OPS</SheetTitle>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[2px] flex items-center gap-2 mt-1">
                          <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-pulse" /> Analista de Materiais em Tempo Real
                       </p>
                    </div>
                 </div>
                 <Button variant="ghost" onClick={() => setIsAIChatOpen(false)} className="h-12 w-12 rounded-2xl bg-white/5 text-slate-500">
                    <X className="h-5 w-5" />
                 </Button>
              </SheetHeader>
              <ScrollArea className="flex-1 p-10">
                 <div className="space-y-8 pb-10">
                    <div className="mr-auto bg-slate-900 border border-white/5 rounded-[2rem] rounded-tl-none p-6 text-sm text-slate-400 font-medium max-w-[90%] shadow-xl">
                       Olá {profile?.displayName?.split(' ')[0]}! Sou o assistente RF do terminal. Como posso ajudar com os saldos ou localizações hoje?
                    </div>
                    {aiMessages.map((m, i) => (
                      <div key={i} className={cn(
                        "max-w-[85%] rounded-[2rem] p-6 text-sm leading-relaxed font-semibold shadow-2xl animate-in slide-in-from-bottom-2",
                        m.role === 'user' ? "ml-auto bg-blue-600 text-white rounded-tr-none" : "mr-auto bg-slate-900 text-slate-100 rounded-tl-none border border-white/5"
                      )}>
                        {m.text}
                      </div>
                    ))}
                    {isAITyping && (
                      <div className="mr-auto bg-slate-900 rounded-3xl p-5 flex gap-2 items-center border border-white/10 rounded-tl-none">
                         <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                         <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                         <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" />
                      </div>
                    )}
                 </div>
              </ScrollArea>
              <div className="p-10 bg-black/80 pb-16 border-t border-white/5">
                 <div className="flex gap-3 bg-slate-900 rounded-[2rem] p-3 border border-white/10 shadow-2xl ring-1 ring-white/5">
                    <Input 
                      placeholder="Ex: Qual o saldo do lote 2289?" 
                      className="bg-transparent border-none focus-visible:ring-0 text-white h-14 text-sm font-medium placeholder:text-slate-700"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAISend()}
                    />
                    <Button className="h-14 w-14 shrink-0 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 shadow-xl" onClick={handleAISend} disabled={isAITyping}>
                       <Send className="h-6 w-6" />
                    </Button>
                 </div>
              </div>
           </SheetContent>
         </Sheet>

         <div className="text-right">
            <p className="text-[11px] font-black text-slate-200 leading-none tracking-tight">{profile?.displayName?.toUpperCase()}</p>
            <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mt-1.5 flex items-center justify-end gap-1.5">
               <div className="h-1 w-1 bg-blue-500 rounded-full" /> RF-NODE: {user?.id.slice(-6).toUpperCase()}
            </p>
         </div>
      </div>
    </div>
  );
}
