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
import { Product } from '@/types';
import { productService } from '@/lib/productService';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Package, Barcode, MapPin, Truck, Layers, Ruler, DollarSign, Image as ImageIcon, RefreshCw } from 'lucide-react';

const productSchema = z.object({
  sku: z.string().min(1, 'Código interno é obrigatório'),
  barcode: z.string().optional(),
  name: z.string().min(1, 'Descrição é obrigatória'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  unitOfMeasure: z.string().min(1, 'Unidade de medida é obrigatória'),
  measurement: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  minimumStock: z.coerce.number().min(0, 'Estoque mínimo deve ser positivo'),
  supplier: z.string().optional(),
  location: z.string().optional(),
  locationArea: z.string().optional(),
  locationCorridor: z.string().optional(),
  locationShelf: z.string().optional(),
  locationPosition: z.string().optional(),
  unitId: z.string().min(1, 'Unidade empresarial é obrigatória'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductDialogProps {
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProductDialog({ product, open, onOpenChange, onSuccess }: ProductDialogProps) {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      sku: '',
      barcode: '',
      name: '',
      description: '',
      category: '',
      subcategory: '',
      unitOfMeasure: 'UN',
      measurement: 0,
      cost: 0,
      minimumStock: 0,
      supplier: '',
      location: '',
      locationArea: '',
      locationCorridor: '',
      locationShelf: '',
      locationPosition: '',
      unitId: profile?.unitIds?.[0] || '',
      status: 'ACTIVE',
    },
  });

  React.useEffect(() => {
    if (product) {
      form.reset({
        sku: product.sku,
        barcode: product.barcode || '',
        name: product.name,
        description: product.description || '',
        category: product.category,
        subcategory: product.subcategory || '',
        unitOfMeasure: product.unitOfMeasure,
        measurement: product.measurement || 0,
        cost: product.cost || 0,
        minimumStock: product.minimumStock,
        supplier: product.supplier || '',
        location: product.location || '',
        locationArea: product.locationArea || '',
        locationCorridor: product.locationCorridor || '',
        locationShelf: product.locationShelf || '',
        locationPosition: product.locationPosition || '',
        unitId: product.unitId,
        status: product.status,
      });
    } else {
      form.reset({
        sku: '',
        barcode: '',
        name: '',
        description: '',
        category: '',
        subcategory: '',
        unitOfMeasure: 'UN',
        measurement: 0,
        cost: 0,
        minimumStock: 0,
        supplier: '',
        location: '',
        locationArea: '',
        locationCorridor: '',
        locationShelf: '',
        locationPosition: '',
        unitId: profile?.unitIds?.[0] || '',
        status: 'ACTIVE',
      });
    }
  }, [product, form, profile]);

  const onSubmit = async (values: ProductFormValues) => {
    if (!profile?.organizationId) return;

    // Concat location for backward compatibility if needed
    const parts = [values.locationArea, values.locationCorridor, values.locationShelf, values.locationPosition].filter(Boolean);
    const joinedLocation = parts.join('-');

    setIsLoading(true);
    try {
      if (product) {
        await productService.update(product.id, {
          ...values,
          location: joinedLocation || values.location,
          description: values.description || '',
        });
        toast.success('Produto atualizado com sucesso!');
      } else {
        await productService.create({
          ...values,
          organizationId: profile.organizationId,
          location: joinedLocation || values.location,
          description: values.description || '',
          currentStock: 0,
        });
        toast.success('Produto criado com sucesso!');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar produto');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[95vw] md:max-w-4xl lg:max-w-5xl max-h-[96vh] overflow-y-auto lg:overflow-visible p-0 border-none shadow-2xl bg-white rounded-2xl">
        <div className="bg-slate-900 px-6 py-5 text-white shrink-0">
          <DialogHeader className="space-y-0.5">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tighter uppercase">
                <Package className="h-5 w-5 text-blue-500" />
                {product ? 'Editar Produto' : 'Novo Ativo'}
              </DialogTitle>
              <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400 font-mono tracking-widest uppercase">
                v1.4 Internal
              </Badge>
            </div>
            <DialogDescription className="text-slate-400 font-medium text-[11px] uppercase tracking-wide">
              {profile?.organizationId} • Parametrização Técnica
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Data */}
            <div className="lg:col-span-8 space-y-6">
              {/* Identificação Básica */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <Layers className="h-3.5 w-3.5 text-blue-500" /> Identificação
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="sku" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Código Interno (SKU) *</Label>
                    <Input id="sku" {...form.register('sku')} placeholder="SKU" className="bg-slate-50 border-slate-200 h-9 font-mono uppercase text-xs" />
                    {form.formState.errors.sku && <p className="text-[9px] font-bold text-destructive uppercase">{form.formState.errors.sku.message}</p>}
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="barcode" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">EAN / Barras</Label>
                    <div className="relative">
                      <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input id="barcode" {...form.register('barcode')} className="pl-8 bg-slate-50 border-slate-200 h-9 font-mono text-xs" placeholder="00000000" />
                    </div>
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Status</Label>
                    <Select onValueChange={(val) => form.setValue('status', val as 'ACTIVE' | 'INACTIVE')} defaultValue={form.getValues('status')}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-9 font-black uppercase text-[9px] tracking-widest">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE" className="font-bold uppercase text-[9px] tracking-widest">Ativo</SelectItem>
                        <SelectItem value="INACTIVE" className="font-bold uppercase text-[9px] tracking-widest">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Descrição Comercial *</Label>
                    <Input id="name" {...form.register('name')} placeholder="Ex: Cabo de Cobre 10mm" className="bg-slate-50 border-slate-200 h-9 font-bold text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="category" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Categoria</Label>
                      <Input id="category" {...form.register('category')} className="bg-slate-50 border-slate-200 h-9 font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="subcategory" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Subcategoria</Label>
                      <Input id="subcategory" {...form.register('subcategory')} className="bg-slate-50 border-slate-200 h-9 font-bold text-xs" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Especificações Técnicas */}
              <section className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <Ruler className="h-3.5 w-3.5 text-blue-500" /> Logística & Custos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Unidade</Label>
                    <Select onValueChange={(val) => form.setValue('unitOfMeasure', val)} defaultValue={form.getValues('unitOfMeasure')}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 h-9 font-black uppercase text-[9px] tracking-widest">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN" className="font-bold text-[9px]">UN</SelectItem>
                        <SelectItem value="M" className="font-bold text-[9px]">METRO</SelectItem>
                        <SelectItem value="KG" className="font-bold text-[9px]">QUILO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Conversão</Label>
                    <Input type="number" {...form.register('measurement')} className="bg-slate-50 border-slate-200 h-9 font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Custo (R$)</Label>
                    <Input type="number" step="0.01" {...form.register('cost')} className="bg-slate-50 border-slate-200 h-9 font-mono text-xs" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Mínimo</Label>
                    <Input type="number" {...form.register('minimumStock')} className="bg-slate-50 border-slate-200 h-9 font-mono text-xs" />
                  </div>
                </div>
              </section>

              {/* Endereçamento */}
              <section className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" /> Endereçamento Físico
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'locationArea', label: 'Área' },
                      { id: 'locationCorridor', label: 'Corredor' },
                      { id: 'locationShelf', label: 'Prateleira' },
                      { id: 'locationPosition', label: 'Posição' }
                    ].map((loc) => (
                      <div key={loc.id} className="space-y-1 min-w-0">
                        <Label className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">{loc.label}</Label>
                        <Input id={loc.id} {...form.register(loc.id as any)} className="bg-slate-50 border-slate-200 h-8 font-black uppercase text-center text-[10px]" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <Label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Fornecedor Principal</Label>
                    <div className="relative">
                      <Truck className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input {...form.register('supplier')} className="pl-8 bg-slate-50 border-slate-200 h-9 text-xs" />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Assets */}
            <div className="lg:col-span-4 space-y-6 lg:border-l lg:pl-8 border-slate-100">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <ImageIcon className="h-3.5 w-3.5 text-blue-500" /> Visual
                </h3>
                <div className="aspect-square sm:aspect-video lg:aspect-square w-full rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden group transition-all hover:bg-white hover:border-blue-200">
                  <ImageIcon className="h-6 w-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Upload Asset</p>
                  <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <Barcode className="h-3.5 w-3.5 text-blue-500" /> Smart Tag
                </h3>
                <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-100 flex flex-col items-center gap-3">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-50">
                    <QRCodeSVG value={form.watch('sku') || 'META'} size={64} level="H" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black font-mono uppercase text-slate-900">{form.watch('sku') || 'PENDING'}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase truncate max-w-[120px]">{form.watch('name') || '-'}</p>
                    <div className="mt-2 text-[8px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full inline-block">
                      Loc: {[form.watch('locationArea'), form.watch('locationCorridor'), form.watch('locationShelf'), form.watch('locationPosition')].filter(Boolean).join('-') || 'N/A'}
                    </div>
                  </div>
                </div>
              </section>

              <div className="pt-4 space-y-3">
                <Button type="submit" disabled={isLoading} className="w-full gap-3 font-black uppercase text-[10px] tracking-widest h-11 shadow-lg shadow-blue-200">
                  {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
                  {product ? 'Salvar Alterações' : 'Registrar Produto'}
                </Button>
                <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="w-full font-bold uppercase text-[10px] tracking-widest h-10">
                  Descartar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
