import { computed, onMounted, onUnmounted, ref } from 'vue'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const breakpoints = {
  xs: 480,
  sm: 768,
  md: 1024,
  lg: 1280,
  xl: 1920
} as const

export function useBreakpoints() {
  const width = ref(typeof window === 'undefined' ? 1024 : window.innerWidth)

  const update = () => {
    width.value = window.innerWidth
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  const isMobile = computed(() => width.value < 768)
  const isTablet = computed(() => width.value >= breakpoints.sm && width.value < breakpoints.md)
  const isDesktop = computed(() => width.value >= breakpoints.md)
  const current = computed<BreakpointName>(() => {
    const w = width.value
    if (w < breakpoints.xs) return 'xs'
    if (w < breakpoints.sm) return 'sm'
    if (w < breakpoints.md) return 'md'
    if (w < breakpoints.lg) return 'lg'
    return 'xl'
  })

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    current
  }
}
