import { computed, onMounted, onUnmounted, ref } from 'vue'

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

  return {
    width,
    isMobile
  }
}

