@echo off
chcp 65001 >nul
where python >nul 2>&1
if errorlevel 1 (
  echo Python nao foi encontrado. Instale Python 3.10+ e marque Add Python to PATH.
  pause
  exit /b 1
)
python -m pip install -r "%~dp0requirements-gui.txt"
python "%~dp0ShadowOptimizerApp.py"
if errorlevel 1 pause
