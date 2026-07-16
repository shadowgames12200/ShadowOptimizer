import { Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

function BansContent() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Banimentos</h1>
        <p className="text-xs text-muted-foreground">Gerencie usuários e chaves banidos</p>
      </div>
      <Card className="bg-[#0c0c0e] border-white/5 card-glow">
        <CardHeader>
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <UserX className="w-4 h-4" />
            Lista de Banimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 mb-4">
              <UserX className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm font-bold text-white">Nenhum banimento registrado</p>
            <p className="text-xs text-muted-foreground mt-2">Os banimentos aparecerão aqui conforme forem aplicados.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BansPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<Spinner />}>
        <BansContent />
      </Suspense>
    </DashboardLayout>
  );
}
