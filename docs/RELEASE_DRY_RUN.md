# Release 演练（Dry Run Checklist）

> 更新时间：2026-02-22  
> 目标：按“桌面 → Android”顺序跑通一次真实交付链路，确保可交付使用。

## 1. 前置检查

- 本地分支已合并到 `main`，并已推送远程
- CI 正常（至少 `Clients (vNext)` workflow 成功）
- 版本号策略确定：
  - Desktop：`vX.Y.Z`
  - Android：`android-vX.Y.Z`（支持 `-alpha/-beta/-rc`）

## 2. Desktop 发布演练（GitHub Release）

1) 打 tag 并推送：

```bash
git tag v1.0.0
git push origin v1.0.0
```

2) 等待 `.github/workflows/release.yml` 完成

3) 验收（GitHub Releases）：

- 至少存在：
  - `WorkOrder-v1.0.0-macos.zip`
  - `WorkOrder-v1.0.0-windows.zip`

4) 可选：自动更新演练（需要先配齐 Secrets）

需要 GitHub Secrets：
- `TAURI_PRIVATE_KEY`
- `TAURI_KEY_PASSWORD`
- `TAURI_PUBLIC_KEY`

验收：
- Release assets 中包含 `latest.json`
- Release assets 中包含 `workorder-v1.0.0-<platform>.*` 与 `.sig`

## 3. Android 发布演练（GitHub Release）

1) 打 tag 并推送：

```bash
git tag android-v1.0.0
git push origin android-v1.0.0
```

2) 等待 `.github/workflows/android-release.yml` 完成

3) 验收（GitHub Releases）：

- 至少存在：
  - `WorkOrder-android-v1.0.0-unsigned.apk`
  - `WorkOrder-android-v1.0.0-unsigned.aab`

4) 可选：签名 + Play 内测

需要 GitHub Secrets（签名）：
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

需要 GitHub Secrets（上传 Play）：
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

验收：
- Release assets 中包含 `WorkOrder-android-v1.0.0-signed.apk` 与 `WorkOrder-android-v1.0.0-signed.aab`
- Play Console 的 `internal` track 出现新版本

