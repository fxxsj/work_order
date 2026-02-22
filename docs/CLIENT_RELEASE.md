# 多平台客户端交付（Web / macOS / Windows / Android）

> 更新时间：2026-02-22  
> 目标：把同一套 `apps/web` 业务代码交付到 Web、Tauri 桌面端、Capacitor Android。

## 0. 约定

- Web（线上部署）默认使用 **history 路由**
- 桌面/Android（打包产物）默认使用 **hash 路由**（避免 `file://`/静态目录下刷新或深链路 404）
- 端侧通过登录页「服务器设置」配置 `API Base URL / WS Base URL`

## 1. Web（Vue 3 / Vite）

```bash
cd /path/to/work_order
npm install
npm run web:build
```

产物：`apps/web/dist/`

## 2. 桌面端（Tauri：macOS / Windows）

前置：Rust toolchain（以及对应平台构建工具链）。

```bash
cd /path/to/work_order
npm install
npm run desktop:build
```

说明：
- `desktop:build` 会先以 hash 路由构建 `apps/web`（由 `apps/desktop/src-tauri/tauri.conf.json` 驱动）
- macOS/Windows 的签名、公证与自动更新建议在内测跑通后再补齐

## 3. Android（Capacitor）

前置：Android Studio + Android SDK（以及 JDK）。

首次生成 Android 工程：

```bash
cd /path/to/work_order
npm install
npm run android:init
```

每次构建与同步 Web 资源：

```bash
cd /path/to/work_order
npm run android:build
npm run android:open
```

可选（更快迭代）：Live Reload（dev server 模式）

```bash
cd /path/to/work_order
npm run web:dev

# Android 模拟器访问宿主机用 10.0.2.2
export CAP_SERVER_URL="http://10.0.2.2:5173"
npm run android:sync
```

