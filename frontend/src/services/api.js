import config from '../config/api';

/**
 * API Service
 * Handles all content-related API calls to the main backend service
 * NOTE: Auth operations have been moved to authApi.js (backend-auth service)
 */
class ApiService {
    constructor() {
        this.baseURL = config.baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = localStorage.getItem('authToken');

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(error.message || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    // ========================================
    // Dashboard & Admin (Content Management Only)
    // NOTE: User management is now in authApi.js
    // ========================================

    async getDashboard(queryString = '') {
        return this.request(`${config.endpoints.admin}/dashboard${queryString}`);
    }

    async getMyStats() {
        return this.request('/my/stats');
    }

    async getApprovalHistory() {
        return this.request(`${config.endpoints.admin}/approvals`);
    }

    async getUserContent(userId) {
        return this.request(`${config.endpoints.admin}/user/${userId}/content`);
    }

    // ========================================
    // Blogs
    // ========================================

    async getBlogs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${config.endpoints.blogs}?${queryString}` : config.endpoints.blogs;
        return this.request(url);
    }

    async getBlog(slug) {
        return this.request(`${config.endpoints.blogs}/${slug}`);
    }

    async getMyBlogs() {
        return this.request(config.endpoints.blogs + '/my/blogs');
    }

    async getAllBlogs() {
        return this.request(config.endpoints.blogs + '/all');
    }

    async getRecentBlogs(limit = 4) {
        return this.getBlogs({ limit, sort: 'desc' });
    }

    async createBlog(formData) {
        const url = `${this.baseURL}${config.endpoints.blogs}`;
        const token = localStorage.getItem('authToken');

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...headers,
                ...(formData instanceof FormData ? {} : { 'Content-Type': 'application/json' })
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(error.message || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    async updateBlog(id, blogData) {
        const url = `${this.baseURL}${config.endpoints.blogs}/${id}`;
        const token = localStorage.getItem('authToken');

        const headers = {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        if (!(blogData instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers,
            body: blogData instanceof FormData ? blogData : JSON.stringify(blogData)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(error.message || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    async deleteBlog(id) {
        return this.request(`${config.endpoints.blogs}/${id}`, {
            method: 'DELETE'
        });
    }

    async updateBlogStatus(id, status, reason = null) {
        return this.request(`${config.endpoints.admin}/blogs/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, reason })
        });
    }

    // ========================================
    // Gallery / Photos
    // ========================================

    async getGallery(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${config.endpoints.gallery}?${queryString}` : config.endpoints.gallery;
        return this.request(url);
    }

    async getPhoto(id) {
        return this.request(`${config.endpoints.gallery}/${id}`);
    }

    async getMyPhotos() {
        return this.request(config.endpoints.gallery + '/my/photos');
    }

    async getAllPhotos() {
        return this.request(config.endpoints.gallery + '/all');
    }

    async getFeaturedGallery(limit = 8) {
        return this.getGallery({ limit });
    }

    async getGalleryAlbums() {
        return [];
    }

    async getGalleryByAlbum(album) {
        return this.getGallery({ album });
    }

    async uploadPhoto(formData) {
        const url = `${this.baseURL}${config.endpoints.gallery}`;
        const token = localStorage.getItem('authToken');

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Upload failed' }));
            throw new Error(error.message || `Upload failed with status ${response.status}`);
        }

        return response.json();
    }

    async updatePhoto(id, photoData) {
        const url = `${this.baseURL}${config.endpoints.gallery}/${id}`;
        const token = localStorage.getItem('authToken');

        const headers = {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        if (!(photoData instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers,
            body: photoData instanceof FormData ? photoData : JSON.stringify(photoData)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(error.message || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    async deletePhoto(id) {
        return this.request(`${config.endpoints.gallery}/${id}`, {
            method: 'DELETE'
        });
    }

    async updatePhotoStatus(id, status, reason = null) {
        return this.request(`${config.endpoints.admin}/photos/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, reason })
        });
    }

    // Convenience wrappers for approve/reject
    async approvePhoto(id) {
        return this.updatePhotoStatus(id, 'approved');
    }

    async rejectPhoto(id, reason) {
        return this.updatePhotoStatus(id, 'rejected', reason);
    }

    async approveBlog(id) {
        return this.updateBlogStatus(id, 'approved');
    }

    async rejectBlog(id, reason) {
        return this.updateBlogStatus(id, 'rejected', reason);
    }

    // ========================================
    // Pending Content (Admin)
    // ========================================

    async getPendingPhotos() {
        return this.request(`${config.endpoints.admin}/pending/photos`);
    }

    async getPendingBlogs() {
        return this.request(`${config.endpoints.admin}/pending/blogs`);
    }

    async getAdminPhotos() {
        return this.request(`${config.endpoints.admin}/photos`);
    }

    async getAdminBlogs() {
        return this.request(`${config.endpoints.admin}/blogs`);
    }
}

export default ApiService;
