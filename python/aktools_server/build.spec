# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller 构建配置 —— 把 server.py + tdxaidata + flask 冻结成单目录 exe。

tdxaidata 依赖 pandas/numpy，PyInstaller 需 collect_all 收进 C 扩展与数据文件。
产物：dist/aktools-server/aktools-server.exe + _internal/（依赖）。

用法（项目根）：
  npm run build:akshare-server
或手动：
  cd python/aktools_server
  pip install -r requirements.txt pyinstaller
  pyinstaller build.spec --noconfirm --clean
"""

from PyInstaller.utils.hooks import collect_all

datas = []
binaries = []
hiddenimports = []

# tdxaidata 依赖 pandas/numpy（C 扩展与数据文件），全部 collect；akshare 已退役
for pkg in ['pandas', 'numpy', 'requests']:
    try:
        d, b, h = collect_all(pkg)
        datas += d
        binaries += b
        hiddenimports += h
    except Exception:
        # 某个包未装时 collect_all 报错，跳过
        pass

# 兜底隐式导入（常见但易漏的解析/网络依赖）
hiddenimports += [
    'json', 'csv', 'io', 're', 'datetime',
    'urllib.request', 'urllib.parse',
    'http.cookiejar', 'http.client',
]

a = Analysis(
    ['server.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=['matplotlib', 'pytest', 'IPython', 'jupyter'],
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='aktools-server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='aktools-server',
)
