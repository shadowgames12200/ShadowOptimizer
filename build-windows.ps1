$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
python -m pip install --upgrade pyinstaller requests psutil pywin32
if (Test-Path dist) { Remove-Item dist -Recurse -Force }
if (Test-Path build) { Remove-Item build -Recurse -Force }
pyinstaller --noconfirm --clean ShadowOptimizerApp.spec
Write-Host "Executável criado em: $PSScriptRoot\dist\ShadowOptimizer.exe" -ForegroundColor Green
