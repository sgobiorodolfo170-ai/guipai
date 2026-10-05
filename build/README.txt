龟派（guipai）桌面版图标资源
================================

本目录为 electron-builder 的图标来源（electron-builder.yml 中 `directories.buildResources`）。

- icon.ico   Windows 图标，7 个尺寸帧（16/24/32/48/64/128/256），内嵌 PNG
- icon.png   1024×1024 源图，供后续设计迭代参考

生成方式
--------
图标由脚本程序化生成（零外部依赖，手写 PNG/ICO 编码）：

    node build/generate-icon.js

重新运行该命令即可覆盖生成 icon.ico 与 icon.png。修改配色或折线造型，
请编辑 generate-icon.js 顶部的主题色常量（BG / UP / UP_SOFT）与 drawIcon() 内的数据点。

设计说明
--------
深色底 #0d1117（与应用窗口 backgroundColor 一致）+ A股红涨上升折线 #ef232a，
折线节点带浅红高亮点。造型在 16px 下仍可辨识趋势方向。

macOS 图标
----------
mac 打包需要 build/icon.icns，当前未提供。若需构建 mac 包，
用 icon.png（1024×1024）转换：

    npx png2icons icon.png 1024x1024 -i icns -o icon.icns

或直接产出 .iconset 目录交由 iconutil 合成。