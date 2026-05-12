import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
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
import { Product, MovementType } from '@/types';
import { movementService } from '@/lib/movementService';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { ArrowUpDown, ArrowDownLeft, ArrowUpRight, RefreshCcw, FileText, User } from 'lucide-react';

const movementSchema = z.object({
  productId: z.string().min(1, 'Produto é obrigatório'),
  type: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']),
  quantity: z.coerce.number().min(0.001, 'Quantidade deve ser maior que zero'),
  reason: z.string().min(1, 'Motivo é obrigatório'),
  unitId: z.string().min(1, 'Unidade é obrigatória'),
  warehouseId: z.string().min(1, 'Almoxarifado é obrigatório'),
  documentNumber: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

interface MovementDialogProps {
  products: Product[];
  selectedProduct?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MovementDialog({ products, selectedProduct, open, onOpenChange, onSuccess }: MovementDialogProps) {
  const { profile, user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema) as any,
    defaultValues: {
      productId: selectedProduct?.id || '',
      type: 'IN',
      quantity: 0,
      reason: '',
      unitId: profile?.unitIds?.[0] || '',
      warehouseId: 'MAIN',
      documentNumber: '',
    },
  });

  React.useEffect(() => {
    if (selectedProduct) {
      form.setValue('productId', selectedProduct.id);
    }
  }, [selectedProduct, form]);

  const onSubmit = async (values: MovementFormValues) => {
    if (!profile?.organizationId || !user) return;

    setIsLoading(true);
    try {
      await movementService.performMovement({
        ...values,
        organizationId: profile.organizationId,
        userId: user.id,
        userName: profile.displayName,
      });
      toast.success('Movimentação realizada com sucesso!');
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error('Erro ao realizar movimentação');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const typeIcons = {
    IN: <ArrowDownLeft className="h-5 w-5 text-emerald-500" />,
    OUT: <ArrowUpRight className="h-5 w-5 text-red-500" />,
    TRANSFER: <ArrowUpDown className="h-5 w-5 text-blue-500" />,
    ADJUSTMENT: <RefreshCcw className="h-5 w-5 text-amber-500" />,
  };

  const typeLabels = {
    IN: 'Entrada de Mercadoria',
    OUT: 'Saída de Mercadoria',
    TRANSFER: 'Transferência entre Unidades',
    ADJUSTMENT: 'Ajuste de Saldo/Inventário',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {typeIcons[form.watch('type')] || <ArrowUpDown className="h-5 w-5" />}
            {typeLabels[form.watch('type')]}
          </DialogTitle>
          <DialogDescription>
            Toda movimentação gera um log de auditoria permanente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Tipo de Movimentação</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'] as MovementType[]).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={form.watch('type') === t ? 'default' : 'outline'}
                    className="flex flex-col h-16 gap-1 px-1"
                    onClick={() => form.setValue('type', t)}
                  >
                    {t === 'IN' && <ArrowDownLeft className="h-4 w-4" />}
                    {t === 'OUT' && <ArrowUpRight className="h-4 w-4" />}
                    {t === 'TRANSFER' && <ArrowUpDown className="h-4 w-4" />}
                    {t === 'ADJUSTMENT' && <RefreshCcw className="h-4 w-4" />}
                    <span className="text-[10px] uppercase font-bold">{t}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Produto</Label>
              <Select 
                onValueChange={(val) => form.setValue('productId', val)} 
                value={form.watch('productId')}
                disabled={!!selectedProduct}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>[{p.sku}] {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" type="number" step="0.001" {...form.register('quantity')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitId">Unidade</Label>
              <Select 
                onValueChange={(val) => form.setValue('unitId', val)} 
                value={form.watch('unitId')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {profile?.unitIds.map(id => (
                    <SelectItem key={id} value={id}>Unidade {id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">Documento / NF</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="documentNumber" {...form.register('documentNumber')} className="pl-9" placeholder="Ex: NF 1234" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Operador</Label>
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/30 text-muted-foreground text-sm">
                <User className="h-4 w-4" />
                {profile?.displayName}
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="reason">Motivo / Observação</Label>
              <Input id="reason" {...form.register('reason')} placeholder="Descreva o motivo desta movimentação" />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? 'Relizando...' : 'Confirmar Lançamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
