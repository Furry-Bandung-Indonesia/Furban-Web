import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { useAuthStore } from '../stores/auth.js'

// Helper to handle lazy-load chunk failures (common after redeployments)
function lazyLoad(importFn) {
  return () => importFn().catch(() => {
    // Chunk failed to load (likely outdated after a new deployment)
    // Reload the page ONCE to get fresh assets — prevent infinite loop
    const key = '__chunk_reload__'
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      window.location.reload()
    } else {
      sessionStorage.removeItem(key)
      // Return empty component to avoid blank screen
      return { template: '<div class="flex items-center justify-center min-h-screen"><p class="text-white">Failed to load page. Please refresh.</p></div>' }
    }
  })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/blog',
      name: 'blog-list',
      component: lazyLoad(() => import('../views/Blog.vue'))
    },
    {
      path: '/blog/:id',
      name: 'blog-post',
      component: lazyLoad(() => import('../views/BlogPost.vue'))
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: lazyLoad(() => import('../views/Gallery.vue'))
    },
    {
      path: '/login',
      name: 'login',
      component: lazyLoad(() => import('../views/Login.vue'))
    },
    {
      path: '/privacy-policy',
      name: 'privacy-policy',
      component: lazyLoad(() => import('../views/PrivacyPolicy.vue'))
    },
    {
      path: '/terms-of-service',
      name: 'terms-of-service',
      component: lazyLoad(() => import('../views/TermsOfService.vue'))
    },
    {
      path: '/faq',
      name: 'faq',
      component: lazyLoad(() => import('../views/FAQ.vue'))
    },
    {
      path: '/register',
      name: 'register',
      component: lazyLoad(() => import('../views/Register.vue'))
    },
    {
      path: '/register/profile',
      name: 'register-profile',
      redirect: '/dashboard'  // Deprecated - profile completion now done in dashboard
    },
    // ═══════════════════════════════════════════════════
    // USER-ONLY ROUTES (no sidebar, just Navbar)
    // ═══════════════════════════════════════════════════
    {
      path: '/profile',
      name: 'user-profile',
      component: lazyLoad(() => import('../views/user/UserProfilePage.vue')),
      meta: { requiresAuth: true }
    },
    {
      path: '/tickets',
      name: 'user-tickets',
      component: lazyLoad(() => import('../views/user/UserTicketsPage.vue')),
      meta: { requiresAuth: true }
    },
    {
      path: '/purchases',
      name: 'user-purchases',
      component: lazyLoad(() => import('../views/user/UserPurchasesPage.vue')),
      meta: { requiresAuth: true }
    },
    // Dashboard Layout with nested routes
    {
      path: '/dashboard',
      component: lazyLoad(() => import('../views/DashboardLayout.vue')),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard-home',
          component: lazyLoad(() => import('../views/dashboard/DashboardHome.vue'))
        },
        {
          path: 'profile',
          name: 'dashboard-profile',
          component: lazyLoad(() => import('../views/dashboard/ManageProfile.vue'))
        },
        {
          path: 'blogs',
          name: 'dashboard-blogs',
          component: lazyLoad(() => import('../views/dashboard/ManageBlogs.vue')),
          meta: { allowedRoles: ['admin', 'publisher'] }
        },
        {
          path: 'photos',
          name: 'dashboard-photos',
          component: lazyLoad(() => import('../views/dashboard/ManagePhotos.vue')),
          meta: { allowedRoles: ['admin', 'photographer'] }
        },
        {
          path: 'users',
          name: 'dashboard-users',
          component: lazyLoad(() => import('../views/dashboard/ManageUsers.vue')),
          meta: { allowedRoles: ['admin'] }
        },

      ]
    },
    // Legacy route redirects
    {
      path: '/manage-profile',
      redirect: '/dashboard/profile'
    },
    {
      path: '/manage-blogs',
      redirect: '/dashboard/blogs'
    },
    {
      path: '/manage-photos',
      redirect: '/dashboard/photos'
    },
    {
      path: '/manage-users',
      redirect: '/dashboard/users'
    },
    // ═══════════════════════════════════════════════════
    // TICKETING ROUTES
    // ═══════════════════════════════════════════════════
    {
      path: '/event',
      name: 'ticket-events',
      component: lazyLoad(() => import('../views/ticket/EventListing.vue')),
      meta: { isTicketPage: true }
    },
    {
      path: '/event/id/:eventId',
      name: 'ticket-event-detail',
      component: lazyLoad(() => import('../views/ticket/EventDetail.vue')),
      meta: { isTicketPage: true }
    },
    {
      path: '/event/ticket/:ticketId/fill',
      name: 'ticket-fill-info',
      component: lazyLoad(() => import('../views/ticket/TicketClaim.vue')),
      meta: { requiresAuth: true, isTicketPage: true }
    },
    {
      path: '/event/payment/:ticketId',
      name: 'ticket-payment',
      component: lazyLoad(() => import('../views/ticket/TicketPayment.vue')),
      meta: { requiresAuth: true, isTicketPage: true }
    },
    {
      path: '/event/ticket/:ticketId',
      name: 'ticket-detail',
      component: lazyLoad(() => import('../views/ticket/TicketDetail.vue')),
      meta: { requiresAuth: true, isTicketPage: true }
    },
    {
      path: '/event/history',
      redirect: '/purchases'
    },
    // ═══════════════════════════════════════════════════
    // EVENT MANAGEMENT (ADMIN / HOST) ROUTES
    // ═══════════════════════════════════════════════════
    {
      path: '/event/manage',
      component: lazyLoad(() => import('../views/ticket/manage/ManageLayout.vue')),
      meta: { requiresAuth: true, isTicketPage: true },
      children: [
        {
          path: '',
          name: 'manage-events',
          component: lazyLoad(() => import('../views/ticket/manage/AdminEventDashboard.vue')),
        },
        {
          path: ':eventId',
          name: 'manage-event-config',
          component: lazyLoad(() => import('../views/ticket/manage/EventConfigPanel.vue')),
        },
        {
          path: ':eventId/attendees',
          name: 'manage-event-attendees',
          component: lazyLoad(() => import('../views/ticket/manage/AttendeeManagement.vue')),
        },
        {
          path: ':eventId/checkin',
          name: 'manage-event-checkin',
          component: lazyLoad(() => import('../views/ticket/manage/CheckInScanner.vue')),
        },
        {
          path: ':eventId/moderation',
          name: 'manage-event-moderation',
          component: lazyLoad(() => import('../views/ticket/manage/ModerationDashboard.vue')),
        },
        {
          path: ':eventId/hosts',
          name: 'manage-event-hosts',
          component: lazyLoad(() => import('../views/ticket/manage/HostPermissions.vue')),
        },
        {
          path: ':eventId/payment',
          name: 'manage-event-payment',
          component: lazyLoad(() => import('../views/ticket/manage/PaymentGateway.vue')),
        },
        {
          path: ':eventId/financials',
          name: 'manage-event-financials',
          component: lazyLoad(() => import('../views/ticket/manage/EventFinancials.vue')),
        },
        {
          path: ':eventId/voucher',
          name: 'manage-event-vouchers',
          component: lazyLoad(() => import('../views/ticket/manage/VoucherManagement.vue')),
        },
      ],
    },
    // Legacy redirects
    {
      path: '/admin',
      redirect: '/dashboard'
    },
    {
      path: '/photographer',
      redirect: '/dashboard'
    },
    {
      path: '/publisher',
      redirect: '/dashboard'
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    return { top: 0 }
  }
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Routes that require authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Try to restore auth state
      await authStore.initializeAuth()

      if (!authStore.isAuthenticated) {
        // Save intended destination so we can redirect back after login
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
    }

    // Verify token is still valid
    const isValid = await authStore.checkAuth()
    if (!isValid) {
      next('/login')
      return
    }

    // Check role-based access
    if (to.meta.allowedRoles && to.meta.allowedRoles.length > 0) {
      const userRole = authStore.user?.role
      if (!userRole || !to.meta.allowedRoles.includes(userRole)) {
        // Redirect to appropriate page based on role
        next(userRole === 'user' ? '/profile' : '/dashboard')
        return
      }
    }

    // Regular users should not access /dashboard — redirect to /profile
    if (to.path.startsWith('/dashboard') && authStore.user?.role === 'user') {
      next('/profile')
      return
    }
  }

  // Redirect authenticated users away from login/register
  if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    // If there's a redirect query, go there instead
    const redirect = to.query.redirect
    if (redirect && typeof redirect === 'string' && redirect.startsWith('/')) {
      next(redirect)
    } else {
      next('/')
    }
    return
  }

  next()
})

export default router
