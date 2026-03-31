// Authentication helpers - token management

const Auth = {
    getAccessToken() {
        return localStorage.getItem('accessToken');
    },

    getRefreshToken() {
        return localStorage.getItem('refreshToken');
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    setTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
    },

    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    clear() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    isLoggedIn() {
        return !!this.getAccessToken();
    },

    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = '/pages/login.html';
            return false;
        }
        return true;
    },

    logout() {
        this.clear();
        window.location.href = '/pages/login.html';
    },

    // Try to refresh the access token
    async refreshAccessToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            this.logout();
            return null;
        }
        try {
            const res = await fetch(CONFIG.USER_SERVICE_URL + '/users/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
            const data = await res.json();
            if (data.success) {
                this.setTokens(data.data.accessToken);
                return data.data.accessToken;
            } else {
                this.logout();
                return null;
            }
        } catch (err) {
            this.logout();
            return null;
        }
    }
};
