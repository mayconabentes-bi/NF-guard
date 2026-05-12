import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Location, LocationType, ZoneCategory } from '@/types';
import { LOCATION_TYPE_LABELS, ZONE_CATEGORY_LABELS } from '@/constants/location';
import { locationService } from '@/lib/locationService';
import { unitService } from '@/lib/unitService';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { Loader2, Warehouse, Target, Weight, Box } from 'lucide-react';

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  location?: Location | null;
}

const LOCATION_TYPES = Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => ({
  value: value as LocationType,
  label: label
}));

const ZONE_CATEGORIES = Object.entries(ZONE_CATEGORY_LABELS).map(([value, label]) => ({
  value: value as ZoneCategory,
  label: label
}));

export function LocationDialog({ open, onOpenChange, onSuccess, location }: LocationDialogProps) {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [units, setUnits] = React.useState<{ id: string; name: string }[]>([]);
  const [parentLocations, setParentLocations] = React.useState<Location[]>([]);
  
  const [formData, setFormData] = React.useState({
    label: '',
    type: 'STREET' as LocationType,
    unitId: '',
    parentId: '',
    zoneCategory: '' as ZoneCategory | '',
    maxWeight: '',
    maxVolume: '',
  });

  React.useEffect(() => {
    if (open) {
      fetchData();
      if (location) {
        setFormData({
          label: location.label || '',
          type: location.type || 'STREET',
          unitId: location.unitId || '',
          parentId: location.parentId || '',
          zoneCategory: location.zoneCategory || '',
          maxWeight: location.maxWeight?.toString() || '',
          maxVolume: location.maxVolume?.toString() || '',
        });
      } else {
        setFormData({
          label: '',
          type: 'STREET',
          unitId: '',
          parentId: '',
          zoneCategory: '',
          maxWeight: '',
          maxVolume: '',
        });
      }
    }
  }, [open, location]);

  const fetchData = async () => {
    if (!profile?.organizationId) return;
    try {
      const [unitsData, locationsData] = await Promise.all([
        unitService.getAll(profile.organizationId),
        locationService.getAll(profile.organizationId)
      ]);
      setUnits(unitsData);
      setParentLocations(locationsData);
      
      if (!location && unitsData.length > 0 && !formData.unitId) {
        setFormData(prev => ({ ...prev, unitId: unitsData[0].id }));
      }
    } catch (error) {
      console.error('Error fetching data for dialog:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organizationId) return;
    if (!formData.label || !formData.unitId) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate full address
      let fullAddress = formData.label;
      if (formData.parentId && formData.parentId !== 'none') {
        const parent = parentLocations.find(p => p.id === formData.parentId);
        if (parent) {
          fullAddress = `${parent.fullAddress}-${formData.label}`;
        }
      }

      const payload: any = {
        organizationId: profile.organizationId,
        unitId: formData.unitId,
        warehouseId: '', 
        label: formData.label,
        type: formData.type,
        parentId: formData.parentId === 'none' ? undefined : formData.parentId,
        fullAddress: fullAddress,
        zoneCategory: formData.zoneCategory || undefined,
        maxWeight: formData.maxWeight ? parseFloat(formData.maxWeight) : undefined,
        maxVolume: formData.maxVolume ? parseFloat(formData.maxVolume) : undefined,
      };

      if (location?.id) {
        await locationService.update(location.id, payload);
        toast.success('Nó logístico atualizado');
      } else {
        await locationService.create(payload);
        toast.success('Novo nó logístico mapeado');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Falha na integração WMS');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-primary" />
            {location?.id ? 'Editar Parâmetro Logístico' : 'Mapear Novo Endereço'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="unitId" className="text-xs font-bold uppercase text-muted-foreground">Unidade</Label>
              <Select 
                value={formData.unitId} 
                onValueChange={(v) => setFormData({ ...formData, unitId: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type" className="text-xs font-bold uppercase text-muted-foreground">Tipo</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v: LocationType) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="zoneCategory" className="text-xs font-bold uppercase text-muted-foreground">Zona Logística (Zonificação)</Label>
            <Select 
              value={formData.zoneCategory} 
              onValueChange={(v: ZoneCategory) => setFormData({ ...formData, zoneCategory: v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Defina a zona para estratégias de picking/putaway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geral / Sem Restrição</SelectItem>
                {ZONE_CATEGORIES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="parentId" className="text-xs font-bold uppercase text-muted-foreground">Dependência Hierárquica (Pai)</Label>
            <Select 
              value={formData.parentId || 'none'} 
              onValueChange={(v) => setFormData({ ...formData, parentId: v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Nó Raiz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nó Mestre (Topo da Hierarquia)</SelectItem>
                {parentLocations
                  .filter(l => l.id !== location?.id)
                  .filter(l => {
                    if (formData.type === 'STREET') return l.type === 'ZONE';
                    if (formData.type === 'SHELF') return l.type === 'STREET';
                    if (formData.type === 'LEVEL') return l.type === 'SHELF';
                    if (formData.type === 'BIN') return l.type === 'LEVEL';
                    return true;
                  })
                  .map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <span className="font-bold text-[10px] mr-2 text-primary">{LOCATION_TYPE_LABELS[l.type]}</span> 
                      {l.fullAddress}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="label" className="text-xs font-bold uppercase text-muted-foreground">Identificação Curta (Ex: A, 01, N2)</Label>
            <Input 
              id="label" 
              placeholder="Ex: 01" 
              className="h-9 font-mono"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Weight className="h-3 w-3" /> Peso Máx (KG)
              </Label>
              <Input 
                type="number"
                placeholder="1500"
                className="h-8 text-xs"
                value={formData.maxWeight}
                onChange={(e) => setFormData({ ...formData, maxWeight: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Vol. Máx (m³)
              </Label>
              <Input 
                type="number"
                placeholder="2.5"
                className="h-8 text-xs"
                value={formData.maxVolume}
                onChange={(e) => setFormData({ ...formData, maxVolume: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Endereçamento Relevante (Standard)</p>
              <Badge variant="outline" className="text-[8px] border-blue-500/30 text-blue-400 uppercase font-black px-1.5 py-0 h-4 tracking-tighter">Área-Rua-Estante-Nível-Posição</Badge>
            </div>
            <div className="flex items-center gap-2">
               <Target className="h-4 w-4 text-emerald-500" />
               <p className="font-mono text-white text-sm font-bold break-all leading-tight">
                {formData.parentId && formData.parentId !== 'none' 
                  ? `${parentLocations.find(p => p.id === formData.parentId)?.fullAddress}-${formData.label || '??'}`
                  : (formData.label || '??')}
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {location?.id ? 'Atualizar Parâmetros' : 'Mapear Localização'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
