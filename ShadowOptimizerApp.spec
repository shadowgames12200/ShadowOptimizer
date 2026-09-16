# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules

hiddenimports = collect_submodules('psutil')
datas = [
    ('logo_shadow_games.png', '.'),
    ('shadow-games-banner.webp', '.'),
    ('store.json', '.'),
    ('modules.json', '.'),
    ('profiles', 'profiles'),
    ('backups', 'backups'),
    ('logs', 'logs'),
    ('shadow Windows Boost.bat', '.'),
    ('Shadow25Modules.ps1', '.'),
    ('icon.ico', '.'),
    ('legacy', 'legacy'),
]

a = Analysis(['ShadowOptimizerAppFull.py'], pathex=['.'], binaries=[], datas=datas, hiddenimports=hiddenimports, hookspath=[], hooksconfig={}, runtime_hooks=[], excludes=[], noarchive=False)
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, a.binaries, a.datas, [], name='ShadowOptimizer', debug=False, bootloader_ignore_signals=False, strip=False, upx=True, console=False, icon='icon.ico')
