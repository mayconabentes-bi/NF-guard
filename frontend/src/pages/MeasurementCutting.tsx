import * as React from 'react';
import { 
  Scissors, 
  Plus, 
  History, 
  Scale, 
  Box, 
  Search, 
  QrCode, 
  AlertTriangle,
  Download,
  Trash2,
  Package,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { Product, MaterialBatch, CuttingLog } from '@/types';
import { productService } from '@/lib/productService';
import { batchService } from '@/lib/batchService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

export default function MeasurementCutting() {
  const { profile, user } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [batches, setBatches] = React.useState<MaterialBatch[]>([]);
  const [cuttings, setCuttings] = React.useState<CuttingLog[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCutDialogOpen, setIsCutDialogOpen] = React.useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = React.useState(false);
  const [selectedBatch, setSelectedBatch] = React.useState<MaterialBatch | null>(null);

  const [cutData, setCutData] = React.useState({
    measurementTaken: 0,
    wasteQuantity: 0,
    reason: ''
  });

  const [newBatchData, setNewBatchData] = React.useState({
    batchNumber: '',
    initialMeasurement: 0,
    location: ''
  });

  const fetchData = React.useCallback(async () => {
    if (!profile?.organizationId) return;
    setIsLoading(true);
    try {
      const [prodData, cutsData] = await Promise.all([
        productService.getAll(profile.organizationId),
        batchService.getCuttings(profile.organizationId)
      ]);
      setProducts(prodData.filter(p => ['m', 'M', ' متر', 'MT', 'Metro'].includes(p.unitOfMeasure) || p.category.toLowerCase().includes('cabo') || p.category.toLowerCase().includes('tubo')));
      setCuttings(cutsData);
    } catch (e) {
      toast.error('Erro ao carrerar dados');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.organizationId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadBatches = async (productId: string) => {
    if (!profile?.organizationId || !productId) return;
    try {
      const data = await batchService.getByProduct(profile.organizationId, productId);
      setBatches(data);
    } catch (e) {
      toast.error('Erro ao carregar lotes');
    }
  };

  const handleCreateBatch = async () => {
    if (!profile?.organizationId || !selectedProduct) return;
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    try {
      await batchService.createBatch({
        productId: selectedProduct,
        organizationId: profile.organizationId,
        warehouseId: 'DEFAULT', // Simplification
        batchNumber: newBatchData.batchNumber,
        initialMeasurement: newBatchData.initialMeasurement,
        currentMeasurement: newBatchData.initialMeasurement,
        unitOfMeasure: product.unitOfMeasure,
        location: newBatchData.location,
        status: 'AVAILABLE'
      });
      toast.success('Lote criado com sucesso!');
      setIsBatchDialogOpen(false);
      loadBatches(selectedProduct);
    } catch (e) {
      toast.error('Erro ao criar lote');
    }
  };

  const handlePerformCut = async () => {
    if (!profile?.organizationId || !selectedBatch || !user) return;
    
    try {
      await batchService.performCut({
        batchId: selectedBatch.id,
        productId: selectedBatch.productId,
        organizationId: profile.organizationId,
        measurementTaken: cutData.measurementTaken,
        wasteQuantity: cutData.wasteQuantity,
        reason: cutData.reason,
        operatorId: user.id,
        userId: user.id
      });
      toast.success('Corte realizado com sucesso!');
      setIsCutDialogOpen(false);
      loadBatches(selectedBatch.productId);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao realizar corte');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-black tracking-tighter text-slate-900 uppercase">
            Metragem e Corte
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Gestão técnica de materiais por comprimento e rastreio de perdas.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="gap-2 shadow-sm font-bold uppercase text-[10px] tracking-widest text-slate-600 h-10 border-slate-200 hover:bg-white hover:text-slate-900">
             <Download className="h-4 w-4" /> Relatório de Perdas
           </Button>
           <Button className="gap-2 shadow-md bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest" onClick={() => setIsBatchDialogOpen(true)}>
             <Plus className="h-4 w-4" /> Novo Rolo/Lote
           </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Lotes Ativos */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm h-full bg-white ring-1 ring-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-600" /> Lotes Disponíveis para Corte
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500 mt-1">Selecione um lote ativo para iniciar a retirada de material.</CardDescription>
                </div>
                <Select value={selectedProduct} onValueChange={(val) => { setSelectedProduct(val); loadBatches(val); }}>
                  <SelectTrigger className="w-[250px] bg-white border-slate-200 text-xs font-bold text-slate-700 h-9">
                    <SelectValue placeholder="Filtrar por Produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs font-bold">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader>
                   <TableRow className="hover:bg-transparent bg-slate-50 border-b border-slate-100">
                     <TableHead className="pl-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Lote/Rolo</TableHead>
                     <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Produto</TableHead>
                     <TableHead className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Metragem Atual</TableHead>
                     <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Localização</TableHead>
                     <TableHead className="text-right pr-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Ações</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                           <TableCell colSpan={5}><div className="h-12 bg-slate-100 animate-pulse rounded m-2" /></TableCell>
                        </TableRow>
                      ))
                   ) : batches.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center text-xs font-medium text-slate-500">
                          {selectedProduct ? 'Nenhum lote ativo encontrado para este produto.' : 'Selecione um produto para visualizar os lotes disponíveis.'}
                        </TableCell>
                     </TableRow>
                   ) : (
                     batches.map(batch => {
                       const product = products.find(p => p.id === batch.productId);
                       const occupancy = (batch.currentMeasurement / batch.initialMeasurement) * 100;
                       
                       return (
                         <TableRow key={batch.id} className="group hover:bg-blue-50/50 transition-colors cursor-pointer border-b border-slate-100">
                           <TableCell className="pl-6 font-mono font-bold text-xs text-slate-700 group-hover:text-blue-700">{batch.batchNumber}</TableCell>
                           <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900 uppercase">{product?.name}</span>
                                <span className="text-[10px] text-slate-500 font-medium">Capacidade Original: {batch.initialMeasurement}{batch.unitOfMeasure}</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-bold text-xs text-slate-900">{batch.currentMeasurement.toFixed(2)}{batch.unitOfMeasure}</span>
                                <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                                   <div 
                                    className={`h-full transition-all ${occupancy < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${occupancy}%` }} 
                                   />
                                </div>
                              </div>
                           </TableCell>
                           <TableCell className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{batch.location || 'N/A'}</TableCell>
                           <TableCell className="text-right pr-6">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 gap-2 bg-white border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors"
                                onClick={() => { setSelectedBatch(batch); setIsCutDialogOpen(true); }}
                              >
                                <Scissors className="h-3.5 w-3.5" /> Efetuar Corte
                              </Button>
                           </TableCell>
                         </TableRow>
                       );
                     })
                   )}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Resíduos e Sobras */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-slate-900 border-t-4 border-t-blue-600">
            <CardHeader className="bg-slate-900/50 pb-2">
               <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-100 flex items-center gap-2">
                 <Scale className="h-4 w-4 text-blue-400" /> Panorama de Perdas
               </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
               <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Desperdício Acumulado (Mês)</p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-4xl font-heading font-black text-white">42.5<span className="text-xl text-slate-500 ml-1">m</span></h3>
                    <Badge variant="secondary" className="bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-1 px-1.5 py-0 rounded text-[10px]">
                       +2.4% vs Mês Ant.
                    </Badge>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center backdrop-blur-sm">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 shadow-sm">Pontas de Rolo</p>
                    <p className="text-xl font-black text-rose-400 tracking-tight">12 <span className="text-[10px] text-slate-500 uppercase">UN</span></p>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center backdrop-blur-sm">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 shadow-sm">Reaproveitadas</p>
                    <p className="text-xl font-black text-emerald-400 tracking-tight">85<span className="text-[10px] text-slate-500">%</span></p>
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-700">
                <History className="h-3.5 w-3.5 text-blue-600" /> Logs de Corte Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                 {cuttings.length === 0 ? (
                    <div className="p-6 text-center text-xs font-medium text-slate-500">Nenhum log de corte recente.</div>
                 ) : (
                   cuttings.slice(0, 5).map(cut => {
                     const product = products.find(p => p.id === cut.productId);
                     return (
                       <div key={cut.id} className="p-4 flex items-start justify-between hover:bg-slate-50 transition-colors group">
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-900 uppercase truncate max-w-[150px] group-hover:text-blue-700 transition-colors">{product?.name || 'MATERIAL DESCONHECIDO'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{new Date(cut.createdAt).toLocaleDateString()} {new Date(cut.createdAt).toLocaleTimeString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-mono font-black text-slate-900 bg-slate-100 px-1.5 rounded inline-block shadow-sm mb-1">-{cut.measurementTaken}m</p>
                            {cut.wasteQuantity > 0 && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Perda: {cut.wasteQuantity}m</p>}
                          </div>
                       </div>
                     );
                   })
                 )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Corte Dialog */}
      <Dialog open={isCutDialogOpen} onOpenChange={setIsCutDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Scissors className="h-5 w-5" /> Registrar Retirada/Corte
             </DialogTitle>
             <DialogDescription>
               Lote selecionado: <strong>{selectedBatch?.batchNumber}</strong> (Saldo: {selectedBatch?.currentMeasurement}{selectedBatch?.unitOfMeasure})
             </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="cut-length">Comprimento Útil (A)</Label>
                 <Input 
                  id="cut-length" 
                  type="number" 
                  step="0.01" 
                  value={cutData.measurementTaken}
                  onChange={(e) => setCutData({...cutData, measurementTaken: parseFloat(e.target.value) || 0})}
                 />
                 <p className="text-[10px] text-muted-foreground">Metragem a ser utilizada.</p>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="cut-waste">Desperdício/Rebarba (B)</Label>
                 <Input 
                  id="cut-waste" 
                  type="number" 
                  step="0.01" 
                  value={cutData.wasteQuantity}
                  onChange={(e) => setCutData({...cutData, wasteQuantity: parseFloat(e.target.value) || 0})}
                 />
                 <p className="text-[10px] text-muted-foreground">Ponta eliminada ou descarte.</p>
               </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="cut-reason">Motivo/Ordem de Serviço</Label>
                <Input 
                  id="cut-reason" 
                  placeholder="Ex: OS-2024-001" 
                  value={cutData.reason}
                  onChange={(e) => setCutData({...cutData, reason: e.target.value})}
                />
             </div>
             <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between border">
                <span className="text-xs font-bold text-muted-foreground uppercase">Total Saída do Lote</span>
                <span className="text-xl font-black text-red-600">{(cutData.measurementTaken + cutData.wasteQuantity).toFixed(2)}m</span>
             </div>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsCutDialogOpen(false)}>Cancelar</Button>
             <Button onClick={handlePerformCut} className="gap-2">Confirmar Baixa do Corte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Novo Lote Dialog */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent className="max-w-md">
           <DialogHeader>
              <DialogTitle>Registrar Novo Rolo ou Lote</DialogTitle>
              <DialogDescription>Cadastre a metragem inicial de um novo volume de material.</DialogDescription>
           </DialogHeader>
           <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Produto Base</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto de metragem" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="batch-number">Identificação/Rolo #</Label>
                    <Input 
                      id="batch-number" 
                      placeholder="Ex: ROLO-402" 
                      value={newBatchData.batchNumber}
                      onChange={(e) => setNewBatchData({...newBatchData, batchNumber: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="batch-measure">Metragem Total (m)</Label>
                    <Input 
                      id="batch-measure" 
                      type="number" 
                      placeholder="100.00" 
                      value={newBatchData.initialMeasurement}
                      onChange={(e) => setNewBatchData({...newBatchData, initialMeasurement: parseFloat(e.target.value) || 0})}
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <Label htmlFor="batch-loc">Localização Física</Label>
                 <Input 
                  id="batch-loc" 
                  placeholder="Ex: Rua 3, Prateleira 2" 
                  value={newBatchData.location}
                  onChange={(e) => setNewBatchData({...newBatchData, location: e.target.value})}
                 />
              </div>
           </div>
           <DialogFooter>
              <Button variant="outline" onClick={() => setIsBatchDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateBatch}>Cadastrar Lote</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
