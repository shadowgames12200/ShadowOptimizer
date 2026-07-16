import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Headphones, MessageCircle, MessageSquare } from "lucide-react";

export default function Support() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Suporte</h1>
          <p className="text-xs text-muted-foreground">Precisa de ajuda? Entre em contato com nossa equipe.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[#0c0c0e] border-white/5 card-glow">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <MessageSquare className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">Discord</CardTitle>
                <p className="text-xs text-muted-foreground">Comunidade e Suporte Técnico</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Junte-se ao nosso servidor oficial no Discord para tirar dúvidas, receber atualizações e interagir com outros usuários.
              </p>
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 gap-2"
                onClick={() => window.open("https://discord.gg/HaymV2msy", "_blank")}
              >
                ENTRAR NO DISCORD
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0c0e] border-white/5 card-glow">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">WhatsApp</CardTitle>
                <p className="text-xs text-muted-foreground">Suporte Direto e Vendas</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Entre em nosso grupo do WhatsApp para um contato mais direto com a administração e suporte rápido.
              </p>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-11 gap-2"
                onClick={() => window.open("https://chat.whatsapp.com/Bp9LuH2SJc332BRmJba7Hs", "_blank")}
              >
                ENTRAR NO WHATSAPP
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
