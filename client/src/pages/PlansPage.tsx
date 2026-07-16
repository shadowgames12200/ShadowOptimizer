import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function PlansPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Planos</h1>
          <p className="text-xs text-muted-foreground">Gerencie os planos disponíveis</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Vitalício", price: "R$ 99,90", desc: "Acesso permanente ao Shadow Optimizer", highlight: true },
            { name: "Mensal", price: "R$ 19,90", desc: "Acesso mensal ao Shadow Optimizer", highlight: false },
            { name: "Trimestral", price: "R$ 49,90", desc: "Acesso por 3 meses ao Shadow Optimizer", highlight: false },
          ].map((plan) => (
            <Card key={plan.name} className={`bg-[#0c0c0e] border-white/5 card-glow ${plan.highlight ? "border-primary/30" : ""}`}>
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {plan.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-black text-white">{plan.price}</p>
                <p className="text-xs text-muted-foreground mt-2">{plan.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
