import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Key, 
  CheckCircle, 
  Ban, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Zap,
  Circle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useState } from "react";
import { toast } from "sonner";

const emptyUsageData = [
  { name: 'Dia 1', keys: 0 },
  { name: 'Dia 2', keys: 0 },
  { name: 'Dia 3', keys: 0 },
  { name: 'Dia 4', keys: 0 },
  { name: 'Dia 5', keys: 0 },
  { name: 'Dia 6', keys: 0 },
  { name: 'Dia 7', keys: 0 },
];

const planData = [
  { name: 'Vitalício', value: 100, color: '#8b5cf6' },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.licenses.getStats.useQuery(undefined, {
    enabled: !!user
  });

  const [licenseType, setLicenseType] = useState("0");
  const [userId, setUserId] = useState("");
  const utils = trpc.useUtils();

  const createMutation = trpc.licenses.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Key gerada com sucesso: ${data.keys[0]}`);
      setUserId("");
      utils.licenses.list.invalidate();
      utils.licenses.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar key");
    },
  });

  const handleGenerateKey = () => {
    const days = parseInt(licenseType, 10);
    createMutation.mutate({
      prefix: "SHADOW",
      quantity: 1,
      expiresInDays: days > 0 ? days : undefined,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
        <Spinner className="text-primary w-12 h-12" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white gap-4">
        <p>Você não está autenticado.</p>
        <Button onClick={() => window.location.href = "/login"}>Ir para Login</Button>
      </div>
    );
  }

  const totalKeys = stats?.total ?? 0;
  const activeKeys = stats?.active ?? 0;
  const revokedKeys = stats?.revoked ?? 0;
  const activePercent = totalKeys > 0 ? ((activeKeys / totalKeys) * 100).toFixed(1) : "0";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Stats Row */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Visão geral do sistema Shadow Optimizer</p>
          </div>
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Sistema 100% Online</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard 
            title="Total de Usuários" 
            value="0" 
            change="0 hoje" 
            icon={Users} 
            color="bg-primary"
          />
          <StatCard 
            title="Keys Geradas" 
            value={statsLoading ? "..." : String(totalKeys)}
            change="0 hoje" 
            icon={Key} 
            color="bg-purple-500"
          />
          <StatCard 
            title="Keys Ativas" 
            value={statsLoading ? "..." : String(activeKeys)}
            change={`${activePercent}%`}
            icon={CheckCircle} 
            color="bg-green-500"
          />
          <StatCard 
            title="Keys Banidas" 
            value={statsLoading ? "..." : String(revokedKeys)}
            change="0 hoje" 
            icon={Ban} 
            color="bg-red-500"
          />
          <StatCard 
            title="Faturamento" 
            value="R$ 0" 
            change="0%" 
            icon={DollarSign} 
            color="bg-blue-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Gerar Nova Key */}
          <Card className="lg:col-span-3 bg-[#0c0c0e] border-white/5 card-glow">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gerar Nova Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Produto</label>
                <Select defaultValue="lifetime">
                  <SelectTrigger className="bg-white/5 border-white/5 h-11">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lifetime">Shadow Optimizer - Vitalício</SelectItem>
                    <SelectItem value="monthly">Shadow Optimizer - Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Tipo</label>
                <Select value={licenseType} onValueChange={setLicenseType}>
                  <SelectTrigger className="bg-white/5 border-white/5 h-11">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Vitalício</SelectItem>
                    <SelectItem value="30">Mensal (30 dias)</SelectItem>
                    <SelectItem value="90">Trimestral (90 dias)</SelectItem>
                    <SelectItem value="180">Semestral (180 dias)</SelectItem>
                    <SelectItem value="365">Anual (365 dias)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Usuário</label>
                <Input
                  placeholder="ID do usuário ou deixe em branco"
                  className="bg-white/5 border-white/5 h-11"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                onClick={handleGenerateKey}
                disabled={createMutation.isPending}
              >
                <Zap className="w-4 h-4 fill-current" />
                {createMutation.isPending ? "GERANDO..." : "GERAR KEY"}
              </Button>
            </CardContent>
          </Card>

          {/* Estatísticas de Uso */}
          <Card className="lg:col-span-6 bg-[#0c0c0e] border-white/5 card-glow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Estatísticas de Uso</CardTitle>
              <Select defaultValue="7">
                <SelectTrigger className="w-24 bg-white/5 border-white/5 h-8 text-[10px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={emptyUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#52525b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#52525b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="keys" 
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#09090b' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Atividade Recente */}
          <Card className="lg:col-span-3 bg-[#0c0c0e] border-white/5 card-glow">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 mb-3">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Nenhuma atividade recente.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">As atividades aparecerão aqui.</p>
              </div>
            </CardContent>
          </Card>

          {/* Distribuição de Planos */}
          <Card className="lg:col-span-4 bg-[#0c0c0e] border-white/5 card-glow">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Distribuição de Planos</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <div className="h-[200px] w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground font-medium">Vitalício</span>
                  </div>
                  <span className="text-white font-bold">0%</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground font-medium">Mensal</span>
                  </div>
                  <span className="text-white font-bold">0%</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-500" />
                    <span className="text-muted-foreground font-medium">Trimestral</span>
                  </div>
                  <span className="text-white font-bold">0%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sistemas Mais Utilizados */}
          <Card className="lg:col-span-4 bg-[#0c0c0e] border-white/5 card-glow">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sistemas Mais Utilizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressItem label="FiveM" value={0} color="bg-primary" />
              <ProgressItem label="GTA V" value={0} color="bg-primary/60" />
              <ProgressItem label="RDR 2" value={0} color="bg-primary/40" />
              <ProgressItem label="Valorant" value={0} color="bg-primary/20" />
              <ProgressItem label="Outros" value={0} color="bg-primary/10" />
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card className="lg:col-span-4 bg-[#0c0c0e] border-white/5 card-glow">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted-foreground font-medium uppercase">Versão do Painel</span>
                <span className="text-primary font-bold">v2.5.0</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted-foreground font-medium uppercase">Versão do Produto</span>
                <span className="text-primary font-bold">v3.1.7</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted-foreground font-medium uppercase">Usuários Online</span>
                <span className="text-green-500 font-bold">0</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-muted-foreground font-medium uppercase">Keys Ativas</span>
                <span className="text-white font-bold">{statsLoading ? "..." : `${activeKeys} / ${totalKeys}`}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground font-medium uppercase">Uso do Servidor</span>
                  <span className="text-white font-bold">0%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-0 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, change, icon: Icon, color }: any) {
  return (
    <Card className="bg-[#0c0c0e] border-white/5 card-glow overflow-hidden group">
      <CardContent className="p-4 relative">
        <div className={`absolute top-0 right-0 w-16 h-16 ${color} opacity-[0.03] rounded-bl-full group-hover:opacity-[0.08] transition-opacity`} />
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${color} bg-opacity-10 rounded-xl flex items-center justify-center border border-white/5`}>
            <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-black text-white">{value}</h3>
              <span className="text-[9px] font-bold text-primary">{change}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ icon: Icon, title, user, time, color }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-white leading-none">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-1">Usuário: <span className="text-white/70">{user}</span></p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[9px] text-muted-foreground">{time}</span>
        <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" />
      </div>
    </div>
  );
}

function ProgressItem({ label, value, color }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground font-medium uppercase">{label}</span>
        <span className="text-white font-bold">{value}%</span>
      </div>
      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
        <div className={`${color} h-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
