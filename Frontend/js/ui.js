// Toast notification helper

function showToast(message, type = '') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' toast-' + type : '');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Update navbar based on login state
function updateNav() {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    if (Auth.isLoggedIn()) {
        const user = Auth.getUser();
        navLinks.innerHTML = `
            <a href="/pages/problems.html">Problems</a>
            <a href="/pages/submissions.html">Submissions</a>
            <a href="/pages/profile.html" class="nav-profile-link">
                <img src="${user ? (user.avatarUrl || '/images/default-avatar.png') : '/images/default-avatar.png'}" class="nav-avatar" alt="Profile">
                <span>${user ? user.username : 'Profile'}</span>
            </a>
            <a href="#" onclick="Auth.logout(); return false;">Logout</a>
        `;
    } else {
        navLinks.innerHTML = `
            <a href="/pages/login.html">Login</a>
            <a href="/pages/register.html">Register</a>
        `;
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateNav);
