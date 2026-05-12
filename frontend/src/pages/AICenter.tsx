import * as React from 'react';
import { 
  Bot, 
  Send, 
  BrainCircuit, 
  AlertCircle, 
  TrendingUp, 
  ShieldAlert, 
  Zap, 
  Fingerprint,
  Search,
  History,
  MessageSquare,
  BarChart3,
  Activity,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { aiService, Insight, RiskAnalysis } from '@/lib/aiService';
import { useAuth } from '@/lib/AuthContext';
import { movementService } from '@/lib/movementService';
import { productService } from '@/lib/productService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

export default function AICenter() {
  const { profile } = useAuth();
  const [messages, setMessages] = React.useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [insights, setInsights] = React.useState<Insight[]>([]);
  const [risk, setRisk] = React.useState<RiskAnalysis | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Simulated data for charts
  const activityData = [
    { time: '08:00', load: 45 },
    { time: '10:00', load: 85 },
    { time: '12:00', load: 30 },
    { time: '14:00', load: 95 },
    { time: '16:00', load: 60 },
    { time: '18:00', load: 20 },
  ];

  React.useEffect(() => {
    async function initAI() {
      if (!profile) return;
      try {
        const [prodList, moveList] = await Promise.all([
          productService.getAll(profile.organizationId),
          movementService.getRecent(profile.organizationId, 10)
        ]);

        const [aiInsights, aiRisk] = await Promise.all([
          aiService.getOperationalInsights(prodList.slice(0, 5)),
          aiService.analyzeRisk(moveList.slice(0, 10))
        ]);

        setInsights(aiInsights);
        setRisk(aiRisk);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    initAI();
  }, [profile]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await aiService.chat(userMessage, messages.map(m => ({ 
        role: m.role, 
        parts: [{ text: m.text }] 
      })));
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      toast.error("Erro na resposta da IA Meta.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Header com Status da IA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-black tracking-tighter text-slate-900 uppercase">AI META CENTER</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
              <Zap className="h-3 w-3 text-blue-600" /> 
              Análise Operacional em Tempo Real Ativa
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Card className="px-5 py-3 border border-slate-200 shadow-sm bg-white flex items-center gap-4 rounded-xl">
             <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Acurácia (Ope)</p>
                <p className="text-xl font-heading font-black text-slate-900 leading-none tracking-tight">99.4%</p>
             </div>
             <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
               <Activity className="h-4 w-4 text-blue-600" />
             </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Esquerdo: Dashboards e Insights */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Top Line Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShieldAlert className="h-16 w-16" />
               </div>
               <CardContent className="pt-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ranking de Risco (Global)</p>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-4xl font-black text-slate-900 leading-none">{risk?.score || 0}</span>
                    <span className="text-sm font-bold text-slate-400 uppercase mb-1">pts</span>
                  </div>
                  <Progress value={risk?.score || 0} className="h-1.5" />
                  <p className="text-[10px] mt-4 text-emerald-600 font-bold flex items-center gap-1 uppercase">
                    <TrendingUp className="h-3 w-3" /> 12% abaixo da média mensal
                  </p>
               </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
               <CardContent className="pt-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Previsão de Ruptura (72h)</p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black text-amber-600 leading-none">04</span>
                    <span className="text-sm font-bold text-slate-400 uppercase mb-1">SKUs</span>
                  </div>
                  <div className="flex gap-1 mt-4">
                    {[1,2,3,4].map(i => <div key={i} className="h-1 flex-1 bg-amber-500 rounded-full" />)}
                    {[5,6].map(i => <div key={i} className="h-1 flex-1 bg-slate-100 rounded-full" />)}
                  </div>
                  <p className="text-[10px] mt-4 text-slate-500 font-medium">Itens de Classe A com giro acelerado</p>
               </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-slate-900 text-white">
               <CardContent className="pt-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Eficiência de Conversão</p>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-4xl font-black leading-none">94.2%</span>
                  </div>
                  <div className="h-[40px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={activityData}>
                          <Area type="monotone" dataKey="load" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                       </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </CardContent>
            </Card>
          </div>

          {/* Intelligent Insights Section */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                   <Zap className="h-4 w-4 text-primary" /> Autonomous Operational Insights
                </h3>
                <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase">Re-analizar Tudo</Button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                  Array(2).fill(0).map((_, i) => (
                    <Card key={i} className="animate-pulse bg-slate-100 border-none h-40" />
                  ))
                ) : (
                  insights.map((insight, idx) => (
                    <Card key={idx} className="border-none shadow-sm group hover:shadow-md transition-all overflow-hidden">
                       <div className={cn(
                         "h-1 w-full",
                         insight.type === 'ALERT' ? "bg-red-500" : insight.type === 'WARNING' ? "bg-amber-500" : "bg-emerald-500"
                       )} />
                       <CardHeader className="pb-2">
                          <div className="flex items-center justify-between mb-2">
                             <Badge variant="outline" className="text-[9px] uppercase font-bold">{insight.type}</Badge>
                             <ArrowUpRight className="h-4 w-4 text-slate-200 group-hover:text-primary transition-colors" />
                          </div>
                          <CardTitle className="text-sm font-black tracking-tight">{insight.title}</CardTitle>
                       </CardHeader>
                       <CardContent className="space-y-3">
                          <p className="text-xs text-slate-500 line-clamp-2 italic">"{insight.description}"</p>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Impacto Financeiro / Produtivo</p>
                             <p className="text-xs font-bold text-slate-700">{insight.impact}</p>
                          </div>
                       </CardContent>
                    </Card>
                  ))
                )}
             </div>
          </div>

          {/* Explainability Log / Audit */}
          <Card className="border-none shadow-sm bg-white">
             <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Fingerprint className="h-4 w-4" /> AI Explanation Log & Ethics API
                </CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-2">
                   {risk?.factors.map((f, i) => (
                     <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-[11px]">
                        <div className="flex items-center gap-3">
                           <div className={cn("h-2 w-2 rounded-full", f.score > 50 ? "bg-red-500" : "bg-emerald-500")} />
                           <span className="font-bold text-slate-700">{f.name}</span>
                        </div>
                        <span className="text-slate-500 italic">{f.detail}</span>
                     </div>
                   ))}
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Lado Direito: IA Chat & Risk Ranking */}
        <div className="lg:col-span-4 space-y-6 flex flex-col h-full">
          
          {/* Chat Container */}
          <Card className="border-none shadow-xl flex-1 flex flex-col min-h-[600px] bg-slate-900 overflow-hidden text-white">
             <CardHeader className="bg-slate-800 border-b border-white/5 py-4">
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                   </div>
                   <div>
                      <CardTitle className="text-sm font-black tracking-tighter">Chat Operacional Meta</CardTitle>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Domínio Fechado: Logística</p>
                   </div>
                </div>
             </CardHeader>
             
             <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {messages.length === 0 && (
                    <div className="text-center py-12 space-y-4">
                       <MessageSquare className="h-12 w-12 text-slate-700 mx-auto" />
                       <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400">Como posso ajudar na sua operação hoje?</p>
                          <p className="text-[10px] text-slate-600 px-8 italic">
                            "Analise o giro de estoque dos cabos de cobre" <br/>
                            "Detecte divergências na unidade SP"
                          </p>
                       </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "max-w-[85%] rounded-2xl p-4 text-sm",
                      m.role === 'user' ? "ml-auto bg-primary text-white rounded-tr-none" : "mr-auto bg-slate-800 text-slate-200 rounded-tl-none border border-white/5"
                    )}>
                      {m.text}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="mr-auto bg-slate-800 rounded-2xl p-4 flex gap-1 items-center rounded-tl-none">
                       <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" />
                       <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                       <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>
             </ScrollArea>

             <div className="p-4 bg-slate-800/50 border-t border-white/5">
                <div className="flex gap-2 bg-slate-900 rounded-xl p-1.5 border border-white/10 ring-1 ring-white/5">
                   <Input 
                      placeholder="Comando operacional..." 
                      className="bg-transparent border-none focus-visible:ring-0 text-xs text-white"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                   />
                   <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleSend} disabled={isTyping}>
                      <Send className="h-4 w-4" />
                   </Button>
                </div>
                <p className="text-[8px] text-slate-500 text-center mt-3 uppercase font-bold tracking-widest">
                  IA de Domínio Restrito • RAG Ativo • Meta 3.1 Pro
                </p>
             </div>
          </Card>

          {/* Ranking de Risco por Unidade */}
          <Card className="border-none shadow-sm bg-white">
             <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unidades sob Monitoramento</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                {[
                  { name: 'Depósito Central', risk: 12, trend: 'stable' },
                  { name: 'Filial Industrial', risk: 45, trend: 'up' },
                  { name: 'Hub Logístico Sul', risk: 5, trend: 'down' }
                ].map(unit => (
                  <div key={unit.name} className="space-y-1.5">
                     <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700">{unit.name}</span>
                        <span className={cn(
                          "font-mono font-bold",
                          unit.risk > 40 ? "text-amber-500" : "text-emerald-500"
                        )}>{unit.risk}% Risco</span>
                     </div>
                     <Progress value={unit.risk} className="h-1 bg-slate-100" />
                  </div>
                ))}
             </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
