import * as React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  Search,
  ArrowRightLeft,
  Scissors,
  Building2,
  Send,
  FileText,
  Tablet,
  Book,
  BrainCircuit,
  Factory,
  ClipboardList,
  Monitor,
  Store,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  ChevronDown,
  History,
  Workflow
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar
} from '@/components/ui/sidebar';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth, signOut } from '@/lib/AuthContext';

interface NavItem {
  icon: any;
  label: string;
  href: string;
  roles: string[];
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupLabel: 'Visão Geral',
    items: [
      { icon: LayoutDashboard, label: 'Painel de Controle', href: '/', roles: ['ADMIN', 'OWNER', 'AUDITOR', 'SECURITY', 'OPERATOR', 'SELLER'] },
    ]
  },
  {
    groupLabel: 'Execução Logística',
    items: [
      { icon: FileText, label: 'Movimentação Fiscal', href: '/fiscal', roles: ['ADMIN', 'OWNER', 'OPERATOR', 'SELLER'] },
      { icon: ShieldCheck, label: 'WMS Galpão', href: '/wms-distributed', roles: ['ADMIN', 'OWNER', 'OPERATOR'] },
      { icon: Store, label: 'Checkout Loja', href: '/checkout', roles: ['ADMIN', 'OWNER', 'OPERATOR', 'SELLER'] },
    ]
  },
  {
    groupLabel: 'Auditoria & Segurança',
    items: [
      { icon: History, label: 'Rastreabilidade', href: '/traceability', roles: ['ADMIN', 'OWNER', 'SECURITY', 'AUDITOR'] },
      { icon: ShieldAlert, label: 'Lab Antifraude', href: '/anti-fraud', roles: ['ADMIN', 'OWNER', 'SECURITY'] },
    ]
  },
  {
    groupLabel: 'Gestão Estratégica',
    items: [
      { icon: Building2, label: 'Unidades Logísticas', href: '/units', roles: ['ADMIN', 'OWNER'] },
      { icon: Settings, label: 'Configurações', href: '/settings', roles: ['ADMIN', 'OWNER'] },
    ]
  },
  {
    groupLabel: 'Suporte',
    items: [
      { icon: Book, label: 'Manual de Operação', href: '/manual', roles: ['ADMIN', 'OWNER', 'OPERATOR', 'SECURITY', 'AUDITOR'] },
    ]
  }
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, profile } = useAuth();
  const { currentUnit, setCurrentUnit, units } = useTenant();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} profile={profile} />
      <SidebarInset className="bg-slate-50/50 min-h-screen overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-slate-500 hover:text-slate-900" />
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                <span className="hidden md:inline">{profile?.organizationId || 'META ERP'}</span>
                <span className="hidden md:inline opacity-30">-</span>
                <span className="text-slate-900 border-b-2 border-blue-600 pb-0.5">ALMOXARIFADO</span>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="search"
                  placeholder="Pesquisar no sistema..."
                  className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-10 text-xs font-medium text-slate-600 focus:border-blue-500 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/5"
                />
              </div>

              {/* Seletor de Unidade */}
              {units.length > 0 && (
                <div className="flex items-center gap-3 border-l border-slate-200 pl-5">
                  <div className="hidden xl:block">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Unidade Ativa</p>
                    <p className="text-[10px] font-bold text-slate-900 text-right">{currentUnit?.name || 'Selecione...'}</p>
                  </div>
                  <div className="relative group">
                    <select
                      value={currentUnit?.id || ''}
                      onChange={(e) => {
                        const unit = units.find(u => u.id === e.target.value);
                        if (unit) setCurrentUnit(unit);
                      }}
                      className={cn(
                        "appearance-none h-10 pl-10 pr-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-none cursor-pointer transition-all shadow-sm ring-1 ring-inset ring-slate-200",
                        currentUnit?.type === 'GALPAO' ? "bg-orange-50 text-orange-700 ring-orange-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      )}
                    >
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.type === 'GALPAO' ? '📦 ' : '🏬 '} {unit.name}
                        </option>
                      ))}
                    </select>
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30" />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
                </Button>
                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px] overflow-hidden shadow-inner">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name || ''} referrerPolicy="no-referrer" />
                  ) : (
                    (profile?.fullName?.[0] || user.email?.[0] || 'U').toUpperCase()
                  )}
                </div>
              </div>
            </div>
          </header>
          <div className="p-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar({ user, profile }: { user: any, profile: any }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-slate-900 text-slate-300">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <Package className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white group-data-[collapsible=icon]:hidden">
            META <span className="text-slate-500 font-medium tracking-widest text-xs ml-1 uppercase">ERP</span>
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-4 px-3 space-y-6">
        {navGroups.map((group) => {
          // STRICT FILTER: Only show items if user role is explicitly included in the allowed list
          const filteredItems = group.items.filter(item => 
            profile?.role && item.roles.includes(profile.role)
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={group.groupLabel} className="space-y-2">
              <h3 className="px-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-data-[collapsible=icon]:hidden">
                {group.groupLabel}
              </h3>
              <SidebarMenu className="gap-1">
                {filteredItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      render={
                        <Link to={item.href} className="flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase tracking-wider transition-colors relative group/link">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          
                          {/* Indicadores de Status Semânticos */}
                          {item.href === '/fiscal' && (
                            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[8px] px-1.5 py-0 rounded-md group-data-[collapsible=icon]:hidden">
                              SYNC
                            </Badge>
                          )}
                          {item.href === '/wms-distributed' && (
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] group-data-[collapsible=icon]:hidden" title="Operacional" />
                          )}
                          {item.href === '/checkout' && (
                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse group-data-[collapsible=icon]:hidden" title="Pendente" />
                          )}
                        </Link>
                      }
                      isActive={location.pathname === item.href}
                      className={cn(
                        "hover:bg-slate-800 hover:text-white rounded-xl transition-all",
                        location.pathname === item.href 
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/40" 
                          : "text-slate-200/70 hover:text-white"
                      )}
                      tooltip={item.label}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-800 p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-slate-400 hover:text-rose-400 hover:bg-slate-800 font-bold uppercase tracking-widest text-[10px]"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Sair com Segurança</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
