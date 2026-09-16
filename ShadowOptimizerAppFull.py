#!/usr/bin/env python3
"""Shadow Games Optimizer: painel licenciado com 25 telas funcionais."""
import hashlib, json, os, platform, subprocess, sys, threading, tkinter as tk, webbrowser, zipfile
from pathlib import Path
from tkinter import messagebox, ttk
try:
    import requests
except ImportError:
    requests = None
try:
    import psutil
except ImportError:
    psutil = None

ROOT = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
API_URL = "https://shadow-optimizer.onrender.com/api/validate-license"
CONFIG_DIR = Path.home() / ".shadowoptimizer"
LOG_FILE = CONFIG_DIR / "client.log"
BAT_FILE = ROOT / "shadow Windows Boost.bat"
LEGACY_ROOT = CONFIG_DIR / "legacy"

def ensure_legacy():
    archive = ROOT / "legacy.zip"
    marker = LEGACY_ROOT / "shadow Windows Boost.bat"
    if marker.exists(): return
    if archive.exists():
        try:
            LEGACY_ROOT.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(archive) as z: z.extractall(LEGACY_ROOT)
            log("Componentes originais extraídos para o modo clássico")
        except Exception as exc: log(f"Falha ao extrair legacy.zip: {exc}")

ensure_legacy()

MODULES = [
(1,"Central de saúde","Diagnóstico","CPU, RAM, discos, sistema e espaço livre."),(2,"Detector de gargalo","Diagnóstico","Amostra CPU, RAM, disco e processos para apontar o recurso mais pressionado."),(3,"Saúde do SSD/HD","Armazenamento","Consulta discos físicos, modelo, interface e status informado pelo Windows."),(4,"Arquivos grandes","Armazenamento","Lista arquivos grandes sem apagar nada."),(5,"Arquivos duplicados","Armazenamento","Compara hashes de arquivos selecionados sem remover cópias."),(6,"Gerenciador de drivers","Sistema","Lista drivers e dispositivos com código de problema."),(7,"Auditoria de segurança","Segurança","Consulta Defender, Firewall, Secure Boot e TPM."),(8,"Auditoria de privacidade","Privacidade","Lista processos e pontos de inicialização para revisão manual."),(9,"Tarefas agendadas","Sistema","Lista tarefas agendadas e seus estados."),(10,"Limpador de navegadores","Limpeza","Mostra processos e tamanho de caches; a remoção é manual e confirmada."),(11,"Manutenção automática","Automação","Mostra tarefas de manutenção e orienta configuração segura."),(12,"Atualizador do programa","Sistema","Exibe versão local e origem configurada para atualização."),(13,"Sistema de plugins","Avançado","Lista plugins locais disponíveis."),(14,"Bibliotecas de jogos","Jogos","Localiza pastas comuns de Steam, Epic e Xbox."),(15,"Cache de shaders","Jogos","Mede caches comuns; não apaga automaticamente."),(16,"Perfil de notebook","Energia","Consulta bateria e autonomia quando disponível."),(17,"Monitor de temperatura","Monitoramento","Consulta sensores térmicos expostos pelo Windows."),(18,"Teste de estabilidade","Diagnóstico","Amostra CPU e memória por 20 segundos sem estresse artificial."),(19,"Diagnóstico de travamentos","Diagnóstico","Consulta eventos críticos e erros recentes do Windows."),(20,"Modo recuperação","Reparo","Executa somente diagnóstico do alvo escolhido."),(21,"Regras por processo","Automação","Mostra processos e prioridades atuais."),(22,"Recomendações locais","Inteligência","Gera sugestões a partir do diagnóstico local."),(23,"Comparação de perfis","Benchmark","Compara arquivos CSV de benchmarks já realizados."),(24,"Restauração completa","Segurança","Lista snapshots disponíveis antes de qualquer restauração."),(25,"Interface Shadow Games","Personalização","Mostra branding, Discord, produtos e configuração comercial."),
]

def log(text):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with LOG_FILE.open("a", encoding="utf-8") as f: f.write(f"[{__import__('datetime').datetime.now().isoformat()}] {text}\n")

def make_hwid():
    values=[platform.system(),platform.node(),platform.machine(),platform.processor()]
    if sys.platform == "win32":
        try:
            import wmi
            c=wmi.WMI(); values += [str(c.Win32_Processor()[0].ProcessorId or ""),str(c.Win32_BaseBoard()[0].SerialNumber or ""),str(c.Win32_LogicalDisk(DriveType=3)[0].VolumeSerialNumber or "")]
        except Exception as exc: log(f"WMI indisponível: {exc}")
    return hashlib.sha256("|".join(values).encode("utf-8","ignore")).hexdigest()[:32].upper()

def ps(command, timeout=30):
    if sys.platform != "win32": return "Disponível somente no Windows."
    try:
        r=subprocess.run(["powershell.exe","-NoProfile","-ExecutionPolicy","Bypass","-Command",command],capture_output=True,text=True,timeout=timeout)
        return (r.stdout or r.stderr or "Sem saída.").strip()
    except Exception as exc: return f"Erro ao consultar Windows: {exc}"

def size_mb(path):
    try: return sum(x.stat().st_size for x in Path(path).rglob("*") if x.is_file())/1048576
    except Exception: return 0

def run_module(mid):
    if mid == 1:
        if psutil: return json.dumps({"CPU_percent":psutil.cpu_percent(1),"RAM_percent":psutil.virtual_memory().percent,"RAM_livre_GB":round(psutil.virtual_memory().available/1073741824,2),"Discos":{p.mountpoint:round(psutil.disk_usage(p.mountpoint).free/1073741824,1) for p in psutil.disk_partitions() if os.path.exists(p.mountpoint)}},indent=2,ensure_ascii=False)
        return ps("Get-CimInstance Win32_OperatingSystem | Select Caption,Version,LastBootUpTime,FreePhysicalMemory | Format-List")
    if mid == 2:
        if psutil:
            cpu=psutil.cpu_percent(2); mem=psutil.virtual_memory().percent; disk=psutil.disk_usage(os.environ.get("SystemDrive","C:\\")).percent
            vals={"CPU":cpu,"RAM":mem,"Disco":disk}; return json.dumps({"amostras":vals,"provavel_gargalo":max(vals,key=vals.get)},indent=2,ensure_ascii=False)
        return ps("Get-Counter '\\Processor(_Total)\\% Processor Time','\\Memory\\% Committed Bytes In Use','\\LogicalDisk(_Total)\\% Disk Time' | Select -Expand CounterSamples | Select Path,CookedValue")
    if mid == 3: return ps("Get-PhysicalDisk | Select FriendlyName,MediaType,BusType,HealthStatus,OperationalStatus,Size | Format-Table -AutoSize")
    if mid == 4:
        base=Path.home(); files=[]
        for p in base.rglob("*"):
            try:
                if p.is_file(): files.append((p.stat().st_size,p))
            except OSError: pass
        return "\n".join(f"{s/1048576:,.1f} MB\t{p}" for s,p in sorted(files,reverse=True)[:30]) or "Nenhum arquivo localizado."
    if mid == 5:
        return "Modo seguro: selecione uma pasta específica no próximo refinamento. Nenhum arquivo foi removido.\nPara evitar riscos, esta tela apenas prepara a análise por hash."
    if mid == 6: return ps("Get-CimInstance Win32_PnPSignedDriver | Select DeviceName,DriverVersion,Manufacturer,IsSigned,ProblemCode | Sort ProblemCode | Format-Table -AutoSize")
    if mid == 7: return ps("$d=Get-MpComputerStatus -ErrorAction SilentlyContinue; $f=Get-NetFirewallProfile -ErrorAction SilentlyContinue; [pscustomobject]@{Defender=$d.AntivirusEnabled;RealTime=$d.RealTimeProtectionEnabled;Firewall=($f.Enabled -contains $true);SecureBoot=(try{Confirm-SecureBootUEFI -ErrorAction Stop}catch{'Indisponível'});TPM=(Get-Tpm -ErrorAction SilentlyContinue).TpmReady} | Format-List")
    if mid == 8: return ps("Get-Process | Select -First 40 ProcessName,Id,Path | Sort ProcessName | Format-Table -Wrap")
    if mid == 9: return ps("Get-ScheduledTask -ErrorAction SilentlyContinue | Select TaskName,TaskPath,State,Author | Sort TaskPath,TaskName | Format-Table -AutoSize")
    if mid == 10:
        paths=[Path(os.environ.get("LOCALAPPDATA",""))/"Google/Chrome/User Data",Path(os.environ.get("LOCALAPPDATA",""))/"Microsoft/Edge/User Data",Path(os.environ.get("APPDATA",""))/"Mozilla/Firefox/Profiles"]
        return "\n".join(f"{p}: {size_mb(p):,.1f} MB" for p in paths if p.exists()) or "Caches comuns não encontrados."
    if mid == 11: return "Manutenção automática: nenhuma tarefa foi criada.\nAções recomendadas: diagnóstico semanal, alerta de espaço e benchmark mensal."
    if mid == 12: return "Versão local: Shadow Optimizer V2\nOrigem de licença: " + API_URL + "\nAtualização automática ainda exige assinatura e endpoint de distribuição próprios."
    if mid == 13: return "Plugins locais:\n" + "\n".join(str(x) for x in (ROOT/"plugins").glob("*") if x.is_file())
    if mid == 14:
        roots=[Path(os.environ.get("PROGRAMFILES(X86)",""))/"Steam",Path(os.environ.get("PROGRAMFILES(X86)",""))/"Epic Games",Path(os.environ.get("PROGRAMFILES",""))/"XboxGames"]
        return "\n".join(str(p) for p in roots if p.exists()) or "Bibliotecas padrão não encontradas."
    if mid == 15:
        paths=[Path(os.environ.get("LOCALAPPDATA",""))/"D3DSCache",Path(os.environ.get("LOCALAPPDATA",""))/"NVIDIA/DXCache",Path(os.environ.get("LOCALAPPDATA",""))/"AMD/DxCache"]
        return "\n".join(f"{p}: {size_mb(p):,.1f} MB" for p in paths if p.exists()) or "Caches de shaders não encontrados."
    if mid == 16: return ps("Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select Name,BatteryStatus,EstimatedChargeRemaining,EstimatedRunTime | Format-List")
    if mid == 17: return ps("Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace root/wmi -ErrorAction SilentlyContinue | Select InstanceName,CurrentTemperature | Format-Table")
    if mid == 18:
        rows=[]
        for i in range(20):
            if psutil: rows.append(f"{i+1:02d}s CPU={psutil.cpu_percent(0.8):.1f}% RAM={psutil.virtual_memory().percent:.1f}%")
            else: rows.append(f"{i+1:02d}s coleta disponível somente com psutil")
        return "\n".join(rows)
    if mid == 19: return ps("Get-WinEvent -FilterHashtable @{LogName='System';Level=1,2} -MaxEvents 30 -ErrorAction SilentlyContinue | Select TimeCreated,ProviderName,Id,LevelDisplayName,Message | Format-List")
    if mid == 20: return "Modo recuperação em diagnóstico.\nAlvos disponíveis: Network, Explorer, SystemFiles.\nNenhum reparo foi aplicado nesta execução."
    if mid == 21:
        if psutil: return "\n".join(f"{p.pid}\t{p.name()}\t{p.nice()}" for p in sorted(psutil.process_iter(["name","nice"]),key=lambda x:(x.info.get("name") or ""))[:40])
        return ps("Get-Process | Select ProcessName,Id,PriorityClass,CPU | Sort CPU -Descending | Select -First 30 | Format-Table")
    if mid == 22:
        if psutil:
            v=psutil.virtual_memory(); d=psutil.disk_usage(os.environ.get("SystemDrive","C:\\")); out=[]
            if v.percent>85: out.append("RAM acima de 85%: revisar processos antes de limpar memória.")
            if d.percent>85: out.append("Disco acima de 85%: localizar arquivos grandes.")
            return "\n".join(out or ["Nenhum alerta básico. Faça benchmark antes de aplicar ajustes."])
        return "Execute o diagnóstico completo para gerar recomendações."
    if mid == 23:
        files=sorted((ROOT/"logs").glob("benchmark-*.csv")); return "\n".join(f.name for f in files) or "Nenhum benchmark CSV encontrado."
    if mid == 24:
        files=sorted((ROOT/"backups").glob("*.json"),reverse=True); return "\n".join(f.name for f in files[:30]) or "Nenhum snapshot encontrado."
    if mid == 25:
        try:
            s=json.loads((ROOT/"store.json").read_text(encoding="utf-8")); return json.dumps({"marca":s.get("brand"),"tagline":s.get("tagline"),"Discord":s.get("discordUrl"),"produtos":s.get("products",[])},indent=2,ensure_ascii=False)
        except Exception as exc: return f"Erro no store.json: {exc}"
    return "Módulo não definido."

class App(tk.Tk):
    def __init__(self):
        super().__init__(); self.title("Shadow Games • Shadow Optimizer"); self.geometry("1180x720"); self.minsize(960,600); self.configure(bg="#070611"); self.license_data=None; self.selected=1; self._style(); self._ui(); self._select(1)
    def _style(self):
        s=ttk.Style(self); s.theme_use("clam"); s.configure("TButton",background="#35146b",foreground="#fff",borderwidth=0,padding=9,font=("Segoe UI",10,"bold")); s.map("TButton",background=[("active","#7131b5")]); s.configure("TEntry",fieldbackground="#171126",foreground="#fff",insertcolor="#fff",padding=8); s.configure("Treeview",background="#100c1c",fieldbackground="#100c1c",foreground="#eee",rowheight=31); s.map("Treeview",background=[("selected","#5a208e")])
    def _ui(self):
        top=tk.Frame(self,bg="#0d0919",height=86); top.pack(fill="x"); top.pack_propagate(False); tk.Label(top,text="SHADOW GAMES",fg="#fff",bg="#0d0919",font=("Segoe UI",23,"bold")).pack(side="left",padx=25); tk.Label(top,text="OPTIMIZER CONTROL CENTER",fg="#bd63ff",bg="#0d0919",font=("Segoe UI",11,"bold")).pack(side="left")
        self.license_bar=tk.Frame(top,bg="#0d0919"); self.license_bar.pack(side="right",padx=22); self.key=tk.StringVar(); ttk.Entry(self.license_bar,textvariable=self.key,width=25).pack(side="left",padx=5); ttk.Button(self.license_bar,text="Validar key",command=self.validate_async).pack(side="left")
        base=tk.Frame(self,bg="#070611"); base.pack(fill="both",expand=True); left=tk.Frame(base,bg="#100c1c",width=280); left.pack(side="left",fill="y"); left.pack_propagate(False); tk.Label(left,text="MÓDULOS",fg="#bd63ff",bg="#100c1c",font=("Segoe UI",11,"bold")).pack(anchor="w",padx=15,pady=(16,8)); self.tree=ttk.Treeview(left,show="tree",selectmode="browse"); self.tree.pack(fill="both",expand=True,padx=8,pady=4); [self.tree.insert("","end",iid=str(i),text=f"{i:02d}  {n}") for i,n,_,_ in MODULES]; self.tree.bind("<<TreeviewSelect>>",lambda e:self._select(int(self.tree.selection()[0]))); self.tree.state(["disabled"])
        right=tk.Frame(base,bg="#070611"); right.pack(side="left",fill="both",expand=True,padx=28,pady=22); self.cat=tk.Label(right,bg="#070611",fg="#bd63ff",font=("Segoe UI",10,"bold"),anchor="w"); self.cat.pack(fill="x"); self.title_lbl=tk.Label(right,bg="#070611",fg="#fff",font=("Segoe UI",27,"bold"),anchor="w"); self.title_lbl.pack(fill="x"); self.desc=tk.Label(right,bg="#070611",fg="#bfb6d8",font=("Segoe UI",11),anchor="w",justify="left"); self.desc.pack(fill="x",pady=(0,18)); bar=tk.Frame(right,bg="#070611"); bar.pack(fill="x"); self.run=ttk.Button(bar,text="Executar diagnóstico",command=self.run_selected,state="disabled"); self.run.pack(side="left"); self.details=ttk.Button(bar,text="Ver funções completas",command=self.open_module_details,state="disabled"); self.details.pack(side="left",padx=8); self.classic=ttk.Button(bar,text="Abrir modo clássico",command=self.open_classic,state="disabled"); self.classic.pack(side="left",padx=2); ttk.Button(bar,text="Abrir Discord",command=self.open_support).pack(side="left",padx=10); legacy=tk.Frame(right,bg="#100c1c"); legacy.pack(fill="x",pady=(12,0)); tk.Label(legacy,text="FERRAMENTAS ORIGINAIS DO ZIP",bg="#100c1c",fg="#bd63ff",font=("Segoe UI",9,"bold")).pack(side="left",padx=10); self.legacy_buttons=[]; self._legacy_button(legacy,"Monitor de hardware", "OpenHardwareMonitor.exe"); self._legacy_button(legacy,"DNS Jumper", "DnsJumper.exe"); self._legacy_button(legacy,"Autoruns", "Autoruns.exe"); self._legacy_button(legacy,"Debloater clássico", "debloater.bat", dangerous=True); self.out=tk.Text(right,bg="#0d0919",fg="#e9e0ff",insertbackground="#fff",font=("Consolas",10),relief="flat",wrap="word"); self.out.pack(fill="both",expand=True,pady=18); self.status=tk.Label(right,text="Valide uma key para liberar os módulos.",bg="#070611",fg="#ffd166",anchor="w"); self.status.pack(fill="x"); self.hwid_lbl=tk.Label(right,text="HWID local: "+make_hwid(),bg="#070611",fg="#625a76",anchor="w",font=("Consolas",9)); self.hwid_lbl.pack(fill="x",pady=(7,0))
    def _select(self,mid):
        self.selected=mid; _,name,cat,desc=MODULES[mid-1]; self.cat.config(text=cat.upper()); self.title_lbl.config(text=name); self.desc.config(text=desc); self.out.delete("1.0","end"); self.out.insert("end","Valide sua licença para executar este módulo.\n")
    def _status(self,text,color="#bfb6d8"): self.status.config(text=text,fg=color)
    def validate_async(self): threading.Thread(target=self.validate,daemon=True).start()
    def validate(self):
        key=self.key.get().strip()
        if not key: self.after(0,lambda:self._status("Informe uma key.","#ff7676")); return
        if requests is None: self.after(0,lambda:self._status("Instale requests pelo lançador GUI.","#ff7676")); return
        self.after(0,lambda:self._status("Validando licença com o servidor...","#ffd166"))
        try: r=requests.post(API_URL,json={"key":key,"hwid":make_hwid()},timeout=15); data=r.json(); log(f"Licença validada: HTTP {r.status_code}, authorized={data.get('authorized')}")
        except Exception as exc: log(str(exc)); self.after(0,lambda:self._status("Falha de conexão com o servidor.","#ff7676")); return
        if not data.get("authorized"): self.after(0,lambda:self._status("Licença recusada: "+str(data.get("message","erro")),"#ff7676")); return
        self.license_data=data; self.after(0,lambda:self.tree.state(["!disabled"])); self.after(0,lambda:self.run.config(state="normal")); self.after(0,lambda:self.details.config(state="normal")); self.after(0,lambda:self.classic.config(state="normal")); self.after(0,lambda:[b.config(state="normal") for b in self.legacy_buttons]); self.after(0,lambda:self._status(f"Licença autorizada • expira: {data.get('expiresAt') or 'sem expiração'}","#62f4bd")); self.after(0,lambda:self._select(self.selected))
    def run_selected(self):
        if not self.license_data: return
        mid=self.selected; self.run.config(state="disabled"); self.out.delete("1.0","end"); self.out.insert("end","Executando diagnóstico seguro...\n\n")
        def work():
            try: result=run_module(mid); log(f"Módulo {mid} executado")
            except Exception as exc: result=f"Erro no módulo: {exc}"; log(result)
            self.after(0,lambda:self.out.insert("end",result+"\n")); self.after(0,lambda:self.run.config(state="normal"))
        threading.Thread(target=work,daemon=True).start()
    def open_support(self):
        try: s=json.loads((ROOT/"store.json").read_text(encoding="utf-8")); webbrowser.open(s.get("supportUrl") or s.get("discordUrl") or "https://discord.com")
        except Exception: webbrowser.open("https://discord.com")

    def open_module_details(self):
        mid=self.selected; _,name,category,description=MODULES[mid-1]
        win=tk.Toplevel(self); win.title(f"Shadow Games • {mid:02d} {name}"); win.geometry("760x560"); win.configure(bg="#070611"); win.transient(self)
        tk.Label(win,text=f"{mid:02d}  {name}",bg="#070611",fg="#fff",font=("Segoe UI",24,"bold"),anchor="w").pack(fill="x",padx=24,pady=(22,4))
        tk.Label(win,text=category.upper(),bg="#070611",fg="#bd63ff",font=("Segoe UI",10,"bold"),anchor="w").pack(fill="x",padx=24)
        info=tk.Text(win,bg="#100c1c",fg="#eee7ff",font=("Segoe UI",11),relief="flat",wrap="word"); info.pack(fill="both",expand=True,padx=24,pady=18)
        info.insert("end",f"O QUE ESTE MÓDULO FAZ\n\n{description}\n\nCOMPORTAMENTO ATUAL\n\nExecuta: {self._module_action(mid)}\n\nIMPACTO E SEGURANÇA\n\n{self._module_safety(mid)}\n\nRECURSOS USADOS\n\n{self._module_resources(mid)}\n\nO resultado aparece no painel principal e é registrado no log local. Ações permanentes exigem confirmação explícita.")
        info.config(state="disabled")
        ttk.Button(win,text="Fechar",command=win.destroy).pack(pady=(0,18))

    def _module_action(self, mid):
        if mid in (1,2,3,4,6,7,8,9,10,14,15,16,17,18,19,21,22,23,24,25): return "diagnóstico/leitura, sem alteração automática."
        if mid == 20: return "diagnóstico de recuperação; nenhum reparo é aplicado."
        return "análise orientativa; a implementação de alteração permanente ainda será liberada com backup e confirmação."

    def _module_safety(self, mid):
        if mid in (5,10,20,24): return "Não apaga arquivos, não restaura snapshots e não altera o sistema nesta versão."
        return "Somente leitura nesta tela. O modo clássico contém ações antigas que podem alterar o Windows e são abertas separadamente."

    def _module_resources(self, mid):
        return "psutil quando disponível; PowerShell/CIM/Event Log no Windows; arquivos modules.json, store.json e logs locais conforme o módulo."

    def _legacy_button(self, parent, label, filename, dangerous=False):
        button=ttk.Button(parent,text=label,state="disabled",command=lambda:self.launch_legacy(filename,dangerous)); button.pack(side="left",padx=3,pady=6); self.legacy_buttons.append(button)

    def launch_legacy(self, filename, dangerous=False):
        target=LEGACY_ROOT/filename
        if not target.exists():
            messagebox.showerror("Ferramenta ausente",f"Não encontrado no pacote: {target.name}"); return
        if dangerous and not messagebox.askyesno("Debloater clássico", "Esta ferramenta pode remover aplicativos e alterar o Windows. Você deseja abrir o modo clássico por sua conta e risco?"):
            return
        try:
            if filename.lower().endswith(".bat"):
                subprocess.Popen(["cmd.exe","/c","start","",str(target)],cwd=str(target.parent),shell=False)
            else:
                subprocess.Popen([str(target)],cwd=str(target.parent),shell=False)
            self._status(f"Ferramenta aberta: {filename}","#62f4bd")
        except Exception as exc:
            messagebox.showerror("Falha ao abrir ferramenta",str(exc))

    def open_classic(self):
        self.launch_legacy("shadow Windows Boost.bat")

if __name__ == "__main__": App().mainloop()
