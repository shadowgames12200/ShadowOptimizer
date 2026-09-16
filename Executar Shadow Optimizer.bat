@echo off
chcp 65001 >nul
set "SCRIPT=%~dp0ShadowOptimizer.ps1"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
if errorlevel 1 (
  echo.
  echo O programa terminou com erro. Consulte a pasta logs.
  pause
)
