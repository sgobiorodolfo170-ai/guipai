龟派（guipai）桌面版图标资源
================================

本目录为 electron-builder 的图标来源（electron-builder.yml 中 `directories.buildResources`）。

- source-icon.png   源图片（1254×1254，福运上涨：吉祥龟攀升股市），图标唯一设计源
- icon.ico          Windows 图标，7 个尺寸帧（16/24/32/48/64/128/256），内嵌 PNG
- icon.png          1024×1024 参考大图（由源图重采样生成，供设计迭代/展示用）
- icon.icns         macOS 图标（16/32/64/128/256/512/1024，内嵌 PNG）

生成方式
--------
图标由脚本从源图片生成（零外部依赖，手写 PNG 解码/编码 + ICO/ICNS 封装）：

    node build/generate-icon.js

缺省读取 build/source-icon.png；也可传入外部路径覆盖：

    node build/generate-icon.js "C:\Users\Administrator\Pictures\软件图标\福运上涨：吉祥龟攀升股市.png"

脚本一次性产出：build/icon.ico、build/icon.png、build/icon.icns，
并同步 frontend/public/favicon.ico 与 frontend/public/icon.png。

重采样策略：缩小用面积平均（area-average），放大用双线性（bilinear），
在预乘 alpha 空间内插值避免半透明边缘黑边。
替换图标时覆盖 build/source-icon.png 后重跑脚本即可全链路更新（窗口/任务栏/安装包/favicon）。

相关引用
--------
- electron-builder.yml：win.icon=build/icon.ico、mac.icon=build/icon.icns；
  extraResources 将 build/icon.ico 复制到 resources/build/icon.ico（运行时窗口/任务栏图标）
- electron/main.js：resolveIconPath() 开发态读 <项目>/build/icon.ico，
  打包态读 resources/build/icon.ico
- frontend/index.html：<link rel="icon" href="/favicon.ico">（frontend/public/favicon.ico）