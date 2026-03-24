import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '',
      name: 'home',
      component: () => import('@/views/Home.vue'),
    },
    {
      path: '/tools',
      children: [
        {
          path: 'cron-generator',
          name: 'CronGen',
          component: () => import('@/views/CronGenerator.vue'),
        },
      ],
    },
    {
      path: '/inquiry',
      name: 'inquiry',
      component: () => import('@/views/Inquiry.vue'),
    },
  ],
})

export default router
