// Realtime transport manager for socket events with graceful degradation.

(function initRealtime() {
    const listeners = new Set();
    let socket = null;
    let currentUserId = null;
    let reconnectTimer = null;
    let reconnectAttempt = 0;

    function notify(event, payload) {
        listeners.forEach((listener) => {
            try {
                listener(event, payload);
            } catch (_error) {
                // Listener errors should not break realtime flow.
            }
        });
    }

    function canUseSocket() {
        return typeof window.io === 'function' && !!(window.CONFIG && window.CONFIG.SOCKET_URL);
    }

    function bindUser() {
        if (socket && socket.connected && currentUserId) {
            socket.emit('setUserId', currentUserId);
        }
    }

    function clearReconnect() {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    }

    function scheduleReconnect() {
        clearReconnect();

        if (!currentUserId || !canUseSocket()) return;

        reconnectAttempt += 1;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempt - 1), 10000);

        reconnectTimer = setTimeout(() => {
            connect(currentUserId);
        }, delay);
    }

    function teardownSocket() {
        if (!socket) return;

        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('submissionPayloadResponse');
        socket.disconnect();
        socket = null;
    }

    function connect(userId) {
        if (userId) {
            currentUserId = userId;
        }

        if (!currentUserId) {
            return null;
        }

        if (!canUseSocket()) {
            notify('disabled', { reason: 'socket-unavailable' });
            return null;
        }

        if (socket && socket.connected) {
            bindUser();
            return socket;
        }

        teardownSocket();

        socket = window.io(window.CONFIG.SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: false,
            timeout: 8000
        });

        socket.on('connect', () => {
            reconnectAttempt = 0;
            clearReconnect();
            bindUser();
            notify('connected', { userId: currentUserId });
        });

        socket.on('disconnect', (reason) => {
            notify('disconnected', { reason });
            scheduleReconnect();
        });

        socket.on('connect_error', (error) => {
            notify('error', { message: error && error.message ? error.message : 'connect_error' });
            scheduleReconnect();
        });

        socket.on('submissionPayloadResponse', (payload) => {
            notify('submission', payload);
        });

        return socket;
    }

    function disconnect() {
        clearReconnect();
        reconnectAttempt = 0;
        teardownSocket();
    }

    function subscribe(listener) {
        listeners.add(listener);
        return function unsubscribe() {
            listeners.delete(listener);
        };
    }

    window.Realtime = {
        connect,
        disconnect,
        subscribe,
        isConnected: function isConnected() {
            return !!(socket && socket.connected);
        }
    };
})();
