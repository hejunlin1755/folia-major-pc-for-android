# Folia Android 版本对比结论

核对日期：2026-11-02。本项目对照版本为 `0.7.22-android.14`。下表按具体版本、功能和实现路径比较。

## 结论

本项目的主要特点是 **35%～150% 可调界面比例、首次启动比例预览、手机和平板横竖屏布局，以及随 APK 运行的 Node 音乐协议库**。

- 对比加载远程站点的壳版本：本项目把前端和音乐服务装进 APK，听歌不依赖壳作者维护的网站。
- 对比 Timing 的 `v0.7.21`：该发行版采用 75% 等比缩放；本项目提供 35%～150% 滑杆、每档 5%、预览和重启保存，能按设备及个人习惯调整。
- 对比 Sonnet：本项目已同步 Folia 0.7.22 的 Hanabi 和随机样式池；Sonnet 的系统整合更丰富，包括动态壁纸、可视化叠层、ColorOS 原生歌词和 Lyricon。Sonnet 还已经接入 Android YouTube Music；本项目尚未接入。
- 对比原生协议桥路线：本项目直接在 Android 内置 Node 24 中运行固定版本协议库，复用上游 Node 操作接口；Timing、Sonnet、whycfawa 使用 OkHttp / CookieManager 原生桥。两种路线都能独立运行，差别在协议宿主和维护方式。

## 逐项对照

| 对照项目 | 对方的具体实现 | 本项目的具体差异 |
| --- | --- | --- |
| [Timingyyds/folia-android v0.7.21](https://github.com/Timingyyds/folia-android/releases/tag/v0.7.21) | 75% 等比缩放；MediaStore 扫描、SAF 导入；前台服务与媒体通知 | 35%～150% 自选比例，首次进入预览，设置中重调；协议由内置 Node 承载 |
| [maimai993/folia-sonnet](https://github.com/maimai993/folia-sonnet#readme) | 基于 0.7.21；动态壁纸、叠层、音乐锁屏、ColorOS 16 原生歌词、Lyricon；Android YouTube Music | 本项目基于 0.7.22，重点是可调比例和手机/平板布局；上述系统歌词、壁纸与 YouTube Music 属于对方已接入的功能 |
| [whycfawa/folia-android](https://github.com/whycfawa/folia-android/blob/main/ANDROID_PORT.md) | 复制平台 API 到原生桥，使用 OkHttp / CookieManager；MediaStore 扫描和本地音频流 | 本项目打包 Node 协议库，通过受鉴权保护的本地网关调用，前端经 Capacitor 访问；新增平台复用上游操作桥 |
| [aikun-China/folia-major-apk](https://github.com/aikun-China/folia-major-apk#readme) | WebView 加载 `music.aikun-bili.top` 远程站点 | 本项目的页面和音乐服务随 APK 安装，不依赖该远程站点；在线音乐请求仍需要联网 |

速度、音质和耗电不纳入本表；本表比较功能与实现。

## 本项目已交付与试验功能

| 能力 | 当前状态 | 依据 |
| --- | --- | --- |
| 35%～150% 界面缩放、首次预览、重启保存 | 已实现，并已检查模拟器中的 35% / 100% / 150% 布局 | `src/components/app/display-scale/`、`src/stores/useDisplayScaleStore.ts`、`src/utils/displayScale.ts` |
| 网易云、QQ、酷狗内置服务 | 已发布；最终包三平台二维码请求通过设备检查 | `packaging/android/backend/`、`AppLoginBridgeTest.java` |
| 后台播放、媒体通知、系统返回、沉浸全屏 | 已接入 Android 原生插件 | `packaging/android/android/app/src/main/java/top/izuna/folia/android/` |
| Hanabi 与随机样式池 | 随上游 0.7.22 合并 | `src/components/visualizer/hanabi/`、`src/types/visualizerModes.ts` |
| 汽水音乐 | 试验功能；Android 页面已显示登录二维码，登录后播放未实测 | `packaging/android/backend/extraPlatforms.cjs`、`src/services/onlineMusic/qishui/` |
| 波点音乐 | 试验功能；接口连接重置/超时，登录后播放未实测 | `packaging/android/backend/extraPlatforms.cjs`、`src/services/onlineMusic/bodian/` |
| Spotify、YouTube Music | 本项目 Android 版未接入 | 两个平台的 Android 播放与登录宿主尚未实现 |

## Windows 和桌面能力

Folia 桌面版是 Electron + React；本项目 Android 版是 React/WebView + Android 插件 + Node 24。Android 内置 Node 执行音乐协议，不运行 Windows EXE/DLL。

| 能力 | 平台及代码 | 本项目 Android 版 |
| --- | --- | --- |
| 嵌入桌面图标下方、桌面鼠标转发 | Windows WorkerW；`electron/wallpaper/windowsWallpaperController.cjs`、`windowsWallpaperMouse.cjs` | 未移植；Android 对应系统动态壁纸服务 |
| Acrylic 窗口材质、任务栏缩略图播控 | Windows；`electron/main.cjs` 中的 win32 分支 | 未移植；Android 使用自己的窗口和 MediaSession |
| Folium Node 模组、透明 MOV / ProRes 4444 导出 | 桌面 Electron 和 ffmpeg；`electron/modSystem/exportService.cjs` | 未移植 |
| MNN CPU 模型分析 | 桌面原生库；`electron/analysis/mnn.cjs` | 未移植 |
| Spotify | 桌面 librespot 宿主；`electron/spotify/` | 未移植；当前依赖缺少 Android 预编译库 |
| YouTube Music | 桌面浏览器登录和播放器沙箱；`electron/ytm/` | 未移植；Android 需要自己的登录与播放实现 |

## 项目介绍文案

**把 Folia 放进手机和平板，界面大小由你决定。**

Folia Android 保留全屏歌词与多种视觉样式，内置音乐服务，无需自建后端。首次打开就能用滑杆调整 35%～150% 的界面比例，也能在设置中随时修改。支持手机和平板横竖屏布局，以及 Android 媒体控制。项目沿用 AGPL-3.0，保留 Folia 上游和协议库作者的署名与许可。
