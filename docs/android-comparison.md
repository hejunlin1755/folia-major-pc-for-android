# Folia Android：差异、桌面能力与传播建议

核对日期：2026-10-26。比较依据为公开 README、Release 和本项目代码；其他 APK 未做同机安装对比，不能据此宣称速度、音质或稳定性领先。

## 架构与定位

Folia 桌面版使用 Electron + React，并非纯 Win32 原生界面。本安卓分支使用 React/WebView + 安卓插件 + 内置 Node 24。内置 Node 当前承载音乐协议服务，不会自动启动 Electron、Windows EXE/DLL 或桌面模组。

与其他安卓移植版相比，“无需自建后端”和“媒体通知”都已经是多家共有能力。我们的具体路线是把 Node 协议库直接带到手机，同时提供 35%～150% 界面缩放、首次比例设置和手机/平板布局。

## 公开项目对比

| 项目 | 公开说明中的路线与重点 | 与本分支的关系 |
| --- | --- | --- |
| [Timingyyds/folia-android](https://github.com/Timingyyds/folia-android) | OkHttp/CookieManager 原生协议桥、设备音乐库扫描、媒体通知；0.7.21 Release 标注 75% 等比缩放 | 同样独立运行。本分支提供用户可选的 35%～150% 比例，协议宿主采用内置 Node |
| [maimai993/folia-sonnet](https://github.com/maimai993/folia-sonnet) | 内置三平台接口、动态壁纸、可视化叠层、音乐锁屏、部分系统的原生歌词 | 这些系统级歌词/壁纸是对方已有亮点，本分支不能宣称独有或已经覆盖 |
| [whycfawa/folia-android](https://github.com/whycfawa/folia-android) | 原生协议桥、后台与锁屏控制、本地音乐；公开 Release 已跟进 0.7.22 | 同步上游是维护基本功，不能单独当作独家卖点 |
| [aikun-China/folia-major-apk](https://github.com/aikun-China/folia-major-apk) | 加载指定在线站点的 WebView 客户端 | 本分支把前端资源及协议服务打包到手机，不依赖该在线站点 |

具体来源：[Timing Release](https://github.com/Timingyyds/folia-android/releases/tag/v0.7.21)、[Sonnet README](https://github.com/maimai993/folia-sonnet#readme)、[whycfawa 移植说明](https://github.com/whycfawa/folia-android/blob/main/ANDROID_PORT.md)。未在文档发现某项功能不代表对方一定没有。

## Windows 专属与桌面专属能力

| 能力 | 代码依据 | 安卓现状 |
| --- | --- | --- |
| Windows WorkerW 桌面嵌入、桌面图标下方渲染及鼠标转发 | electron/wallpaper/windowsWallpaperController.cjs、windowsWallpaperMouse.cjs | Windows 专属；安卓需要自己的 WallpaperService，不能运行此 EXE |
| Windows Acrylic 原生窗口材质、任务栏缩略图播放按钮 | electron/main.cjs 的 win32 分支、setThumbarButtons、backgroundMaterial | Windows 专属；安卓需使用自己的窗口与媒体机制 |
| Spotify 账号与播放 | electron/spotify、@lox-audioserver/node-librespot | 属桌面能力。当前依赖包无 Android 预编译库，不能把现有桌面二进制打入 APK 就算支持 |
| YouTube Music 账号与播放 | electron/ytm/browserSignIn.cjs、webSignIn.cjs、sandbox.cjs | 属桌面能力。登录使用独立桌面浏览器会话，播放器脚本运行于桌面沙箱，安卓需要独立适配 |
| Folium Node 模组及透明 MOV/ProRes 4444 导出 | electron/modSystem/exportService.cjs、electron/modSystem | 属桌面能力，不限 Windows；依赖离屏窗口、进程与 ffmpeg，尚未移植 |
| MNN CPU 本地模型分析 | electron/analysis/mnn.cjs、native/folia-mnn | 属桌面原生计算路径；安卓需编译自己的原生库，并验证内存和耗电 |
| 汽水、波点协议 | qishui-music-api 0.2.2、bodian-music-api 0.1.2 | 协议是 Node 库，有直接移植基础。本轮已加入试验宿主：汽水在 Android 生成二维码；波点出现网络重置/超时。两者登录后曲库和播放尚未完成账号验证 |

## 宣传建议与可直接使用的文案

建议主打“手机和平板上比例可调的沉浸歌词播放器”，同时明确继承 Folia 的视觉能力。Node 是工程路线，应转译成用户收益；没有同机基准时，不写“更快、更省电、全网唯一”。

短标题：**把 Folia 放进手机和平板，界面大小由你决定。**

正文草稿：Folia Android 社区移植，保留全屏歌词与多种视觉样式，内置音乐服务，无需自建后端。首次打开就能用滑杆调整 35%～150% 的界面比例，也能在设置里随时修改。支持手机和平板、横竖屏切换与安卓媒体控制。源码及 APK 直接在 GitHub 获取，感谢 Folia 上游和音乐协议库作者。

传播素材优先做一段 20～30 秒的实际操作录屏：开场直接放歌词动效，随后展示手机/平板及横竖屏，再展示滑杆与播放控制。README 使用小图，完整录屏放到 Release 或演示链接。此文件是内容草稿，没有向社区或个人发送宣传消息。

优先提升首次登录、真实取流、锁屏续播和更新后的账号保留，再扩大传播。后续可评估“直接导出歌词短视频”作为产品方向；这只是候选，不能提前写成已完成功能。