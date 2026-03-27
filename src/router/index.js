import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const withAdminMeta = (title) => ({
  requiresAuth: true,
  requiresAdmin: true,
  title
})

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: 'Kirish' }
  },
  {
    path: '/',
    component: () => import('@/components/ui/layout/Layout.vue'),
    meta: withAdminMeta('Dashboard'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: withAdminMeta('Dashboard')
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UsersList.vue'),
        meta: withAdminMeta('Foydalanuvchilar')
      },
      {
        path: 'zones',
        name: 'Zones',
        component: () => import('@/views/zones/ZonesView.vue'),
        meta: withAdminMeta('Zonalar')
      },
      {
        path: 'computers',
        name: 'Computers',
        component: () => import('@/views/computers/ComputersList.vue'),
        meta: withAdminMeta('Kompyuterlar')
      },
      {
        path: 'tariffs',
        name: 'Tariffs',
        component: () => import('@/views/tariffs/TariffsView.vue'),
        meta: withAdminMeta('Tariflar')
      },
      {
        path: 'sessions',
        name: 'Sessions',
        component: () => import('@/views/sessions/ActiveSessions.vue'),
        meta: withAdminMeta('Sessiyalar')
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: () => import('@/views/transactions/TransactionsView.vue'),
        meta: withAdminMeta('Tranzaksiyalar')
      },
      {
        path: 'bookings',
        name: 'Bookings',
        component: () => import('@/views/bookings/BookingsView.vue'),
        meta: withAdminMeta('Bronlar')
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/reports/ReportsView.vue'),
        meta: withAdminMeta('Hisobotlar')
      },
      {
        path: 'realtime',
        name: 'Realtime',
        component: () => import('@/views/realtime/WebSocketView.vue'),
        meta: withAdminMeta('Realtime')
      }
    ]
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/users/UserProfile.vue'),
    meta: {
      requiresAuth: true,
      requiresUser: true,
      title: 'Profil'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = Boolean(authStore.accessToken)
  const isAdmin = Boolean(authStore.isAdmin)

  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
    return
  }

  if (to.meta.requiresAdmin && !isAdmin) {
    next('/profile')
    return
  }

  if (to.meta.requiresUser && isAdmin) {
    next('/')
    return
  }

  if (to.path === '/login' && isLoggedIn) {
    next(isAdmin ? '/' : '/profile')
    return
  }

  next()
})

export default router
