import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Zap, Copy, Trash2, Clock, PlusCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useLocation } from "wouter";

export default function Shadow1071Page() {
  const { data: licenses, isLoading } = trpc.licenses.listByProduct.useQuery({ product: "shadow_1071" });
  const [_, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.licenses.delete.useMutation({
    onSuccess: () => {
      toast.success("Chave removida");
      utils.licenses.listByProduct.invalidate();
    },
  });

  const formatTimeLeft = (expiresAt: string | Date | null) => {
    if (!expiresAt) return "Vitalício";
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diff = expiration.getTime() - now.getTime();
    if (diff <= 0) return "Expirada";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} dias restantes`;
  };

  if (isLoading) return <DashboardLayout><Spinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase italic flex items-center gap-2">
              <Zap className="text-primary w-6 h-6" />
              Shadow 1071 Jogos
            </h1>
            <p className="text-xs text-muted-foreground">Gerenciamento exclusivo da categoria Shadow 1071</p>
          </div>
          <Button onClick={() => setLocation("/licenses/create")} className="gap-2 bg-primary hover:bg-primary/90">
            <PlusCircle className="w-4 h-4" />
            Gerar Keys 1071
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#0c0c0e] border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground">Total de Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">{licenses?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0c0c0e] border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground">Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-green-500">{licenses?.filter(l => l.status === "active").length || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0c0c0e] border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground">Expiradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-orange-500">{licenses?.filter(l => l.status === "expired").length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#0c0c0e] border-white/5">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Listagem de Keys Shadow 1071</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Key</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Expiração</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">HWID</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses?.map((license) => (
                  <TableRow key={license.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="font-mono text-xs text-white">{license.key}</TableCell>
                    <TableCell>
                      <Badge className={license.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}>
                        {license.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeLeft(license.expiresAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">
                      {license.boundHwid || "Não ativado"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => {
                          navigator.clipboard.writeText(license.key);
                          toast.success("Copiada!");
                        }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => deleteMutation.mutate({ licenseId: license.id })}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
