// Admin check for header and pages
function updateHeaderAuth() {
    const user = JSON.parse(localStorage.getItem('user'));

    // Show/hide admin-only elements
    const addProductLink = document.getElementById('add-product-link');
    if (addProductLink && user && user.isAdmin) {
        addProductLink.style.display = 'flex';
    }
}

// Check if user is admin, if not redirect to index
function requireAdmin() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.isAdmin) {
        alert('Bu sayfaya erişim yetkiniz yok. Admin girişi gerekli.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Auto-run on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        updateHeaderAuth();
    });
}
