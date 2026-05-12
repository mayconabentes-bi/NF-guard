import * as React from 'react';
import { 
  Search, 
  Map as MapIcon, 
  Plus, 
  QrCode, 
  ChevronRight, 
  Box, 
  Layers, 
  ArrowRightLeft,
  Warehouse,
  History,
  MoreVertical,
  Filter,
  Printer,
  Edit2,
  Trash2,
  ShieldCheck,
  Zap,
  Thermometer,
  AlertTriangle,
  Move
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { Location, ZoneCategory } from '@/types';
import { LOCATION_TYPE_LABELS, ZONE_CATEGORY_LABELS } from '@/constants/location';
import { locationService } from '@/lib/locationService';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LocationDialog } from '@/components/inventory/LocationDialog';
import { cn } from '@/lib/utils';

const ZONE_COLORS: Record<ZoneCategory, string> = {
  RECEIVING: 'bg-blue-500',
  QUARANTINE: 'bg-orange-500',
  PICKING_A: 'bg-emerald-600',
  PICKING_B: 'bg-emerald-400',
  PICKING_C: 'bg-emerald-200',
  BULK: 'bg-purple-500',
  EXPEDITION: 'bg-amber-500',
  RETURN: 'bg-rose-400',
  FLAMMABLE: 'bg-red-600',
  COLD_STORAGE: 'bg-cyan-500'
};

export default function WarehouseMap() {
  const { profile } = useAuth();
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);
  const [isQRDialogOpen, setIsQRDialogOpen] = React.useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = React.useState(false);
  const [editingLocation, setEditingLocation] = React.useState<Location | null>(null);
  const [filterMode, setFilterMode] = React.useState<'all' | 'empty' | 'quarantine' | 'flammable'>('all');

  const fetchLocations = async () => {
    if (!profile?.organizationId) return;
    setIsLoading(true);
    try {
      const data = await locationService.getAll(profile.organizationId);
      setLocations(data);
    } catch (e) {
      toast.error('Erro ao carregar endereçamentos');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLocations();
  }, [profile?.organizationId]);

  const filteredLocations = locations.filter(l => {
    const matchesSearch = l.fullAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         l.label.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterMode === 'empty') matchesFilter = !l.occupiedById;
    if (filterMode === 'quarantine') matchesFilter = l.zoneCategory === 'QUARANTINE';
    if (filterMode === 'flammable') matchesFilter = l.zoneCategory === 'FLAMMABLE';
    
    return matchesSearch && matchesFilter;
  });

  const rootLocations = locations.filter(l => {
    if (l.parentId && l.parentId !== 'none' && l.type !== 'STREET' && l.type !== 'ZONE') return false;
    
    if (filterMode !== 'all') {
      const children = locations.filter(child => child.parentId === l.id);
      const matchesType = l.zoneCategory === (filterMode === 'quarantine' ? 'QUARANTINE' : 
                          filterMode === 'flammable' ? 'FLAMMABLE' : '');
      const hasMatchingChildren = children.some(c => {
         if (filterMode === 'empty') return !c.occupiedById;
         if (filterMode === 'quarantine') return c.zoneCategory === 'QUARANTINE';
         if (filterMode === 'flammable') return c.zoneCategory === 'FLAMMABLE';
         return true;
      });
      return matchesType || hasMatchingChildren;
    }
    
    return true;
  });

  const handlePrintAll = () => {
    if (locations.length === 0) {
      toast.error('Nenhum endereço para imprimir');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = locations.map(loc => {
      return `
        <div class="label-card">
          <div class="qr-placeholder" data-address="${loc.fullAddress}"></div>
          <div class="address">${loc.fullAddress}</div>
          <div class="type">${LOCATION_TYPE_LABELS[loc.type] || loc.type} - ${ZONE_CATEGORY_LABELS[loc.zoneCategory as ZoneCategory] || 'GERAL'}</div>
        </div>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <title>WMS Intelligence - Labels</title>
          <style>
             body { font-family: sans-serif; margin: 20px; }
             .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
             .label-card { border: 2px solid #000; padding: 20px; text-align: center; page-break-inside: avoid; }
             .address { font-weight: bold; font-size: 20px; margin-top: 10px; font-family: monospace; }
             .type { font-size: 10px; color: #666; text-transform: uppercase; margin-top: 4px; border-top: 1px solid #eee; padding-top: 4px; }
             svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="grid">${cardsHtml}</div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
          <script>
            document.querySelectorAll('.qr-placeholder').forEach(div => {
              const canvas = document.createElement('canvas');
              QRCode.toCanvas(canvas, div.dataset.address, { width: 150, margin: 2 }, function (error) {
                div.appendChild(canvas);
              })
            });
            setTimeout(() => window.print(), 1000);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Este processo é irreversível e excluirá todo o rastro logístico deste nó. Confirmar?')) return;
    try {
      await locationService.delete(id);
      toast.success('Nó logístico removido com sucesso');
      fetchLocations();
    } catch (e) {
      toast.error('Erro na remoção: Verifique dependências');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-black tracking-tighter text-slate-900 uppercase">
            Smart Warehouse Map
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
            <Zap className="h-3 w-3 text-blue-600" /> Otimização por IA e Visibilidade de Estoque (META DOCS V2.4)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 shadow-sm font-bold uppercase text-[10px] tracking-widest text-slate-600 h-10 border-slate-200 hover:bg-white hover:text-slate-900" onClick={handlePrintAll}>
            <Printer className="h-4 w-4" /> Etiquetas Industriais
          </Button>
          <Button className="gap-2 shadow-md bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest border-none" onClick={() => { setEditingLocation(null); setIsLocationDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Expandir Layout
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Advanced Filter Panel */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-none shadow-sm h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter">
                <Search className="h-4 w-4 text-primary" /> Pesquisa de Nó
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="ID ou Coordenada..." 
                  className="pl-9 h-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Operacional</p>
                <div className="grid gap-1">
                  <Button 
                    variant={filterMode === 'all' ? 'secondary' : 'ghost'} 
                    className="justify-start text-xs h-8 px-2"
                    onClick={() => setFilterMode('all')}
                  >
                    <Layers className="h-3 w-3 mr-2" /> Toda a Estrutura
                  </Button>
                  <Button 
                    variant={filterMode === 'empty' ? 'secondary' : 'ghost'} 
                    className="justify-start text-xs h-8 px-2"
                    onClick={() => setFilterMode('empty')}
                  >
                    <Box className="h-3 w-3 mr-2" /> Capacidade Disponível
                  </Button>
                  <Button 
                    variant={filterMode === 'quarantine' ? 'secondary' : 'ghost'} 
                    className="justify-start text-xs h-8 px-2"
                    onClick={() => setFilterMode('quarantine')}
                  >
                    <AlertTriangle className="h-3 w-3 mr-2 text-orange-500" /> Quarentena / Bloqueio
                  </Button>
                  <Button 
                    variant={filterMode === 'flammable' ? 'secondary' : 'ghost'} 
                    className="justify-start text-xs h-8 px-2"
                    onClick={() => setFilterMode('flammable')}
                  >
                    <Thermometer className="h-3 w-3 mr-2 text-red-500" /> Risco de Incêndio
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Card */}
          <Card className="border-none bg-slate-900 text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <Zap className="h-20 w-20" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-3 w-3 text-amber-400" /> AI Meta Advice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-2 rounded bg-white/10 text-[10px] leading-relaxed">
                "Detectado congestionamento na <strong>RUA-A</strong>. Sugerimos realocar itens de alto giro para a <strong>ZONA-02</strong> próximo à expedição para reduzir 15% do tempo de picking."
              </div>
              <Button size="sm" className="w-full h-7 text-[10px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold uppercase transition-all">
                Aplicar Reorganização
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Visual Map Grid */}
        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between bg-card p-3 rounded-lg border shadow-sm">
             <div className="flex gap-4">
               <div className="flex items-center gap-1.5">
                 <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-bold text-muted-foreground uppercase">Utilizado</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                 <span className="text-[10px] font-bold text-muted-foreground uppercase">Ocioso</span>
               </div>
               <div className="flex items-center gap-1.5 border-l pl-4">
                 <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-muted-foreground uppercase">Crítico</span>
               </div>
             </div>
             <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] uppercase font-bold border-slate-300">Layout ERP V2.0</Badge>
             </div>
          </div>

          <div className="grid gap-6">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center bg-white rounded-xl border-2 border-dashed">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
                  <p className="text-xs font-mono text-muted-foreground">Mapeando Grid Logístico...</p>
                </div>
              </div>
            ) : rootLocations.length === 0 ? (
               <div className="h-96 flex flex-col items-center justify-center bg-white rounded-xl border shadow-sm p-8 text-center space-y-6">
                 <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center shadow-inner">
                    <Warehouse className="h-12 w-12 text-slate-300" />
                 </div>
                 <div className="max-w-xs space-y-2">
                   <h3 className="text-xl font-black uppercase tracking-tight">Depósito Vazio</h3>
                   <p className="text-sm text-muted-foreground">O sistema exige a definição de corredores (Streets) ou áreas (Zones) para iniciar a operação.</p>
                 </div>
                 <Button onClick={() => { setEditingLocation(null); setIsLocationDialogOpen(true); }} className="px-8 bg-slate-900 hover:bg-slate-800 transition-all font-bold uppercase text-xs h-10 shadow-lg">
                   Criar Estrutura Mestral
                 </Button>
               </div>
            ) : (
              rootLocations.map(root => {
                const children = locations.filter(l => l.parentId === root.id);
                const zoneColor = root.zoneCategory ? ZONE_COLORS[root.zoneCategory] : 'bg-slate-900';
                const zoneLabel = root.zoneCategory ? ZONE_CATEGORY_LABELS[root.zoneCategory] : 'Indefinido';

                return (
                  <Card key={root.id} className="border-none shadow-md overflow-hidden ring-1 ring-slate-200">
                    <div className={cn("px-4 py-3 flex items-center justify-between transition-colors", zoneColor)}>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 leading-none">
                            {LOCATION_TYPE_LABELS[root.type] || root.type} {root.zoneCategory && `| ${ZONE_CATEGORY_LABELS[root.zoneCategory]}`}
                          </span>
                          <span className="text-lg font-black text-white flex items-center gap-2 mt-1">
                             <Warehouse className="h-4 w-4 opacity-50" /> {root.label}
                          </span>
                       </div>
                       <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div 
                                role="button" 
                                className="h-8 w-8 flex items-center justify-center text-white/70 hover:bg-white/10 rounded-full cursor-pointer transition-colors"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem className="text-xs font-bold" onClick={() => { setEditingLocation(root); setIsLocationDialogOpen(true); }}>
                                <Edit2 className="h-3.5 w-3.5 mr-2" /> Editar {LOCATION_TYPE_LABELS[root.type] || root.type}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-xs font-bold" onClick={() => { 
                                setSelectedLocation(root);
                                setIsQRDialogOpen(true);
                              }}>
                                <QrCode className="h-3.5 w-3.5 mr-2" /> Imprimir Master QR
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs font-bold text-destructive" onClick={() => handleDelete(root.id)}>
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Desativar Nó
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                       </div>
                    </div>
                    <CardContent className="p-6 bg-white">
                       <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-4">
                          {children.map(pos => (
                            <div 
                              key={pos.id}
                              className={cn(
                                "group/item aspect-square rounded-xl border-2 flex flex-col items-center justify-between p-3 cursor-pointer transition-all relative overflow-hidden",
                                pos.occupiedById 
                                  ? "bg-emerald-50/30 border-emerald-100 hover:border-emerald-300" 
                                  : "bg-slate-50/50 border-slate-100 hover:border-primary/40 shadow-sm",
                                pos.isLocked && "grayscale opacity-50 cursor-not-allowed border-rose-200 bg-rose-50"
                              )}
                              onClick={() => {
                                if (pos.isLocked) {
                                  toast.error('Localização bloqueada para inventário');
                                  return;
                                }
                                setSelectedLocation(pos);
                                toast.info(`${pos.fullAddress} selecionado para inspeção.`);
                              }}
                            >
                              <div className="w-full flex justify-between items-start">
                                <span className="text-[9px] font-black font-mono text-slate-400 group-hover/item:text-primary transition-colors">
                                  {pos.label}
                                </span>
                                {pos.isLocked && <ShieldCheck className="h-2.5 w-2.5 text-rose-500" />}
                              </div>
                              
                              <div className="flex-1 flex items-center justify-center py-2">
                                 {pos.occupiedById ? (
                                   <div className="relative">
                                      <Box className="h-8 w-8 text-emerald-600 drop-shadow-sm" />
                                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-white rounded-full flex items-center justify-center border text-[7px] font-bold">1</div>
                                   </div>
                                 ) : (
                                   <div className="h-2 w-2 rounded-full bg-slate-200 group-hover/item:scale-150 transition-transform" />
                                 )}
                              </div>

                              <div className="w-full flex justify-center opacity-0 group-hover/item:opacity-100 transition-all transform translate-y-1 group-hover/item:translate-y-0">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <div 
                                      role="button" 
                                      className="h-6 w-6 flex items-center justify-center bg-white shadow-md border hover:bg-slate-50 rounded cursor-pointer transition-all mt-1"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </div>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="text-xs font-bold">
                                     <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); setSelectedLocation(pos); setIsQRDialogOpen(true); }}>
                                       <QrCode className="h-3.5 w-3.5" /> Etiqueta QR
                                     </DropdownMenuItem>
                                     <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); setEditingLocation(pos); setIsLocationDialogOpen(true); }}>
                                       <Edit2 className="h-3.5 w-3.5" /> Ajustar Nó
                                     </DropdownMenuItem>
                                     <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); toast.success('Transferência iniciada'); }}>
                                       <Move className="h-3.5 w-3.5" /> Mover Item
                                     </DropdownMenuItem>
                                     <DropdownMenuSeparator />
                                     <DropdownMenuItem className="gap-2 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(pos.id); }}>
                                       <Trash2 className="h-3.5 w-3.5" /> Excluir
                                     </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Progress bar for utilization (mock) */}
                              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-100">
                                <div 
                                  className={cn("h-full transition-all", pos.occupiedById ? 'bg-emerald-500' : 'bg-slate-300')} 
                                  style={{ width: pos.occupiedById ? '80%' : '10%' }}
                                />
                              </div>
                            </div>
                          ))}
                          {/* Quick Add Node */}
                          <Button 
                            variant="ghost" 
                            className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-primary/50 group/add transition-all"
                            onClick={() => {
                              setEditingLocation({
                                id: '',
                                organizationId: profile?.organizationId || '',
                                unitId: '',
                                warehouseId: '',
                                label: '',
                                type: 'BIN',
                                parentId: root.id,
                                fullAddress: '',
                                createdAt: 0
                              });
                              setIsLocationDialogOpen(true);
                            }}
                          >
                             <Plus className="h-6 w-6 text-slate-300 group-hover/add:text-primary group-hover/add:rotate-90 transition-all duration-300" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover/add:text-primary">Expandir</span>
                          </Button>
                       </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* QR Code Inspection Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="sm:max-w-xs border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 px-4 py-8 flex flex-col items-center text-center">
             <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-slate-800">
                {selectedLocation && (
                  <QRCodeSVG 
                    value={selectedLocation.fullAddress} 
                    size={160} 
                    level="H" 
                    includeMargin 
                    imageSettings={{
                      src: "https://cdn-icons-png.flaticon.com/512/2832/2832159.png",
                      x: undefined, y: undefined, height: 24, width: 24, excavate: true,
                    }}
                  />
                )}
             </div>
             <div className="mt-6 space-y-1">
                <Badge variant="secondary" className="bg-white/10 text-white/70 border-none uppercase text-[8px] font-black tracking-widest px-3">
                  ERP Identifier
                </Badge>
                <h2 className="text-2xl font-black text-white font-mono tracking-tighter mt-2">{selectedLocation?.fullAddress}</h2>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-[0.2em]">{LOCATION_TYPE_LABELS[selectedLocation?.type as any] || selectedLocation?.type} | {selectedLocation?.zoneCategory ? ZONE_CATEGORY_LABELS[selectedLocation.zoneCategory] : 'ZONA GERAL'}</p>
             </div>
          </div>
          <div className="p-6 bg-white space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border text-center">
                   <p className="text-[8px] font-black text-muted-foreground uppercase">Capacidade</p>
                   <p className="text-xs font-bold">1.500 kg / 2m³</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border text-center">
                   <p className="text-[8px] font-black text-muted-foreground uppercase">Último Check</p>
                   <p className="text-xs font-bold">{new Date().toLocaleDateString()}</p>
                </div>
             </div>
             <Button className="w-full gap-2 font-bold uppercase text-[10px] h-10 shadow-lg bg-slate-900" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Confirmar Impressão
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <LocationDialog 
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
        onSuccess={fetchLocations}
        location={editingLocation}
      />
    </div>
  );
}
