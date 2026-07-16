import { Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

function ImportContent() {
  const [rawKeys, setRawKeys] = useState("");
  const utils = trpc.useUtils();

  const createMutation = trpc.licenses.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setRawKeys("");
      utils.licenses.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao importar licenças");
    },
  });

  const handleImport = () => {
    const lines = rawKeys.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error("Insira ao menos uma chave para importar.");
      return;
    }
    createMutation.mutate({ prefix: "SHADOW", quantity: lines.length });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Importar Licenças</h1>
        <p className="text-xs text-muted-foreground">Importe licenças em lote para o sistema</p>
      </div>
      <Card className="bg-[#0c0c0e] border-white/5 card-glow">
        <CardHeader>
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Download className="w-4 h-4" />
            Importação em Lote
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground/60">
              Chaves (uma por linha)
            </label>
            <Textarea
              placeholder={"SHADOW-XXXX-XXXX\nSHADOW-YYYY-YYYY\n..."}
              className="bg-white/5 border-white/5 min-h-[160px] text-xs font-mono"
              value={rawKeys}
              onChange={(e) => setRawKeys(e.target.value)}
            />
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            onClick={handleImport}
            disabled={createMutation.isPending}
          >
            <Upload className="w-4 h-4" />
            {createMutation.isPending ? "Importando..." : "IMPORTAR LICENÇAS"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ImportPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<Spinner />}>
        <ImportContent />
      </Suspense>
    </DashboardLayout>
  );
}
