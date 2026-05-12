import * as React from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { UserProfile } from '@/types';
import { apiFetch } from './api';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  currentUnit: any | null;
  setCurrentUnit: (unit: any) => void;
  units: any[];
  signInWithEmail: (email: string, pass: string) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [units, setUnits] = React.useState<any[]>([]);
  const [currentUnit, setCurrentUnitState] = React.useState<any | null>(null);

  const setCurrentUnit = (unit: any) => {
    setCurrentUnitState(unit);
    if (unit) {
      localStorage.setItem('nexus_current_unit', JSON.stringify(unit));
      localStorage.setItem('nexus_current_unit_id', unit.id);
    }
  };

  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!supabase) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        console.log('AuthProvider: Verificando sessão...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
        setLoading(false);
      } catch (err) {
        console.error('AuthProvider Init Error:', err);
        setLoading(false);
      }
    };

    init();

    // Dev Mode Auto-Login if Supabase check fails or no session
    setTimeout(() => {
      if (loading && process.env.NODE_ENV !== 'production' && !user) {
        console.log('Dev Mode: Timeout reached, using mock profile...');
        const devUser = '00000000-0000-0000-0000-000000000001';
        const devOrg = '00000000-0000-0000-0000-000000000002';
        const devUnit = '00000000-0000-0000-0000-000000000003';

        setUser({ id: devUser, email: 'dev@metaerp.com' } as any);
        setProfile({
          id: devUser,
          fullName: 'Desenvolvedor Local',
          role: 'OWNER',
          organizationId: devOrg,
          createdAt: Date.now()
        } as any);
        setUnits([{ id: devUnit, name: 'Unidade de Teste', company_id: devOrg }]);
        setCurrentUnitState({ id: devUnit, name: 'Unidade de Teste', company_id: devOrg });
        setLoading(false);
      }
    }, 2000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider Event:', event);
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid: string) {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Record not found
          console.log('Criando perfil inicial para novo usuário...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: uid,
              full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Novo Usuário',
              role: 'OWNER', // First user is the owner
              company_id: null // Will be linked on first setup
            })
            .select()
            .single();
          
          if (createError) throw createError;
          
          const userEmail = user?.email?.toLowerCase();
          const metadataOrgId = user?.user_metadata?.company_id;

          // 1. Check for manual invite first
          const { data: invite } = await supabase
            .from('user_invites')
            .select('*')
            .eq('email', userEmail)
            .eq('status', 'PENDING')
            .single();

          if (invite) {
            console.log('Convite manual encontrado para:', userEmail);
            await supabase.from('profiles').update({ 
              company_id: invite.company_id,
              role: invite.role,
              full_name: invite.full_name || newProfile.full_name
            }).eq('id', uid);

            await supabase.from('user_invites').update({ status: 'ACCEPTED' }).eq('id', invite.id);

            setProfile({
              ...newProfile,
              fullName: invite.full_name || newProfile.full_name,
              role: invite.role,
              organizationId: invite.company_id,
              createdAt: new Date(newProfile.created_at).getTime()
            } as any);
          } else if (metadataOrgId) {
            // 2. Check for metadata org link
            console.log('Vinculando novo colaborador à organização:', metadataOrgId);
            await supabase.from('profiles').update({ 
              company_id: metadataOrgId,
              role: 'OPERATOR' 
            }).eq('id', uid);

            setProfile({
              ...newProfile,
              fullName: newProfile.full_name,
              role: 'OPERATOR',
              organizationId: metadataOrgId,
              createdAt: new Date(newProfile.created_at).getTime()
            } as any);
          } else {
            // Auto-create a company for the new OWNER
            console.log('Criando empresa padrão para o novo proprietário...');
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({
                name: 'Minha Organização',
                plan: 'ENTERPRISE'
              })
              .select()
              .single();
            
            if (companyError) throw companyError;

            // Update profile with the new company_id
            await supabase.from('profiles').update({ company_id: newCompany.id, role: 'OWNER' }).eq('id', uid);

            setProfile({
              ...newProfile,
              fullName: newProfile.full_name,
              role: 'OWNER',
              organizationId: newCompany.id,
              createdAt: new Date(newProfile.created_at).getTime()
            } as any);
          }
        } else {
          throw error;
        }
      } else {
        // If user exists but has no company_id and is OWNER, create one
        if (!data.company_id && data.role === 'OWNER') {
           const { data: newCompany } = await supabase
            .from('companies')
            .insert({ name: 'Minha Organização', plan: 'ENTERPRISE' })
            .select()
            .single();
           
           if (newCompany) {
              await supabase.from('profiles').update({ company_id: newCompany.id }).eq('id', uid);
              data.company_id = newCompany.id;
           }
        }

        setProfile({
          ...data,
          fullName: data.full_name,
          displayName: data.full_name,
          organizationId: data.company_id,
          createdAt: new Date(data.created_at).getTime()
        } as any);
      }

      // Load units for this company via Backend API
      try {
        const unitsData = await apiFetch('/units');
        if (unitsData) {
          setUnits(unitsData);
          // Initialize current unit
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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = profile?.role === 'OWNER' || profile?.role === 'ADMIN';

  const signInWithEmail = async (email: string, pass: string) => {
    console.log('AuthProvider: Tentativa de login para:', email);
    const result = await supabase.auth.signInWithPassword({ email, password: pass });
    if (result.error) throw result.error;
    return result;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin, 
      currentUnit, 
      setCurrentUnit, 
      units,
      signInWithEmail,
      signOut: handleSignOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);

// Auth Helpers
export const signInWithEmail = (email: string, pass: string) => 
  supabase.auth.signInWithPassword({ email, password: pass });

export const sendPasswordReset = (email: string) => 
  supabase.auth.resetPasswordForEmail(email);

export const signUp = (email: string, pass: string, fullName: string, companyId?: string) => 
  supabase.auth.signUp({ 
    email, 
    password: pass,
    options: {
      data: {
        full_name: fullName,
        company_id: companyId
      }
    }
  });

export const signOut = () => supabase.auth.signOut();
