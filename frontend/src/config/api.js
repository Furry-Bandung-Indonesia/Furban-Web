const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';
const AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:8788';

/**
 * Get the full URL for an auth service image (avatars)
 * @param {string} path - The image path (e.g., /images/avatars/...)
 * @returns {string} The full URL
 */
export function getAuthImageUrl(path) {
  if (!path) return null;
  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Prepend auth service URL
  return `${AUTH_API_BASE_URL}${path}`;
}

/**
 * Get the full URL for a main backend image (photos, blogs)
 * @param {string} path - The image path (e.g., /images/photos/...)
 * @returns {string} The full URL
 */
export function getImageUrl(path) {
  if (!path) return null;
  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Prepend main backend URL
  return `${API_BASE_URL}${path}`;
}

export default {
  rootURL: API_BASE_URL,
  baseURL: `${API_BASE_URL}/api`,
  authURL: AUTH_API_BASE_URL,
  endpoints: {
    // Auth endpoints (backend-auth service)
    auth: '/auth',
    authRegister: '/auth/register',
    authRegisterProfile: '/auth/register/profile',
    authLogin: '/auth/login',
    authLogout: '/auth/logout',
    authRefresh: '/auth/refresh',
    authMe: '/auth/me',
    authMePassword: '/auth/me/password',
    authMeAvatar: '/auth/me/avatar',
    authWhyLegalName: '/auth/why-legal-name',
    authAdminUsers: '/auth/admin/users',
    authAdminStats: '/auth/admin/stats',
    
    // Content endpoints (main backend)
    blogs: '/blogs',
    gallery: '/photos',
    admin: '/admin'
  }
}