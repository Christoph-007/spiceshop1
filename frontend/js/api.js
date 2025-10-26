// Frontend API service (use relative path so frontend works when served from backend)
const API_BASE_URL = '/api';

// Utility function to handle API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const config = {
        method,
        headers,
        ...(data && { body: JSON.stringify(data) })
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API call failed');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth Service
const authService = {
    async login(email, password) {
        const response = await apiCall('/auth/login', 'POST', { email, password });
        localStorage.setItem('token', response.token);
        return response;
    },

    async register(userData) {
        const response = await apiCall('/auth/register', 'POST', userData);
        localStorage.setItem('token', response.token);
        return response;
    },

    logout() {
        localStorage.removeItem('token');
    }
};

// Customer Service
const customerService = {
    async getProducts(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return await apiCall(`/products?${queryString}`);
    },

    async getProfile() {
        return await apiCall('/users/me/profile');
    },

    async updateProfile(data) {
        return await apiCall('/users/me/profile', 'PUT', data);
    },

    async getCart() {
        return await apiCall('/users/me/cart');
    },

    async addToCart(productId, quantity) {
        return await apiCall('/users/me/cart', 'POST', { productId, quantity });
    },

    async placeOrder(orderData) {
        return await apiCall('/orders', 'POST', orderData);
    }
};

// Merchant Service
const merchantService = {
    async getProducts() {
        return await apiCall('/merchant/products');
    },

    async addProduct(productData) {
        return await apiCall('/merchant/products', 'POST', productData);
    },

    async updateProduct(productId, productData) {
        return await apiCall(`/merchant/products/${productId}`, 'PUT', productData);
    },

    async deleteProduct(productId) {
        return await apiCall(`/merchant/products/${productId}`, 'DELETE');
    },

    async getSalesAnalytics(startDate, endDate) {
        const query = new URLSearchParams({ start: startDate, end: endDate }).toString();
        return await apiCall(`/merchant/analytics/sales?${query}`);
    }
};

// Admin Service
const adminService = {
    async getMerchants(status) {
        return await apiCall(`/admin/merchants${status ? `?status=${status}` : ''}`);
    },

    async approveMerchant(merchantId) {
        return await apiCall(`/admin/merchants/${merchantId}/approve`, 'PUT');
    },

    async getAnalytics() {
        return await apiCall('/admin/analytics/sales');
    }
};

// Add delete merchant helper
adminService.deleteMerchant = async function(merchantId) {
    return await apiCall(`/admin/merchants/${merchantId}`, 'DELETE');
};