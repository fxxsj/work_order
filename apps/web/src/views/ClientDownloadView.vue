<template>
  <div class="page">
    <div class="bar">
      <div class="title">客户端下载</div>
      <el-button size="small" @click="goHome">返回工作台</el-button>
    </div>

    <el-card class="card">
      <template #header>
        <div class="cardTitle">下载渠道</div>
      </template>

      <p class="muted">
        该页面会从 GitHub Releases 拉取桌面端与 Android 的最新发布产物。若你们使用私有仓库/自建发布页，请改为内部下载链接。
      </p>

      <div class="row">
        <div class="label">GitHub Repo</div>
        <div class="value">
          <code>{{ repo || '未配置（请设置 VITE_GITHUB_REPO=owner/repo）' }}</code>
        </div>
      </div>

      <el-divider />

      <el-alert
        v-if="!repo"
        type="warning"
        :closable="false"
        show-icon
        title="未配置 VITE_GITHUB_REPO"
        description="请在 Web 构建环境设置 VITE_GITHUB_REPO=owner/repo（例如 acme/work_order），然后重新构建部署。"
      />

      <div v-else>
        <el-skeleton :loading="loading" animated>
          <template #default>
            <div class="grid">
              <el-card class="subcard">
                <template #header>
                  <div class="cardTitle">桌面端（macOS / Windows）</div>
                </template>
                <ReleaseBlock :release="desktopRelease" kind="desktop" />
              </el-card>

              <el-card class="subcard">
                <template #header>
                  <div class="cardTitle">Android（APK / AAB）</div>
                </template>
                <ReleaseBlock :release="androidRelease" kind="android" />
              </el-card>
            </div>

            <el-alert
              v-if="error"
              type="error"
              :closable="false"
              show-icon
              title="获取 Releases 失败"
              :description="error"
              class="mt"
            />
          </template>
        </el-skeleton>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

type GithubReleaseAsset = {
  id: number
  name: string
  size: number
  browser_download_url: string
}

type GithubRelease = {
  id: number
  tag_name: string
  name: string | null
  html_url: string
  published_at: string | null
  assets: GithubReleaseAsset[]
}

const router = useRouter()

const repo = String(import.meta.env.VITE_GITHUB_REPO || '').trim()
const ownerRepo = computed(() => {
  const s = repo
  if (!s) return null
  const parts = s.split('/').map((p) => p.trim()).filter(Boolean)
  if (parts.length !== 2) return null
  return { owner: parts[0], repo: parts[1] }
})

const loading = ref(false)
const error = ref<string | null>(null)
const releases = ref<GithubRelease[]>([])

const desktopRelease = computed(() => {
  return releases.value.find((r) => /^v\d/.test(r.tag_name) && !r.tag_name.startsWith('android-v')) || null
})

const androidRelease = computed(() => {
  return releases.value.find((r) => r.tag_name.startsWith('android-v')) || null
})

function goHome() {
  router.push({ name: 'dashboard' })
}

function fmtDate(iso: string | null) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d)
}

function pickAssets(release: GithubRelease | null, kind: 'desktop' | 'android') {
  if (!release) return []
  const assets = release.assets || []
  const isDesktop = kind === 'desktop'
  const allowed = isDesktop
    ? (name: string) => /\.(dmg|msi|exe|zip|json|sig)$/i.test(name)
    : (name: string) => /\.(apk|aab)$/i.test(name)
  return assets
    .filter((a) => allowed(a.name))
    .sort((a, b) => a.name.localeCompare(b.name))
}

const ReleaseBlock = defineComponent({
  name: 'ReleaseBlock',
  props: {
    release: { type: Object as () => GithubRelease | null, required: true },
    kind: { type: String as () => 'desktop' | 'android', required: true }
  },
  setup(props) {
    return () => {
      if (!props.release) {
        return h('div', { class: 'muted' }, '未找到对应的 Release（请先推送 tag 触发发布工作流）。')
      }

      const r = props.release
      const assets = pickAssets(r, props.kind)

      return h('div', { class: 'release' }, [
        h('div', { class: 'row' }, [
          h('div', { class: 'label' }, 'Tag'),
          h('div', { class: 'value' }, h('code', r.tag_name))
        ]),
        h('div', { class: 'row' }, [
          h('div', { class: 'label' }, '发布时间'),
          h('div', { class: 'value' }, fmtDate(r.published_at))
        ]),
        h('div', { class: 'row' }, [
          h('div', { class: 'label' }, 'Release'),
          h('div', { class: 'value' }, h('a', { href: r.html_url, target: '_blank', rel: 'noreferrer' }, '打开 GitHub Release'))
        ]),
        h('div', { class: 'assetsTitle' }, '可下载文件'),
        assets.length
          ? h(
              'ul',
              { class: 'assets' },
              assets.map((a) =>
                h('li', { key: a.id }, [
                  h('a', { href: a.browser_download_url, target: '_blank', rel: 'noreferrer' }, a.name),
                  h('span', { class: 'muted small' }, `（${Math.round(a.size / 1024)} KB）`)
                ])
              )
            )
          : h('div', { class: 'muted' }, '未识别到安装包/产物文件（请检查 workflow 上传的 assets 命名）。')
      ])
    }
  }
})

async function loadReleases() {
  if (!ownerRepo.value) return
  loading.value = true
  error.value = null
  try {
    const { owner, repo: repoName } = ownerRepo.value
    const url = `https://api.github.com/repos/${owner}/${repoName}/releases?per_page=30`
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    }
    const data = (await res.json()) as GithubRelease[]
    releases.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadReleases()
})
</script>

<style scoped>
.page {
  padding: 16px;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.cardTitle {
  font-weight: 600;
}
.card {
  max-width: 980px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 960px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}
.subcard {
  height: 100%;
}
.row {
  display: flex;
  gap: 10px;
  align-items: baseline;
  margin: 6px 0;
}
.label {
  width: 90px;
  color: #666;
}
.value {
  flex: 1;
  word-break: break-word;
}
.muted {
  color: #666;
}
.small {
  margin-left: 6px;
  font-size: 12px;
}
.assetsTitle {
  margin-top: 10px;
  font-weight: 600;
}
.assets {
  margin: 8px 0 0;
  padding-left: 18px;
}
.mt {
  margin-top: 12px;
}
</style>

