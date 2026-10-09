# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller 构建配置 —— 把 server.py + akshare + flask 冻结成单目录 exe。

akshare 大量子模块走动态 import（importlib），PyInstaller 静态分析会漏，
必须 collect_all 把 akshare/pandas/numpy 的数据文件、二进制、隐式导入全部收进。
产物：dist/aktools-server/aktools-server.exe + _internal/（依赖，~100MB）。

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

# akshare 动态子模块多，pandas/numpy 有 C 扩展与数据文件，全部 collect
for pkg in ['akshare', 'pandas', 'numpy', 'lxml', 'bs4', 'html5lib', 'requests']:
    try:
        d, b, h = collect_all(pkg)
        datas += d
        binaries += b
        hiddenimports += h
    except Exception:
        # 某个包未装时 collect_all 报错，跳过（akshare 装了就会拉齐依赖）
        pass

# 兜底隐式导入（akshare 常见但易漏的解析/网络依赖）
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
