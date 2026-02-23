# 多平台客户端交付（Web / macOS / Windows / Android）

> 更新时间：2026-02-22  
> 目标：把同一套 `apps/web` 业务代码交付到 Web、Tauri 桌面端、Capacitor Android。

## 0. 约定

- Web（线上部署）默认使用 **history 路由**
- 桌面/Android（打包产物）默认使用 **hash 路由**（避免 `file://`/静态目录下刷新或深链路 404）
- 端侧通过登录页「服务器设置」配置 `API Base URL / WS Base URL`
- 桌面端 Token 默认存储在系统 Keychain/凭据管理器（不写入 localStorage）；Android 默认使用 Capacitor Preferences（可在后续升级为加密存储）

## 0.1 下载页（可选）

Web vNext 提供了一个“客户端下载”页面（`/download`），用于从 GitHub Releases 拉取最新桌面端/Android 产物并提供下载链接。

需要在 Web 构建环境配置：

```bash
VITE_GITHUB_REPO=owner/repo
```

## 1. Web（Vue 3 / Vite）

```bash
cd /path/to/work_order
npm install
npm run web:build
```

产物：`apps/web/dist/`

> CI：`.github/workflows/clients.yml` 会在构建后上传 `web-dist` artifact（便于下载验证）。

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

### 2.1 GitHub Release（tag 触发）

推送 tag（例如 `v1.0.0`）会触发 `.github/workflows/release.yml`，构建 macOS/Windows 安装包并发布到 GitHub Releases。

```bash
git tag v1.0.0
git push origin v1.0.0
```

#### 可选：桌面端自动更新（Upgrader / Updater）

如果你希望启用 Tauri 内置 updater，需要在仓库 Secrets 配置：

- `TAURI_PRIVATE_KEY` / `TAURI_KEY_PASSWORD`（用于签名更新包）
- `TAURI_PUBLIC_KEY`（会在 release workflow 中写入 `apps/desktop/src-tauri/tauri.conf.json` 的 `tauri.updater.pubkey` 并开启 `active`）

Updater 的 `latest.json` 下载地址会在 Release workflow 中自动注入：
- 优先使用 `TAURI_UPDATER_ENDPOINT`（你自建下载站点时使用）
- 否则使用 `GITHUB_REPOSITORY` 推导出 `https://github.com/<owner>/<repo>/releases/latest/download/latest.json`

默认情况下 `tauri.updater.active=false`（避免在未配置密钥时误启用）。当上述 3 个 Secrets 都存在时，Release workflow 会额外上传：

- `latest.json`（更新清单）
- `workorder-<tag>-<platform>.*` 与对应 `.sig`（更新包与签名）

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

### 3.1 GitHub Release（tag 触发）

推送 tag（例如 `v1.0.0` 或 `android-v1.0.0`）会触发 `.github/workflows/android-release.yml`，构建 Android release APK/AAB 并发布到 GitHub Releases。
当使用 `v1.0.0` 时，会与桌面端/Web 的 Release（`.github/workflows/release.yml`）共用同一个 GitHub Release 并追加上传 Android 产物。
默认会生成 `app-release-unsigned.apk` 与 `app-release-unsigned.aab`；配置 keystore secrets 后会额外输出签名后的 `app-release-signed.apk` 与 `app-release-signed.aab`。
版本号从 tag 注入到 Android 工程（`versionName/versionCode`），确保每次发布递增（稳定版 suffix=9，预发布 alpha/beta/rc suffix=1/2/3）。

```bash
git tag v1.0.0
git push origin v1.0.0

# 或者（兼容旧 tag 前缀）
git tag android-v1.0.0
git push origin android-v1.0.0
```

可选：配置以下 Secrets 以输出已签名 APK：
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

可选：上传到 Google Play（内测轨道）
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`（service account JSON，明文存入 GitHub Secrets）

可选（更快迭代）：Live Reload（dev server 模式）

```bash
cd /path/to/work_order
npm run web:dev

# Android 模拟器访问宿主机用 10.0.2.2
export CAP_SERVER_URL="http://10.0.2.2:5173"
npm run android:sync
```
