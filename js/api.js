// API Helper Functions
async function apiCall(endpoint, options = {}) {
    const token = getToken();
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API
async function login(email, password) {
    return apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

async function register(nome, email, password) {
    return apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nome, email, password }),
    });
}

// Products API
async function getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/products${query ? `?${query}` : ''}`);
}

async function createProduct(productData) {
    return apiCall('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
    });
}

async function updateProduct(id, productData) {
    return apiCall(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
    });
}

async function deleteProduct(id) {
    return apiCall(`/products/${id}`, {
        method: 'DELETE',
    });
}

async function toggleProductAvailability(id) {
    return apiCall(`/products/${id}/toggle-disponibilidade`, {
        method: 'PATCH',
    });
}

// Orders API
async function getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/orders${query ? `?${query}` : ''}`);
}

async function getOrder(id) {
    return apiCall(`/orders/${id}`);
}

async function updateOrderStatus(id, statusPedido) {
    return apiCall(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ statusPedido }),
    });
}

async function confirmPixAdmin(id) {
    return apiCall(`/orders/${id}/confirmar-pix-admin`, {
        method: 'PATCH',
    });
}

async function rejectPix(id) {
    return apiCall(`/orders/${id}/recusar-pix`, {
        method: 'PATCH',
    });
}

async function cancelOrder(id) {
    return apiCall(`/orders/${id}`, {
        method: 'DELETE',
    });
}

// Settings API
async function getSettings() {
    return apiCall('/settings');
}

async function updateSettings(settingsData) {
    return apiCall('/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsData),
    });
}
