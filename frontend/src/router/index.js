import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { useAuthStore } from '../stores/auth.js'

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
      component: () => import('../views/Blog.vue')
    },
    {
      path: '/blog/:id',
      name: 'blog-post',
      component: () => import('../views/BlogPost.vue')
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('../views/Gallery.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue')
    },
    {
      path: '/register/profile',
      name: 'register-profile',
      redirect: '/dashboard'  // Deprecated - profile completion now done in dashboard
    },
    {
      path: '/profile',
      name: 'profile',
      redirect: '/manage-profile'  // Redirect to new route
    },
    // Dashboard Layout with nested routes - each page loads its own data
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard-home',
          component: () => import('../views/dashboard/DashboardHome.vue')
        }
      ]
    },
    {
      path: '/manage-profile',
      name: 'manage-profile',
      component: () => import('../views/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          component: () => import('../views/dashboard/ManageProfile.vue')
        }
      ]
    },
    {
      path: '/manage-blogs',
      name: 'manage-blogs',
      component: () => import('../views/DashboardLayout.vue'),
      meta: { 
        requiresAuth: true, 
        allowedRoles: ['admin', 'publisher'] 
      },
      children: [
        {
          path: '',
          component: () => import('../views/dashboard/ManageBlogs.vue')
        }
      ]
    },
    {
      path: '/manage-photos',
      name: 'manage-photos',
      component: () => import('../views/DashboardLayout.vue'),
      meta: { 
        requiresAuth: true, 
        allowedRoles: ['admin', 'photographer'] 
      },
      children: [
        {
          path: '',
          component: () => import('../views/dashboard/ManagePhotos.vue')
        }
      ]
    },
    {
      path: '/manage-users',
      name: 'manage-users',
      component: () => import('../views/DashboardLayout.vue'),
      meta: { 
        requiresAuth: true, 
        allowedRoles: ['admin'] 
      },
      children: [
        {
          path: '',
          component: () => import('../views/dashboard/ManageUsers.vue')
        }
      ]
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
        next('/login')
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
        // Redirect to dashboard if user doesn't have permission
        next('/dashboard')
        return
      }
    }
  }

  // Redirect authenticated users away from login/register
  if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

export default router
