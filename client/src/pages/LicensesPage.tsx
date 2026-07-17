import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2, Eye, AlertCircle, Clock, RefreshCw } from "lucide-react";
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
  const [createDays, setCreateDays] = useState(30);
  const [showRenewDialog, setShowRenewDialog] = useState<number | null>(null);
  const [renewDays, setRenewDays] = useState(30);
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

  const deleteAllMutation = trpc.licenses.deleteAll.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.licenses.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao apagar todas as chaves");
    },
  });

  const renewMutation = trpc.licenses.updateExpiration.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowRenewDialog(null);
      utils.licenses.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao renovar chave");
    },
  });

  const formatTimeLeft = (expiresAt: string | null) => {
    if (!expiresAt) return "Nunca";
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diff = expiration.getTime() - now.getTime();
    
    if (diff <= 0) return "Expirada";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

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
      expiresInDays: createDays,
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
                  <div>
                    <Label htmlFor="createDays">Tempo de Expiração (em dias)</Label>
                    <Input
                      id="createDays"
                      type="number"
                      step="0.0001"
                      value={createDays}
                      onChange={(e) => setCreateDays(parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => setCreateDays(0.0007)}>1m</Button>
                      <Button variant="outline" size="sm" onClick={() => setCreateDays(0.0416)}>1h</Button>
                      <Button variant="outline" size="sm" onClick={() => setCreateDays(1)}>1d</Button>
                      <Button variant="outline" size="sm" onClick={() => setCreateDays(7)}>7d</Button>
                      <Button variant="outline" size="sm" onClick={() => setCreateDays(30)}>30d</Button>
                      <Button variant="outline" size="sm" onClick={() => setCreateDays(0)}>Vit.</Button>
                    </div>
                  </div>
	                <Button
	                  onClick={handleGenerateKeys}
	                  className="w-full mt-4"
	                  disabled={createMutation.isPending}
	                >
	                  {createMutation.isPending ? "Criando..." : `Gerar ${quantity} Chave${quantity !== 1 ? "s" : ""}`}
	                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Todas as Chaves de Licença</CardTitle>
              <CardDescription>Total: {licenses?.length || 0} chaves</CardDescription>
            </div>
            {licenses && licenses.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  if (confirm("TEM CERTEZA? Isso vai apagar TODAS as suas chaves e logs permanentemente!")) {
                    deleteAllMutation.mutate();
                  }
                }}
                disabled={deleteAllMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteAllMutation.isPending ? "Apagando..." : "Apagar Tudo"}
              </Button>
            )}
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
                          <div className="flex flex-col">
                            <span>{license.expiresAt ? new Date(license.expiresAt).toLocaleDateString("pt-BR") : "Nunca"}</span>
                            {license.expiresAt && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeLeft(license.expiresAt)}
                              </span>
                            )}
                          </div>
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
                              title="Renovar / Alterar Tempo"
                              onClick={() => {
                                setShowRenewDialog(license.id);
                                setRenewDays(30);
                              }}
                            >
                              <RefreshCw className="w-4 h-4" />
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

        {/* Dialog de Renovação */}
        <Dialog open={showRenewDialog !== null} onOpenChange={(open) => !open && setShowRenewDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renovar ou Alterar Tempo da Chave</DialogTitle>
              <DialogDescription>Defina o novo tempo de expiração a partir de agora.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="renewDays">Tempo (em dias)</Label>
                <Input
                  id="renewDays"
                  type="number"
                  step="0.01"
                  value={renewDays}
                  onChange={(e) => setRenewDays(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ex: 1 dia = 1 | 1 hora = 0.04 | 0 = Vitalício
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={() => setRenewDays(0.0007)}>1 Minuto</Button>
                <Button variant="outline" onClick={() => setRenewDays(0.0416)}>1 Hora</Button>
                <Button variant="outline" onClick={() => setRenewDays(1)}>1 Dia</Button>
                <Button variant="outline" onClick={() => setRenewDays(7)}>7 Dias</Button>
                <Button variant="outline" onClick={() => setRenewDays(30)}>30 Dias</Button>
                <Button variant="outline" onClick={() => setRenewDays(0)}>Vitalício</Button>
              </div>
              <Button
                className="w-full"
                onClick={() => showRenewDialog && renewMutation.mutate({ licenseId: showRenewDialog, expiresInDays: renewDays })}
                disabled={renewMutation.isPending}
              >
                {renewMutation.isPending ? "Salvando..." : "Salvar Novo Tempo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
