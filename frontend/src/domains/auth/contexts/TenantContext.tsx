import * as React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';

export interface TenantContextType {
  currentUnit: any | null;
  setCurrentUnit: (unit: any) => void;
  units: any[];
  loading: boolean;
}

export const TenantContext = React.createContext<TenantContextType>({
  currentUnit: null,
  setCurrentUnit: () => {},
  units: [],
  loading: true,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [units, setUnits] = React.useState<any[]>([]);
  const [currentUnit, setCurrentUnitState] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  const setCurrentUnit = React.useCallback((unit: any) => {
    setCurrentUnitState(unit);
    if (unit) {
      localStorage.setItem('nexus_current_unit', JSON.stringify(unit));
      localStorage.setItem('nexus_current_unit_id', unit.id);
    }
  }, []);

  React.useEffect(() => {
    if (!profile?.organizationId) {
      setLoading(false);
      return;
    }

    const loadUnits = async () => {
      try {
        setLoading(true);
        const unitsData = await apiFetch('/units');
        if (unitsData) {
          setUnits(unitsData);
          const savedUnit = localStorage.getItem('nexus_current_unit');
          if (savedUnit) {
            try {
              setCurrentUnitState(JSON.parse(savedUnit));
            } catch (e) {
              if (unitsData.length > 0) setCurrentUnit(unitsData[0]);
            }
          } else if (unitsData.length > 0) {
            setCurrentUnit(unitsData[0]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar unidades via API:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUnits();
  }, [profile?.organizationId, setCurrentUnit]);

  return (
    <TenantContext.Provider value={{ currentUnit, setCurrentUnit, units, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => React.useContext(TenantContext);
