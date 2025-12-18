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
  
  // 检查是否在生成过程中（stage 不是 'input' 就表示在生成过程中）
  const isGenerating = store.stage !== 'input'
  
  if (isGenerating) {
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

