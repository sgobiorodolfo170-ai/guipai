@echo off
REM 构建 AKShare 桥接服务 exe（PyInstaller 冻结单目录）
REM 产物：python\aktools_server\dist\aktools-server\aktools-server.exe
REM 一次性重构建（~5-10min，拉 pandas/numpy/lxml 等），产物随 electron-builder 打包分发

setlocal
cd /d "%~dp0"

echo [build] 安装依赖 + pyinstaller...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt pyinstaller
if errorlevel 1 (echo [build] 依赖安装失败 & exit /b 1)

echo [build] 清理旧产物...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

echo [build] 运行 PyInstaller...
python -m PyInstaller build.spec --noconfirm --clean
if errorlevel 1 (echo [build] PyInstaller 失败 & exit /b 1)

echo [build] 完成: dist\aktools-server\aktools-server.exe
endlocal
