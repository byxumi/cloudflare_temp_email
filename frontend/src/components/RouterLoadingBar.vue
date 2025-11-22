<script setup>
import { useLoadingBar } from 'naive-ui'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

// 必须在 n-loading-bar-provider 内部才能使用
const loadingBar = useLoadingBar()
const router = useRouter()

onMounted(() => {
  // 1. 开屏进度条 (模拟初始加载)
  loadingBar.start()
  window.addEventListener('load', () => {
    loadingBar.finish()
  })
  // 如果已经加载完，手动结束
  setTimeout(() => {
    loadingBar.finish()
  }, 800)

  // 2. 路由切换进度条
  router.beforeEach((to, from, next) => {
    loadingBar.start()
    next()
  })

  router.afterEach(() => {
    loadingBar.finish()
  })

  router.onError(() => {
    loadingBar.error()
  })
})
</script>

<template>
  <div style="display: none;"></div>
</template>
