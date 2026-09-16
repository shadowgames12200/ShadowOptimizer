# Shadow Optimizer V2

Esta versão implementa as dez funcionalidades solicitadas com foco em segurança, análise e reversibilidade.

A expansão inclui também 25 módulos catalogados em `modules.json`, um catálogo seguro de funções em `Shadow25Modules.ps1` e uma interface visual local com a identidade Shadow Games.

## Interface real licenciada

Execute `Executar Shadow Optimizer GUI.bat` para abrir o aplicativo gráfico `ShadowOptimizerApp.py`. A interface valida a key contra `https://shadow-optimizer.onrender.com/api/validate-license`, envia somente o HWID em hash, mostra a data de expiração e habilita o botão do otimizador apenas quando a API retorna `authorized: true`. A primeira validação vincula a licença ao HWID conforme a regra já implementada no servidor. A key não é salva em texto no computador do cliente.

## Funcionalidades

1. Snapshots e histórico de operações.
2. Análise antes de aplicar mudanças.
3. Diagnóstico de hardware, memória, discos e processos.
4. Sugestões básicas de gargalo.
5. Perfis de energia.
6. Gerenciador de inicialização.
7. Limpeza seletiva de temporários.
8. Benchmark de CPU e memória.
9. Modo jogo temporário.
10. Monitoramento em tempo real.

## Módulos 1 a 25

O arquivo `modules.json` lista os 25 módulos. O arquivo `Shadow25Modules.ps1` disponibiliza funções PowerShell para diagnóstico de saúde, gargalos, discos, arquivos grandes, duplicados, drivers, segurança, privacidade, tarefas, navegadores, manutenção, atualização, plugins, bibliotecas de jogos, shaders, notebook, temperaturas, estabilidade, travamentos, recuperação, regras de processos, recomendações, comparação, restauração e identidade visual.

Os módulos começam em modo de análise. A V2 não apaga arquivos duplicados, não remove drivers, não altera políticas de segurança e não registra tarefas agendadas sem uma etapa explícita de confirmação. O módulo de recuperação também é diagnóstico nesta versão; reparos destrutivos serão adicionados depois com confirmação e reversão.

## Identidade visual e loja

Abra `Shadow Games Control Center.html` para visualizar o painel com a logo e o banner fornecidos. O visual usa preto, roxo neon e azul elétrico. Para colocar a sua loja, edite `store.json` e altere `storeUrl`, `supportUrl`, `instagramUrl`, `discordUrl` e a lista de `products`. Assim você pode trocar nomes, descrições, preços e links sem alterar o HTML.

## Como executar

Extraia esta pasta em um computador Windows 10 ou Windows 11. Execute `Executar Shadow Optimizer.bat`. Para ações administrativas, abra o lançador como administrador. O modo de análise e diagnóstico não deve fazer alterações permanentes.

Para usar a interface licenciada, instale Python 3.10 ou superior e execute `Executar Shadow Optimizer GUI.bat`. O lançador instala `requests`, `psutil` e `pywin32` e abre o painel real da Shadow Games. Depois de validar a key, a lista lateral libera os 25 módulos. Cada módulo possui uma tela própria com descrição, botão de diagnóstico e saída/log. O botão de suporte usa o endereço configurado em `store.json`.

## Versão para clientes sem Python

O cliente final não precisa instalar Python quando você distribuir `ShadowOptimizer.exe`. Para gerar o executável, use uma máquina Windows de desenvolvimento e execute `build-windows.ps1`. O script usa PyInstaller e cria `dist\ShadowOptimizer.exe`. O arquivo `.github/workflows/build-windows.yml` também permite gerar o ZIP automaticamente no GitHub Actions usando um runner Windows. Para criar um instalador, abra `ShadowOptimizer.iss` no Inno Setup depois de gerar o EXE.

Os arquivos são gravados em:

- `logs/`: logs e CSVs de benchmark.
- `backups/`: snapshots em JSON.
- `profiles/`: perfis de processos para o modo jogo.
- `logo_shadow_games.png` e `shadow-games-banner.webp`: identidade visual local.
- `modules.json` e `store.json`: configurações editáveis do painel.

## Modelo de segurança

A V2 não remove aplicativos, não desativa antivírus, não desativa isolamento de núcleo, não bloqueia Windows Update e não desativa serviços automaticamente. O modo jogo altera a prioridade somente enquanto o menu estiver ativo e tenta restaurá-la ao final.

O script original foi preservado fora desta pasta. Teste a V2 em uma máquina secundária ou ponto de restauração antes de incorporar alterações adicionais.

## Próximos refinamentos recomendados

Para uma versão de produção, migrar gradualmente o menu para um aplicativo C# ou uma interface PowerShell e adicionar testes em uma máquina virtual Windows. Também é recomendável assinar digitalmente o executável final e validar os componentes externos.
