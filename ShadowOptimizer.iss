[Setup]
AppName=Shadow Optimizer
AppVersion=2.0.0
AppPublisher=Shadow Games
DefaultDirName={autopf}\Shadow Games\Shadow Optimizer
DefaultGroupName=Shadow Games
OutputDir=installer
OutputBaseFilename=ShadowOptimizer-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
SetupIconFile=icon.ico

[Files]
Source: "dist\ShadowOptimizer.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Shadow Optimizer"; Filename: "{app}\ShadowOptimizer.exe"
Name: "{commondesktop}\Shadow Optimizer"; Filename: "{app}\ShadowOptimizer.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na área de trabalho"; GroupDescription: "Atalhos:"

[Run]
Filename: "{app}\ShadowOptimizer.exe"; Description: "Abrir Shadow Optimizer"; Flags: nowait postinstall skipifsilent
