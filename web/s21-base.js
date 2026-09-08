(function (global) {
    function detectBase() {
        const path = global.location.pathname || '/';
        const match = path.match(/^(.*\/)(?:[^/]+\.html)?$/);
        if (match) return match[1];
        return path.endsWith('/') ? path : `${path}/`;
    }

    global.S21_BASE = detectBase();
    global.S21_SERVER_AVAILABLE = false;

    global.s21Url = function s21Url(path) {
        const clean = String(path || '').replace(/^\//, '');
        return `${global.S21_BASE}${clean}`;
    };
})(window);
