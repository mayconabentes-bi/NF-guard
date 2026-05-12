import * as React from 'react';
import { 
  ShoppingCart, 
  Package, 
  Wrench, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';

const orderVolumeData = [
  { name: 'Seg', loja: 42, materiais: 28, servicos: 15 },
  { name: 'Ter', loja: 38, materiais: 32, servicos: 18 },
  { name: 'Qua', loja: 55, materiais: 25, servicos: 22 },
  { name: 'Qui', loja: 48, materiais: 30, servicos: 20 },
  { name: 'Sex', loja: 62, materiais: 35, servicos: 25 },
  { name: 'Sáb', loja: 45, materiais: 15, servicos: 12 },
  { name: 'Dom', loja: 20, materiais: 10, servicos: 8 },
];

const statusDistribution = [
  { name: 'Pendentes', value: 24, color: '#f59e0b' },
  { name: 'Em Preparação', value: 18, color: '#3b82f6' },
  { name: 'Em Trânsito', value: 12, color: '#8b5cf6' },
  { name: 'Finalizados', value: 45, color: '#10b981' },
];

const recentOrders = [
  { id: 'ORD-8821', type: 'Loja', client: 'Marcenaria Silva', date: 'Há 5 min', status: 'Em Preparação', total: 'R$ 4.250,00' },
  { id: 'ORD-8820', type: 'Material', client: 'Construtora Alfa', date: 'Há 12 min', status: 'Pendente', total: 'R$ 12.800,00' },
  { id: 'ORD-8819', type: 'Serviço', client: 'Residencial Aurora', date: 'Há 25 min', status: 'Finalizado', total: 'R$ 850,00' },
  { id: 'ORD-8818', type: 'Loja', client: 'João Ferreira', date: 'Há 45 min', status: 'Em Trânsito', total: 'R$ 1.120,00' },
  { id: 'ORD-8817', type: 'Material', client: 'Indústria Beta', date: 'Há 1h', status: 'Em Preparação', total: 'R$ 7.400,00' },
  { id: 'ORD-8816', type: 'Serviço', client: 'Carlos Santos', date: 'Há 2h', status: 'Atrasado', total: 'R$ 320,00' },
];

const kpis = [
  {
    title: 'Vendas Loja',
    value: '142',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'text-blue-600',
    borderColor: 'border-blue-400',
    bgColor: 'bg-blue-50/50'
  },
  {
    title: 'Pedidos Materiais',
    value: '84',
    change: '+12.5%',
    trend: 'up',
    icon: Package,
    color: 'text-emerald-600',
    borderColor: 'border-emerald-400',
    bgColor: 'bg-emerald-50/50'
  },
  {
    title: 'Ordens de Serviço',
    value: '36',
    change: '-2.4%',
    trend: 'down',
    icon: Wrench,
    color: 'text-amber-600',
    borderColor: 'border-amber-400',
    bgColor: 'bg-amber-50/50'
  },
  {
    title: 'Eficiência de Entrega',
    value: '94.2%',
    change: '+1.5%',
    trend: 'neutral',
    icon: CheckCircle2,
    color: 'text-indigo-600',
    borderColor: 'border-indigo-400',
    bgColor: 'bg-indigo-50/50'
  }
];

export default function OrdersDashboard() {
  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-heading font-black tracking-tighter text-slate-900 uppercase">Acompanhamento de Pedidos</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
             Monitoramento Omnichannel em Tempo Real
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar pedido..." 
              className="h-10 w-64 pl-10 border-slate-200 bg-white shadow-sm font-medium uppercase text-[10px] tracking-widest focus-visible:ring-blue-600"
            />
          </div>
          <Button variant="outline" className="gap-2 font-bold uppercase text-[10px] tracking-widest border-slate-200 shadow-sm h-10">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className={cn("group hover:shadow-md transition-all duration-300 bg-white ring-1 ring-slate-200/50 border-t-4", kpi.borderColor)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between pb-4">
                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 group-hover:text-slate-700 transition-colors">{kpi.title}</span>
                <div className={cn("p-2 rounded-xl shadow-sm border border-transparent transition-colors", kpi.bgColor, kpi.color)}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <h3 className="text-4xl font-heading font-black tracking-tight text-slate-900">{kpi.value}</h3>
                <div className={cn(
                  "flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2 py-1 rounded-md",
                  kpi.trend === 'up' ? 'text-emerald-700 bg-emerald-50' : kpi.trend === 'down' ? 'text-rose-700 bg-rose-50' : 'text-slate-600 bg-slate-100'
                )}>
                  {kpi.change}
                  {kpi.trend === 'up' ? <ArrowUpRight className="h-3 w-3 ml-0.5" /> : kpi.trend === 'down' ? <ArrowDownRight className="h-3 w-3 ml-0.5" /> : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Order Volume Chart */}
        <Card className="col-span-full lg:col-span-4 border-slate-200 shadow-sm bg-white ring-1 ring-slate-200/50">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="font-heading font-black text-lg uppercase tracking-tight text-slate-900">Volume de Pedidos por Canal</CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold text-slate-500 mt-1">Comparativo Semanal de Processamentos</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontFamily: 'Inter',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}
                />
                <Bar dataKey="loja" name="Loja" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="materiais" name="Materiais" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="servicos" name="Serviços" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="col-span-full lg:col-span-3 border-slate-200 shadow-sm bg-white ring-1 ring-slate-200/50">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="font-heading font-black text-lg uppercase tracking-tight text-slate-900">Distribuição por Status</CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold text-slate-500 mt-1">Status Atuais do Pipeline Comercial</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex flex-col justify-center items-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 w-full mt-6 px-4">
              {statusDistribution.map((status) => (
                <div key={status.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: status.color }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-500">{status.name}</span>
                    <span className="text-sm font-bold text-slate-900">{status.value} Pedidos</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="border-slate-200 shadow-sm bg-white ring-1 ring-slate-200/50">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="font-heading font-black text-lg uppercase tracking-tight text-slate-900">Monitor de Pedidos Recentes</CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold text-slate-500">Últimas ativações no sistema</CardDescription>
          </div>
          <Button variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-slate-200 h-9">
            Ver Todos
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">ID Pedido</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Canal / Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Cliente / Destino</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Data / Horário</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Total</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-xs text-blue-600 group-hover:underline cursor-pointer">{order.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {order.type === 'Loja' && <ShoppingCart className="h-3 w-3 text-blue-500" />}
                        {order.type === 'Material' && <Package className="h-3 w-3 text-emerald-500" />}
                        {order.type === 'Serviço' && <Wrench className="h-3 w-3 text-amber-500" />}
                        <span className="text-[11px] font-bold uppercase tracking-tight text-slate-700">{order.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-900 transition-colors">{order.client}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{order.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-black text-slate-900">
                      {order.total}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-none",
                        order.status === 'Finalizado' ? "bg-emerald-100 text-emerald-700" :
                        order.status === 'Em Preparação' ? "bg-blue-100 text-blue-700" :
                        order.status === 'Em Trânsito' ? "bg-indigo-100 text-indigo-700" :
                        order.status === 'Pendente' ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-700"
                      )}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
