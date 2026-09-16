#requires -Version 5.1
[CmdletBinding()]
param([switch]$NoMenu)

$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = Join-Path $Root 'logs'
$BackupDir = Join-Path $Root 'backups'
$ProfileDir = Join-Path $Root 'profiles'
New-Item -ItemType Directory -Force -Path $LogDir,$BackupDir,$ProfileDir | Out-Null
$LogFile = Join-Path $LogDir ("shadow-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))

function Write-Log { param([string]$Message,[ValidateSet('INFO','WARN','ERROR')][string]$Level='INFO')
    $line = "{0} [{1}] {2}" -f (Get-Date -Format 's'),$Level,$Message
    Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8
    if ($Level -eq 'ERROR') { Write-Host $line -ForegroundColor Red } elseif ($Level -eq 'WARN') { Write-Host $line -ForegroundColor Yellow } else { Write-Host $line }
}
function Pause-Shadow { Read-Host 'Pressione ENTER para continuar' | Out-Null }
function Test-Admin { $id=[Security.Principal.WindowsIdentity]::GetCurrent(); $p=New-Object Security.Principal.WindowsPrincipal($id); return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) }
function Confirm-Shadow { param([string]$Text) $a=Read-Host "$Text [s/N]"; return $a -match '^(s|sim|y|yes)$' }
function Save-Snapshot { param([string]$Name,[hashtable]$Data)
    $id = "{0}-{1}" -f (Get-Date -Format 'yyyyMMdd-HHmmss'),($Name -replace '[^a-zA-Z0-9_-]','_')
    $path=Join-Path $BackupDir "$id.json"; $Data.Id=$id; $Data.Created=(Get-Date).ToString('o'); $Data | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $path -Encoding UTF8
    Write-Log "Snapshot criado: $path"; return $path
}
function Get-Snapshots { Get-ChildItem $BackupDir -Filter '*.json' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending }
function Show-Header { Clear-Host; Write-Host 'SHADOW OPTIMIZER V2' -ForegroundColor Cyan; Write-Host 'Otimização segura, reversível e mensurável' -ForegroundColor DarkCyan; Write-Host "Log: $LogFile`n" -ForegroundColor DarkGray }
function Get-SystemInfo {
    $os=Get-CimInstance Win32_OperatingSystem; $cs=Get-CimInstance Win32_ComputerSystem; $cpu=Get-CimInstance Win32_Processor | Select-Object -First 1
    [pscustomobject]@{ Computer=$env:COMPUTERNAME; User=$env:USERNAME; OS=$os.Caption; Version=$os.Version; Build=$os.BuildNumber; Architecture=$os.OSArchitecture; RAM_GB=[math]::Round($cs.TotalPhysicalMemory/1GB,1); CPU=$cpu.Name; Cores=$cpu.NumberOfCores; Threads=$cpu.NumberOfLogicalProcessors; FreeRAM_GB=[math]::Round($os.FreePhysicalMemory/1MB,1); Uptime=(Get-Date)-$os.LastBootUpTime }
}
function Show-Diagnostics {
    Show-Header; $info=Get-SystemInfo; $info | Format-List
    Write-Host 'Discos:' -ForegroundColor Cyan; Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Select DeviceID,@{n='FreeGB';e={[math]::Round($_.FreeSpace/1GB,1)}},@{n='SizeGB';e={[math]::Round($_.Size/1GB,1)}} | Format-Table -AutoSize
    Write-Host 'Processos por memória:' -ForegroundColor Cyan; Get-Process | Sort-Object WorkingSet64 -Descending | Select -First 10 ProcessName,Id,@{n='RAM_MB';e={[math]::Round($_.WorkingSet64/1MB,0)}},CPU | Format-Table -AutoSize
    Write-Log 'Diagnóstico executado'; Pause-Shadow
}
function Analyze-Optimizations {
    Show-Header; Write-Host 'ANÁLISE - nenhuma alteração será feita' -ForegroundColor Yellow
    $info=Get-SystemInfo; $issues=@()
    if($info.FreeRAM_GB -lt 2){$issues+='Pouca RAM livre no momento; investigar processos antes de limpar memória.'}
    $c=Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'" -ErrorAction SilentlyContinue; if($c -and ($c.FreeSpace/$c.Size) -lt .15){$issues+='Menos de 15% livre no disco C:; priorizar limpeza seletiva.'}
    if(-not (Test-Admin)){$issues+='O programa não está elevado; operações administrativas serão bloqueadas.'}
    $issues += 'Desativar serviços, segurança, atualização e componentes do sistema não será sugerido automaticamente.'
    if($issues.Count){$issues | ForEach-Object {Write-Host "- $_" -ForegroundColor Yellow}} else {Write-Host 'Nenhum alerta básico encontrado.' -ForegroundColor Green}
    Write-Host "`nAções seguras disponíveis: diagnóstico, limpeza seletiva, perfil de energia e monitoramento." -ForegroundColor Cyan
    Write-Log 'Análise prévia executada'; Pause-Shadow
}
function Apply-PowerProfile {
    Show-Header; $before=(powercfg /getactivescheme 2>&1 | Out-String); $beforeGuid=([regex]::Match($before,'[0-9a-fA-F-]{36}')).Value; Write-Host $before
    if(-not (Confirm-Shadow 'Criar e ativar o plano de alto desempenho?')){return}
    $snap=Save-Snapshot 'power-profile' @{Type='PowerScheme';Before=$before;BeforeGuid=$beforeGuid}
    $out=powercfg -duplicatescheme SCHEME_MIN 2>&1; $guid=($out | Select-String -Pattern '[0-9a-fA-F-]{36}' | Select -First 1).Matches.Value
    if($guid){powercfg /setactive $guid | Out-Null; Write-Host "Plano aplicado: $guid" -ForegroundColor Green; Write-Log "Plano de energia aplicado: $guid"} else {Write-Log 'Falha ao criar plano de energia' 'ERROR'}
    Pause-Shadow
}
function Revert-Last {
    Show-Header; $files=Get-Snapshots; if(-not $files){Write-Host 'Nenhum snapshot encontrado.'; Pause-Shadow; return}
    $files | Select -First 15 | ForEach-Object {Write-Host "$($_.Name)  $($_.LastWriteTime)"}
    $name=Read-Host 'Digite o nome do snapshot para reverter (vazio cancela)'; if(!$name){return}; $f=Join-Path $BackupDir $name
    if(!(Test-Path $f)){Write-Host 'Snapshot não encontrado.' -ForegroundColor Red; Pause-Shadow; return}
    $s=Get-Content $f -Raw | ConvertFrom-Json
    if($s.Type -eq 'PowerScheme' -and (Confirm-Shadow 'Restaurar o plano de energia anterior?')){if($s.BeforeGuid){powercfg /setactive $s.BeforeGuid | Out-Null; Write-Host "Plano restaurado: $($s.BeforeGuid)" -ForegroundColor Green; Write-Log "Plano restaurado pelo snapshot $name"}else{Write-Log "Snapshot sem GUID anterior: $name" 'WARN'}}
    Pause-Shadow
}
function Get-StartupItems {
    $paths=@('HKCU:\Software\Microsoft\Windows\CurrentVersion\Run','HKLM:\Software\Microsoft\Windows\CurrentVersion\Run','HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run')
    foreach($p in $paths){if(Test-Path $p){$o=Get-ItemProperty $p; foreach($prop in $o.PSObject.Properties | Where-Object {$_.Name -notmatch '^PS'}){[pscustomobject]@{Location=$p;Name=$prop.Name;Command=[string]$prop.Value}}}}
}
function Show-Startup { Show-Header; Get-StartupItems | Format-Table -Wrap -AutoSize; Write-Log 'Lista de inicialização exibida'; Pause-Shadow }
function Clean-Safe {
    Show-Header; $targets=@($env:TEMP,(Join-Path $env:WINDIR 'Temp'),(Join-Path $env:LOCALAPPDATA 'Microsoft\Windows\INetCache')) | Where-Object {Test-Path $_}
    $items=foreach($t in $targets){Get-ChildItem $t -Force -Recurse -ErrorAction SilentlyContinue | Where-Object {!$_.PSIsContainer}}
    $size=($items | Measure-Object Length -Sum).Sum; Write-Host "Arquivos candidatos: $($items.Count); espaço estimado: $([math]::Round($size/1MB,1)) MB" -ForegroundColor Cyan
    if(Confirm-Shadow 'Apagar somente esses temporários, ignorando arquivos em uso?'){$n=0; foreach($i in $items){Remove-Item $i.FullName -Force -ErrorAction SilentlyContinue; if(!(Test-Path $i.FullName)){$n++}}; Write-Log "Limpeza segura concluída: $n itens"; Write-Host "$n itens removidos." -ForegroundColor Green}
    Pause-Shadow
}
function Start-Benchmark { Show-Header; Write-Host 'Benchmark básico: 10 segundos. Feche jogos e tarefas pesadas.' -ForegroundColor Yellow; if(!(Confirm-Shadow 'Iniciar medição?')){return}
    $start=Get-Date; $samples=@(); 1..10 | ForEach-Object { $cpu=(Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 1).CounterSamples.CookedValue; $ram=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory; $samples += [pscustomobject]@{Second=$_;CPU=[math]::Round($cpu,1);FreeRAMGB=[math]::Round($ram/1MB,2)}; Write-Host "$_/10 CPU $([math]::Round($cpu,1))% RAM livre $([math]::Round($ram/1MB,2)) GB" }
    $avg=($samples.CPU | Measure-Object -Average).Average; $min=($samples.FreeRAMGB | Measure-Object -Minimum).Minimum; $file=Join-Path $LogDir "benchmark-$(Get-Date -Format yyyyMMdd-HHmmss).csv"; $samples | Export-Csv $file -NoTypeInformation; Write-Host "CPU médio: $([math]::Round($avg,1))%; menor RAM livre: $min GB; CSV: $file" -ForegroundColor Green; Write-Log "Benchmark salvo em $file"; Pause-Shadow
}
function Set-TemporaryGameMode {
    Show-Header; $profiles=Get-ChildItem $ProfileDir -Filter '*.json'; $profiles | ForEach-Object {Write-Host $_.BaseName}; $name=Read-Host 'Perfil do jogo (ex.: gaming)'; $p=Join-Path $ProfileDir "$name.json"; if(!(Test-Path $p)){Write-Host 'Perfil não encontrado.'; Pause-Shadow; return}; $cfg=Get-Content $p -Raw | ConvertFrom-Json; $procs=@($cfg.ProcessNames); $running=Get-Process -ErrorAction SilentlyContinue | Where-Object {$procs -contains ($_.ProcessName+'.exe') -or $procs -contains $_.ProcessName}; if(!$running){Write-Host 'Nenhum processo do perfil está aberto.' -ForegroundColor Yellow; Pause-Shadow; return}; $old=@(); foreach($x in $running){$old += [pscustomobject]@{Id=$x.Id;Name=$x.ProcessName;Priority=$x.PriorityClass.ToString()}; try{$x.PriorityClass='AboveNormal'; Write-Host "Prioridade temporária aplicada: $($x.ProcessName)"}catch{Write-Log "Falha no processo $($x.Id): $($_.Exception.Message)" 'WARN'}}; $snap=Save-Snapshot "game-$name" @{Type='TemporaryGame';Processes=$old}; Write-Host 'Modo temporário aplicado. A prioridade será restaurada ao encerrar este menu.'; Pause-Shadow; foreach($x in $old){try{$q=Get-Process -Id $x.Id -ErrorAction Stop; $q.PriorityClass=$x.Priority}catch{}}; Write-Log "Modo jogo temporário finalizado: $name"
}
function Show-Monitor { Show-Header; Write-Host 'Monitorando por 30 segundos. CTRL+C interrompe.' -ForegroundColor Cyan; 1..30 | ForEach-Object {$cpu=(Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 1).CounterSamples.CookedValue; $os=Get-CimInstance Win32_OperatingSystem; $disk=(Get-Counter '\LogicalDisk(_Total)\% Disk Time' -SampleInterval 1 -MaxSamples 1).CounterSamples.CookedValue; Write-Host ("{0} CPU {1,5:N1}% | Disco {2,5:N1}% | RAM livre {3,5:N2} GB" -f (Get-Date -Format HH:mm:ss),$cpu,$disk,($os.FreePhysicalMemory/1MB))}; Write-Log 'Monitoramento concluído'; Pause-Shadow }
function Invoke-Menu {
 while($true){Show-Header; Write-Host '1 Diagnóstico do sistema'; Write-Host '2 Analisar sem alterar'; Write-Host '3 Aplicar perfil de energia'; Write-Host '4 Reverter snapshot'; Write-Host '5 Gerenciar inicialização'; Write-Host '6 Limpeza segura'; Write-Host '7 Benchmark antes/depois'; Write-Host '8 Modo jogo temporário'; Write-Host '9 Monitor em tempo real'; Write-Host '0 Sair'; $c=Read-Host 'Escolha'; switch($c){'1'{Show-Diagnostics};'2'{Analyze-Optimizations};'3'{Apply-PowerProfile};'4'{Revert-Last};'5'{Show-Startup};'6'{Clean-Safe};'7'{Start-Benchmark};'8'{Set-TemporaryGameMode};'9'{Show-Monitor};'0'{return};default{Write-Host 'Opção inválida';Start-Sleep 1}}}
}
Write-Log "Início do Shadow Optimizer V2; admin=$(Test-Admin)"
if($NoMenu){Show-Diagnostics} else {Invoke-Menu}
