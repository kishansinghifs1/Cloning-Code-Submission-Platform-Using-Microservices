// API Base URLs
// Uses current browser hostname so it works from localhost and LAN URLs.
(function initConfig() {
    const origin = window.location.origin || 'http://localhost:5500';

    window.CONFIG = {
        USER_SERVICE_URL: `${origin}/proxy/user/api/v1`,
        PROBLEM_SERVICE_URL: `${origin}/proxy/problem/api/v1`,
        SUBMISSION_SERVICE_URL: `${origin}/proxy/submission/api/v1`,
        SOCKET_URL: `${origin}/proxy/socket`
    };
})();
