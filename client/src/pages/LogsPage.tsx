import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function LogsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Registros</h1>
          <p className="text-xs text-muted-foreground">Histórico de atividades e acessos do sistema</p>
        </div>
        <Card className="bg-[#0c0c0e] border-white/5 card-glow">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Logs de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-bold text-white">Nenhum registro encontrado</p>
              <p className="text-xs text-muted-foreground mt-2">Os registros de acesso aparecerão aqui conforme as chaves forem sendo utilizadas.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
