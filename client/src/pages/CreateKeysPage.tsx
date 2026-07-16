import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Copy, CheckCheck } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CreateKeysPage() {
  const [prefix, setPrefix] = useState("SHADOW");
  const [quantity, setQuantity] = useState("1");
  const [expiresInDays, setExpiresInDays] = useState("0");
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const createMutation = trpc.licenses.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setGeneratedKeys(data.keys);
      utils.licenses.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar chaves");
    },
  });

  const handleGenerate = () => {
    const qty = parseInt(quantity, 10);
    const days = parseInt(expiresInDays, 10);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      toast.error("Quantidade deve ser entre 1 e 100.");
      return;
    }
    createMutation.mutate({
      prefix: prefix || "SHADOW",
      quantity: qty,
      expiresInDays: days > 0 ? days : undefined,
    });
  };

  const handleCopy = (key: string, idx: number) => {
    navigator.clipboard.writeText(key);
    setCopiedIndex(idx);
    toast.success("Chave copiada!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Criação de Keys</h1>
          <p className="text-xs text-muted-foreground">Gere novas chaves de licença em lote</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <Card className="bg-[#0c0c0e] border-white/5 card-glow">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                Configurar Geração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Prefixo da Chave</label>
                <Input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  placeholder="Ex: SHADOW"
                  className="bg-white/5 border-white/5 h-11 font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Formato: {prefix || "SHADOW"}-XXXX-XXXX</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Quantidade</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-white/5 border-white/5 h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground/60">Tipo de Licença</label>
                <Select
                  value={expiresInDays}
                  onValueChange={setExpiresInDays}
                >
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

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                onClick={handleGenerate}
                disabled={createMutation.isPending}
              >
                <PlusCircle className="w-4 h-4" />
                {createMutation.isPending ? "Gerando..." : "GERAR CHAVES"}
              </Button>
            </CardContent>
          </Card>

          {/* Chaves geradas */}
          <Card className="bg-[#0c0c0e] border-white/5 card-glow">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Chaves Geradas {generatedKeys.length > 0 && `(${generatedKeys.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 mb-3">
                    <PlusCircle className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">As chaves geradas aparecerão aqui.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {generatedKeys.map((key, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/5"
                    >
                      <span className="text-xs font-mono text-white">{key}</span>
                      <button
                        onClick={() => handleCopy(key, idx)}
                        className="text-muted-foreground hover:text-primary transition-colors ml-2 shrink-0"
                      >
                        {copiedIndex === idx ? (
                          <CheckCheck className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
