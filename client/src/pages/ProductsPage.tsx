import { Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

function ProductsContent() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Produtos</h1>
        <p className="text-xs text-muted-foreground">Gerencie os produtos disponíveis</p>
      </div>
      <Card className="bg-[#0c0c0e] border-white/5 card-glow">
        <CardHeader>
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Package className="w-4 h-4" />
            Lista de Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-bold text-white">Shadow Optimizer</p>
            <p className="text-xs text-muted-foreground mt-2">Otimizador de sombras para FiveM e outros jogos.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<Spinner />}>
        <ProductsContent />
      </Suspense>
    </DashboardLayout>
  );
}

