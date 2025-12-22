import { createRouter, createWebHistory } from 'vue-router'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HistoryView from '../views/HistoryView.vue'
import SettingsView from '../views/SettingsView.vue'
import OutlineView from '../views/OutlineView.vue'
import GenerateView from '../views/GenerateView.vue'
import ResultView from '../views/ResultView.vue'
import PromptGenerateView from '../views/PromptGenerateView.vue'
import { useTextGeneratorStore } from '../stores/textGenerator'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/text-outline',
      name: 'text-outline',
      component: OutlineView
    },
    {
      path: '/text-generate',
      name: 'text-generate',
      component: GenerateView
    },
    {
      path: '/text-result',
      name: 'text-result',
      component: ResultView
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    },
    {
      path: '/prompt-generate',
      name: 'prompt-generate',
      component: PromptGenerateView
    }
  ]
})

// 受保护的路由（生成过程中不能访问的路由）
const protectedRoutes = ['/', '/history', '/settings', '/prompt-generate']

// 生成流程路由（生成过程中可以访问的路由）
const generationFlowRoutes = ['/text-outline', '/text-generate', '/text-result']

router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const store = useTextGeneratorStore()
  
  // 检查是否在图片生成过程中（需要路由守卫保护）
  // 1. 大纲阶段（stage === 'outline'）：允许自由导航，内容已保存在localStorage中，用户可以查看历史记录等
  // 2. 图片生成过程中（progress.status === 'generating'）：需要保护，阻止导航到受保护的路由
  // 3. 生成完成后（stage === 'result' 且 progress.status === 'done'）：允许自由导航
  const isActuallyGenerating = store.progress.status === 'generating'
  
  // 生成已完成，允许自由导航
  const isCompleted = store.stage === 'result' && store.progress.status === 'done'
  
  // 如果生成已完成，允许自由导航
  if (isCompleted) {
    store.hideNavigationGuardModal()
    next()
    return
  }
  
  // 关键修复：如果所有图片都已完成（成功或失败），即使状态还是 generating，也允许导航
  // 这解决了生图失败后状态未更新导致的死循环问题
  if (isActuallyGenerating && store.areAllImagesFinished) {
    console.log('🔓 [路由守卫] 检测到所有图片已完成，允许导航（修复死循环）')
    // 如果状态还是 generating，强制更新为 done
    if (store.progress.status === 'generating') {
      const taskId = 'task_' + Date.now()
      store.finishGeneration(taskId)
    }
    store.hideNavigationGuardModal()
    next()
    return
  }
  
  // 只有在图片生成过程中才阻止导航
  if (isActuallyGenerating) {
    // 如果在生成过程中，检查目标路由
    // 允许访问生成流程路由（即使正在生成中）
    if (generationFlowRoutes.includes(to.path)) {
      // 隐藏导航守卫提示（如果正在显示）
      store.hideNavigationGuardModal()
      next()
      return
    }
    
    // 如果是受保护的路由，阻止导航并显示提示
    if (protectedRoutes.includes(to.path)) {
      store.showNavigationGuardModal()
      // 阻止导航，保持在当前页面
      next(false)
      return
    }
  }
  
  // 不在生成过程中或目标路由不受保护，正常导航
  // 隐藏导航守卫提示（如果正在显示）
  store.hideNavigationGuardModal()
  next()
})

export default router

