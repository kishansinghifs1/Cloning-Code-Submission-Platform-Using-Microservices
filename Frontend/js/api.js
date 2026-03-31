// API wrapper with automatic auth headers and token refresh on 401

const API = {
    buildFallbackUrls(url) {
        try {
            const parsed = new URL(url);
            const candidates = [];

            if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
                const sameProtocolLocalhost = new URL(url);
                sameProtocolLocalhost.hostname = 'localhost';
                candidates.push(sameProtocolLocalhost.toString());
            }

            const httpLocalhost = new URL(url);
            httpLocalhost.protocol = 'http:';
            httpLocalhost.hostname = 'localhost';
            const httpLocalhostUrl = httpLocalhost.toString();
            if (httpLocalhostUrl !== url && !candidates.includes(httpLocalhostUrl)) {
                candidates.push(httpLocalhostUrl);
            }

            return candidates;
        } catch (error) {
            return [];
        }
    },

    async parseJsonSafe(res) {
        const raw = await res.text();
        if (!raw) return {};
        try {
            return JSON.parse(raw);
        } catch (error) {
            throw new Error('Service returned an invalid response.');
        }
    },

    async request(url, options = {}) {
        const token = Auth.getAccessToken();
        const headers = {
            ...(options.headers || {})
        };
        
        // Only set default Content-Type if it hasn't been explicitly set to null
        if (options.headers && options.headers['Content-Type'] === null) {
            delete headers['Content-Type'];
        } else if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        let res;
        try {
            res = await fetch(url, { ...options, headers });
        } catch (networkError) {
            const fallbackUrls = this.buildFallbackUrls(url);
            let lastError = networkError;
            let fetched = false;

            for (const fallbackUrl of fallbackUrls) {
                try {
                    res = await fetch(fallbackUrl, { ...options, headers });
                    fetched = true;
                    break;
                } catch (fallbackError) {
                    lastError = fallbackError;
                }
            }

            if (!fetched) {
                throw lastError;
            }
        }

        // If 401, try refreshing the token and retry once
        if (res.status === 401 && Auth.getRefreshToken()) {
            const newToken = await Auth.refreshAccessToken();
            if (newToken) {
                headers['Authorization'] = 'Bearer ' + newToken;
                try {
                    res = await fetch(url, { ...options, headers });
                } catch (networkError) {
                    const fallbackUrls = this.buildFallbackUrls(url);
                    let lastError = networkError;
                    let fetched = false;

                    for (const fallbackUrl of fallbackUrls) {
                        try {
                            res = await fetch(fallbackUrl, { ...options, headers });
                            fetched = true;
                            break;
                        } catch (fallbackError) {
                            lastError = fallbackError;
                        }
                    }

                    if (!fetched) {
                        throw lastError;
                    }
                }
            }
        }

        return this.parseJsonSafe(res);
    },

    get(url) {
        return this.request(url, { method: 'GET' });
    },

    post(url, body) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    upload(url, formData) {
        return this.request(url, {
            method: 'POST',
            headers: { 'Content-Type': null }, 
            body: formData
        });
    },

    put(url, body) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
};
