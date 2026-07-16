import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2, Eye, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function LicensesPage() {
  const { user } = useAuth();
  const { data: licenses, isLoading } = trpc.licenses.list.useQuery();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [prefix, setPrefix] = useState("SHADOW");
  const [quantity, setQuantity] = useState(1);
  const utils = trpc.useUtils();

  const createMutation = trpc.licenses.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowCreateDialog(false);
      utils.licenses.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create licenses");
    },
  });

  const deleteMutation = trpc.licenses.delete.useMutation({
    onSuccess: () => {
      toast.success("Chave deletada com sucesso");
      setShowDeleteConfirm(null);
      utils.licenses.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar chave");
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const handleGenerateKeys = () => {
    createMutation.mutate({
      prefix,
      quantity,
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Chave copiada!");
  };

  const handleDeleteKey = (licenseId: number) => {
    deleteMutation.mutate({ licenseId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-yellow-100 text-yellow-800";
      case "revoked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chaves de Licença</h1>
            <p className="text-muted-foreground mt-2">Crie, gerencie e monitore suas chaves de licença</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Gerar Chaves
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Novas Chaves de Licença</DialogTitle>
                <DialogDescription>Crie uma ou mais chaves de licença com um prefixo personalizado</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prefix">Prefixo da Chave</Label>
                  <Input
                    id="prefix"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="ex: SHADOW"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Formato: PREFIXO-XXXX-XXXX</p>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleGenerateKeys}
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Criando..." : `Gerar ${quantity} Chave${quantity !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todas as Chaves de Licença</CardTitle>
            <CardDescription>Total: {licenses?.length || 0} chaves</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : licenses && licenses.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chave de Licença</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>HWID</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Criada em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.map((license) => (
                      <TableRow key={license.id}>
                        <TableCell className="font-mono text-sm">{license.key}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(license.status)}>
                            {license.status === "active" && "Ativa"}
                            {license.status === "expired" && "Expirada"}
                            {license.status === "revoked" && "Revogada"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {license.boundHwid ? (
                            <span className="font-mono">{license.boundHwid.substring(0, 16)}...</span>
                          ) : (
                            <span className="italic">Não vinculada</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {license.expiresAt
                            ? new Date(license.expiresAt).toLocaleDateString("pt-BR")
                            : "Nunca"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(license.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyKey(license.key)}
                              title="Copiar chave"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              title="Ver detalhes"
                              onClick={() => window.location.href = `/licenses/${license.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {showDeleteConfirm === license.id ? (
                              <div className="flex gap-1">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteKey(license.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowDeleteConfirm(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setShowDeleteConfirm(license.id)}
                                title="Deletar chave"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma chave de licença ainda. Clique em "Gerar Chaves" para criar a primeira.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
