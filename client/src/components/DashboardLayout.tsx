import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  Key, 
  Package, 
  FileText, 
  Monitor, 
  Headphones, 
  Settings, 
  PlusCircle, 
  Download, 
  CreditCard, 
  Store, 
  UserX,
  Bell,
  Search,
  Zap
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Usuários", path: "/users" },
  { icon: Key, label: "Keys", path: "/licenses" },
  { icon: Zap, label: "Shadow 1071", path: "/shadow-1071" },
  { icon: Package, label: "Produtos", path: "/products" },
  { icon: FileText, label: "Logs", path: "/logs" },
  { icon: Monitor, label: "Sistema", path: "/system" },
  { icon: Headphones, label: "Suporte", path: "/support" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

const managementMenuItems = [
  { icon: PlusCircle, label: "Criação de Keys", path: "/licenses/create" },
  { icon: Download, label: "Importar Licenças", path: "/import" },
  { icon: CreditCard, label: "Planos", path: "/plans" },
  { icon: Store, label: "Revenda", path: "/reseller" },
  { icon: UserX, label: "Banimentos", path: "/bans" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user, logout } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full bg-[#0c0c0e] border border-white/5 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <Key className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-center text-white">
              Shadow Games
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Faça login para acessar o painel de administração.
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full shadow-lg hover:shadow-primary/20 transition-all bg-primary hover:bg-primary/90 text-white font-semibold"
          >
            Entrar no Sistema
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#09090b]">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-white" />
              <div className="h-4 w-[1px] bg-white/10" />
              <span className="text-sm font-medium text-muted-foreground">
                Bem-vindo, <span className="text-primary font-bold">{user?.name || 'Charles'}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar..." 
                  className="w-64 bg-white/5 border-white/5 pl-10 focus:border-primary/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-4">
                <button className="relative p-2 text-muted-foreground hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-[#09090b]" />
                </button>
                <Button variant="outline" className="border-white/10 hover:bg-white/5 text-xs h-9 gap-2" onClick={() => logout()}>
                  <LogOut className="w-3 h-3" />
                  Sair
                </Button>
              </div>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 sidebar-gradient">
      <SidebarHeader className="h-20 justify-center px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shrink-0">
            <Key className="w-6 h-6 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-white uppercase italic">
                Shadow Games
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 gap-6">
        <div>
          {!isCollapsed && (
            <p className="px-3 mb-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
              Menu Principal
            </p>
          )}
          <SidebarMenu>
            {mainMenuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={location === item.path}
                  onClick={() => setLocation(item.path)}
                  tooltip={item.label}
                  className={`h-11 px-3 rounded-xl transition-all ${
                    location === item.path 
                    ? "bg-primary/10 text-primary font-semibold shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        <div>
          {!isCollapsed && (
            <p className="px-3 mb-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
              Gerenciamento
            </p>
          )}
          <SidebarMenu>
            {managementMenuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={location === item.path}
                  onClick={() => setLocation(item.path)}
                  tooltip={item.label}
                  className={`h-11 px-3 rounded-xl transition-all ${
                    location === item.path 
                    ? "bg-primary/10 text-primary font-semibold shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className={`flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5 ${isCollapsed ? 'justify-center' : ''}`}>
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-none">
                {user?.name || 'Charles'}
              </p>
              <p className="text-[10px] text-primary font-bold uppercase mt-1">
                Nível: MESTRE
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

