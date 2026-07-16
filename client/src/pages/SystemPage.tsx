import { Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Activity, CheckCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

function SystemContent() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Sistema</h1>
        <p className="text-xs text-muted-foreground">Informações e status do sistema</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#0c0c0e] border-white/5 card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-white/5">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                <p className="text-sm font-black text-green-500">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0c0c0e] border-white/5 card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-white/5">
                <Monitor className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Versão do Painel</p>
                <p className="text-sm font-black text-white">v2.5.0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0c0c0e] border-white/5 card-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-white/5">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Versão do Produto</p>
                <p className="text-sm font-black text-white">v3.1.7</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-[#0c0c0e] border-white/5 card-glow">
        <CardHeader>
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Informações Detalhadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-3">
            <span className="text-muted-foreground font-medium uppercase">Plataforma</span>
            <span className="text-white font-bold">Shadow Optimizer</span>
          </div>
          <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-3">
            <span className="text-muted-foreground font-medium uppercase">Ambiente</span>
            <span className="text-green-500 font-bold">Produção</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-muted-foreground font-medium uppercase">Banco de Dados</span>
            <span className="text-green-500 font-bold">Conectado</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SystemPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<Spinner />}>
        <SystemContent />
      </Suspense>
    </DashboardLayout>
  );
}
