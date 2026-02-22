# Mobile Client（Capacitor）- Android

本应用用于把仓库现有的 `frontend/`（Vue SPA）打包为 Android 客户端。

## 开发模式建议

优先建议先跑通“Web 构建产物 → Capacitor 同步 → Android Studio 运行”的链路：

1) 构建 Web vNext（推荐）

```bash
cd apps/web
npm install
npm run build
```

2) 初始化并生成 Android 工程（首次）

```bash
cd apps/mobile
npm install
npm run cap:init
npm run cap:add:android
```

3) 同步 Web 资源并打开 Android Studio

```bash
cd apps/mobile
npm run cap:sync
npm run android:open
```

首次进入 App 后，在登录页底部点击「服务器设置」，配置：
- `API Base URL`：例如 `http://10.0.2.2:8000/api`（Android 模拟器访问宿主机用 `10.0.2.2`）
- `WS Base URL`：例如 `ws://10.0.2.2:8001`

## 说明

- `apps/mobile/www` 的内容来自 `apps/web/dist`（优先）或 `frontend/dist`（回退）（由 `cap:sync` 复制）。
- Android 工程（`apps/mobile/android`）体积较大，已在仓库 `.gitignore` 忽略；建议用脚本生成。
