import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Copy, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface LicenseDetailProps {
  licenseId: string;
}

export default function LicenseDetail({ licenseId }: LicenseDetailProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: licenses, isLoading: licensesLoading } = trpc.licenses.list.useQuery();
  const { data: accessLogs, isLoading: logsLoading } = trpc.licenses.getAccessLogs.useQuery(
    { licenseId: parseInt(licenseId) },
    { enabled: !!licenseId }
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const license = licenses?.find((l) => l.id === parseInt(licenseId));

  if (licensesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!license) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/licenses")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Licenses
          </Button>
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              License not found
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(license.key);
    toast.success("License key copied to clipboard");
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "invalid_key":
      case "invalid_hwid":
      case "revoked":
      case "expired":
      case "not_activated":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getResultLabel = (result: string) => {
    const labels: Record<string, string> = {
      success: "Success",
      invalid_key: "Invalid Key",
      invalid_hwid: "Invalid HWID",
      revoked: "Revoked",
      expired: "Expired",
      not_activated: "Not Activated",
    };
    return labels[result] || result;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => navigate("/licenses")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Licenses
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>License Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">License Key</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm font-mono bg-muted p-2 rounded flex-1">
                    {license.key}
                  </code>
                  <Button size="sm" variant="outline" onClick={handleCopyKey}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="mt-1" variant={license.status === "active" ? "default" : "secondary"}>
                  {license.status}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Activation Status</p>
                <p className="mt-1 text-sm">
                  {license.activated ? (
                    <span className="text-green-600 font-medium">Activated</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Not Activated</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Expiration Date</p>
                <p className="mt-1 text-sm">
                  {license.expiresAt
                    ? new Date(license.expiresAt).toLocaleDateString()
                    : "Never expires"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="mt-1 text-sm">
                  {new Date(license.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bound Hardware</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">HWID</p>
                {license.boundHwid ? (
                  <code className="text-xs font-mono bg-muted p-2 rounded block mt-1 break-all">
                    {license.boundHwid}
                  </code>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground italic">
                    Not bound yet. Will be set on first activation.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Access History</CardTitle>
            <CardDescription>All validation attempts for this license</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : accessLogs && accessLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>HWID</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getResultIcon(log.result)}
                            <span className="text-sm">{getResultLabel(log.result)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {log.hwid.substring(0, 16)}...
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.requestSource || "Unknown"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No access history yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
