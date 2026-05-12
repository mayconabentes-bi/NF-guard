import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { productService } from '@/lib/productService';
import { productionService } from '@/lib/productionService';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { Factory, ClipboardList, Target, AlertTriangle, Cpu, RefreshCw, QrCode } from 'lucide-react';
import { Product, Machine } from '@/types';
import { QRCodeSVG } from 'qrcode.react';

const poSchema = z.object({
  poNumber: z.string().min(1, 'Número da OP é obrigatório'),
  productId: z.string().min(1, 'Produto é obrigatório'),
  unitId: z.string().min(1, 'Unidade é obrigatória'),
  targetQuantity: z.string().min(1, 'Obrigatório'),
  expectedLossPercent: z.string().min(1, 'Obrigatório'),
  machineId: z.string().optional(),
});

type POFormValues = z.infer<typeof poSchema>;

interface NewProductionOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  machines: Machine[];
}

export function NewProductionOrderDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  machines
}: NewProductionOrderDialogProps) {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);

  const form = useForm<POFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      poNumber: `OP-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      productId: '',
      unitId: '',
      targetQuantity: '',
      expectedLossPercent: '2', // default 2%
      machineId: '',
    },
  });

  React.useEffect(() => {
    if (open && profile?.organizationId) {
      loadProducts(profile.organizationId);
      form.setValue('unitId', profile.unitIds?.[0] || '');
      form.setValue('poNumber', `OP-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`);
    } else if (!open) {
      form.reset();
    }
  }, [open, profile]);

  const loadProducts = async (organizationId: string) => {
    try {
      const data = await productService.getAll(organizationId);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const onSubmit = async (values: POFormValues) => {
    if (!profile?.organizationId) return;

    setIsLoading(true);
    try {
      await productionService.createOrder({
        organizationId: profile.organizationId,
        unitId: values.unitId,
        poNumber: values.poNumber,
        productId: values.productId,
        productName: products.find(p => p.id === values.productId)?.name || '',
        targetQuantity: Number(values.targetQuantity),
        status: 'DRAFT',
        expectedLossPercent: Number(values.expectedLossPercent),
        machineId: values.machineId || undefined,
      });

      toast.success('Ordem de Produção criada com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao criar Ordem de Produção');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === form.watch('productId'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[95vw] md:max-w-4xl lg:max-w-5xl max-h-[96vh] overflow-y-auto lg:overflow-visible p-0 border-none shadow-2xl bg-white rounded-2xl">
        <div className="bg-slate-900 px-6 py-5 text-white shrink-0">
          <DialogHeader className="space-y-0.5">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tighter uppercase">
                <Factory className="h-5 w-5 text-blue-500" />
                Nova Ordem de Produção
              </DialogTitle>
              <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400 font-mono tracking-widest uppercase">
                MES v1.0
              </Badge>
            </div>
            <DialogDescription className="text-slate-400 font-medium text-[11px] uppercase tracking-wide">
              {profile?.organizationId} • Cadastro de OP
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Data */}
            <div className="lg:col-span-8 space-y-6">
              {/* Identificação da OP */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <ClipboardList className="h-3.5 w-3.5 text-blue-500" /> Identificação
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="poNumber" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Número da OP *</Label>
                    <Input id="poNumber" {...form.register('poNumber')} className="bg-slate-50 border-slate-200 h-9 font-mono uppercase text-xs font-black" />
                    {form.formState.errors.poNumber && <p className="text-[9px] font-bold text-destructive uppercase">{form.formState.errors.poNumber.message}</p>}
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="unitId" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Unidade *</Label>
                    <Select onValueChange={(val) => form.setValue('unitId', val)} defaultValue={form.getValues('unitId')}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-9 font-black uppercase text-[9px] tracking-widest">
                        <SelectValue placeholder="Selecione a Unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {profile?.unitIds?.map(id => (
                          <SelectItem key={id} value={id} className="font-bold uppercase text-[9px] tracking-widest">Unidade {id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="productId" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Produto (SKU) *</Label>
                  <Select onValueChange={(val) => form.setValue('productId', val)} defaultValue={form.getValues('productId')}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 h-9 font-bold text-xs">
                      <SelectValue placeholder="Selecione o produto a ser fabricado" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id} className="font-bold text-xs uppercase">
                          {p.sku} - {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.productId && <p className="text-[9px] font-bold text-destructive uppercase">{form.formState.errors.productId.message}</p>}
                </div>
              </section>

              {/* Metas e Alocação */}
              <section className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <Target className="h-3.5 w-3.5 text-blue-500" /> Metas de Produção
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="targetQuantity" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Quantidade Alvo * ({selectedProduct?.unitOfMeasure || 'UN'})</Label>
                    <Input id="targetQuantity" type="number" step="0.01" {...form.register('targetQuantity')} className="bg-slate-50 border-slate-200 h-9 font-mono text-xs" />
                    {form.formState.errors.targetQuantity && <p className="text-[9px] font-bold text-destructive uppercase">{form.formState.errors.targetQuantity.message}</p>}
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="expectedLossPercent" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">
                      Perda Operacional Estimada (%)
                    </Label>
                    <div className="relative">
                      <AlertTriangle className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />
                      <Input id="expectedLossPercent" type="number" step="0.1" {...form.register('expectedLossPercent')} className="pl-8 bg-amber-50/50 border-amber-200 h-9 font-mono text-xs text-amber-700" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <Cpu className="h-3.5 w-3.5 text-blue-500" /> Alocação (Opcional)
                </h3>
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="machineId" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Máquina / Centro de Trabalho</Label>
                  <Select onValueChange={(val) => form.setValue('machineId', val === 'none' ? '' : val)} defaultValue={form.getValues('machineId')}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 h-9 font-bold text-xs uppercase">
                      <SelectValue placeholder="Sem alocação inicial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="font-bold text-xs uppercase text-slate-400">Sem alocação inicial</SelectItem>
                      {machines.map(m => (
                        <SelectItem key={m.id} value={m.id} className="font-bold text-xs uppercase">
                          {m.name} ({m.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>
            </div>

            {/* Right Column: Assets & Submit */}
            <div className="lg:col-span-4 space-y-6 lg:border-l lg:pl-8 border-slate-100">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <QrCode className="h-3.5 w-3.5 text-blue-500" /> QR Code da OP
                </h3>
                <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-100 flex flex-col items-center gap-3">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-50">
                    <QRCodeSVG value={`OP:${form.watch('poNumber')}`} size={100} level="H" />
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] font-black font-mono uppercase text-slate-900">{form.watch('poNumber') || '-'}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[120px]">{selectedProduct?.sku || 'Selecione Produto'}</p>
                  </div>
                </div>
              </section>

              <div className="pt-4 space-y-3">
                <Button type="submit" disabled={isLoading} className="w-full gap-3 font-black uppercase text-[10px] tracking-widest h-11 shadow-lg shadow-blue-200 bg-blue-600 hover:bg-blue-700">
                  {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Factory className="h-3.5 w-3.5" />}
                  Lançar OP
                </Button>
                <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="w-full font-bold uppercase text-[10px] tracking-widest h-10 text-slate-500">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
