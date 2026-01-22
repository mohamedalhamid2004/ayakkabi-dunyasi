// Auto-detect environment: use current host in production, localhost in development
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_URL = isLocalhost ? 'http://localhost:3000' : window.location.origin;

const API_URL = `${BASE_URL}/api/products`;
const AUTH_URL = `${BASE_URL}/api`;

document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;

    updateHeaderAuth();
    updateCartBadge();
    // Admin controls removed - no edit/delete buttons on products


    // Hamburger Menu Tıklanınca Filter Sidebar Aç
    const hamburgerBtn = document.getElementById('hamburger-menu');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFilterSidebar();
        });
    }

    // Sepet Butonu Tıklanınca Sidebar Aç
    const cartBtn = document.getElementById('cart-btn-header');
    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSidebar();
        });
    }

    // Floating Cart Button Listener
    const floatingCartBtn = document.getElementById('floating-cart-btn');
    if (floatingCartBtn) {
        floatingCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSidebar();
        });
    }

    // --- ANASAYFA ---
    // --- ANASAYFA ---
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        loadAllProducts();

        // Search functionality
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        const searchCategory = document.getElementById('search-category');

        if (searchBtn && searchInput) {
            // Click search button
            searchBtn.addEventListener('click', () => {
                performSearch();
            });

            // Press Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });

            // Category dropdown change - re-filter with current search term
            if (searchCategory) {
                searchCategory.addEventListener('change', () => {
                    performSearch();
                });
            }
        }
    }

    // --- ÖDEME SAYFASI ---
    if (path.includes('payment.html')) {
        const params = new URLSearchParams(window.location.search);
        let total = 0;

        // AUTH & PRE-FILL
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            // Fetch fresh address
            try {
                const uRes = await fetch(`${AUTH_URL}/users/${user.id}`);
                const uData = await uRes.json();

                if (uData.address) document.getElementById('payment-address').value = uData.address;
                if (uData.username) document.getElementById('payment-name').value = uData.username;
                if (uData.phone) document.getElementById('payment-phone').value = uData.phone;
                if (uData.city) document.getElementById('payment-city').value = uData.city;
                if (uData.district) document.getElementById('payment-district').value = uData.district;

                // Store for Submit usage
                window.currentPaymentUser = uData;

                const displayEl = document.getElementById('address-display');
                if (displayEl) {
                    if (uData.address && uData.city && uData.district && uData.phone) {
                        displayEl.innerHTML = `
                            <strong>${uData.username || 'Kullanıcı'}</strong><br>
                            ${uData.address}<br>
                            ${uData.district} / ${uData.city}<br>
                            ${uData.phone}
                        `;
                    } else {
                        displayEl.innerHTML = '<em>Teslimat adresi eksik.</em>';
                        const warning = document.getElementById('missing-address-warning');
                        if (warning) warning.style.display = 'block';
                    }
                }
            } catch (e) {
                // console.error(e); 
            }
        }

        if (params.get('price')) {
            total = parseFloat(params.get('price'));
            const summary = document.getElementById('summary-items');
            if (summary) summary.innerHTML = `<div style="display:flex; justify-content:space-between;"><span>${params.get('name')}</span><span>${total} TL</span></div>`;
        } else {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const summary = document.getElementById('summary-items');
            cart.forEach(item => {
                total += item.price;
                if (summary) summary.innerHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>${item.name}</span><span>${item.price} TL</span></div>`;
            });
        }

        const totalEl = document.getElementById('pay-total');
        if (totalEl) totalEl.textContent = total + ' TL';

        const payForm = document.getElementById('payment-form');
        if (payForm) {
            payForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.querySelector('.summary-btn');
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> İşleniyor...';
                    btn.disabled = true;
                }

                // GET VALUES
                const newAddr = (document.getElementById('payment-address')?.value || '').trim();
                const newName = (document.getElementById('payment-name')?.value || '').trim();
                const newPhone = (document.getElementById('payment-phone')?.value || '').trim();
                const newCity = (document.getElementById('payment-city')?.value || '').trim();
                const newDistrict = (document.getElementById('payment-district')?.value || '').trim();

                // VALIDATION - Address (check each field individually for better error messages)
                if (!newAddr) {
                    showPaymentError('Lütfen adres bilgisini giriniz.');
                    if (btn) {
                        btn.innerHTML = 'Siparişi Onayla';
                        btn.disabled = false;
                    }
                    return;
                }
                if (!newPhone) {
                    showPaymentError('Lütfen telefon numaranızı giriniz.');
                    if (btn) {
                        btn.innerHTML = 'Siparişi Onayla';
                        btn.disabled = false;
                    }
                    return;
                }
                if (!newCity) {
                    showPaymentError('Lütfen il bilgisini giriniz.');
                    if (btn) {
                        btn.innerHTML = 'Siparişi Onayla';
                        btn.disabled = false;
                    }
                    return;
                }
                if (!newDistrict) {
                    showPaymentError('Lütfen ilçe bilgisini giriniz.');
                    if (btn) {
                        btn.innerHTML = 'Siparişi Onayla';
                        btn.disabled = false;
                    }
                    return;
                }

                // VALIDATION - Payment Method (if card payment is active)
                const cardPaymentActive = document.getElementById('card-payment')?.classList.contains('active');

                if (cardPaymentActive) {
                    const cardNumber = (document.getElementById('card-number')?.value || '').trim();
                    const cardName = (document.getElementById('card-name')?.value || '').trim();
                    const cardExpiry = (document.getElementById('card-expiry')?.value || '').trim();
                    const cardCvv = (document.getElementById('card-cvv')?.value || '').trim();

                    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
                        showPaymentError('Lütfen tüm kart bilgilerini doldurunuz.');
                        if (btn) {
                            btn.innerHTML = 'Siparişi Onayla';
                            btn.disabled = false;
                        }
                        return;
                    }

                    // Basic card number validation (length)
                    const cleanCardNumber = cardNumber.replace(/\s/g, '');
                    if (cleanCardNumber.length < 15 || cleanCardNumber.length > 16) {
                        showPaymentError('Lütfen geçerli bir kart numarası giriniz (15-16 hane).');
                        if (btn) {
                            btn.innerHTML = 'Siparişi Onayla';
                            btn.disabled = false;
                        }
                        return;
                    }

                    // CVV validation
                    if (cardCvv.length < 3 || cardCvv.length > 4) {
                        showPaymentError('Lütfen geçerli bir CVV kodu giriniz (3-4 hane).');
                        if (btn) {
                            btn.innerHTML = 'Siparişi Onayla';
                            btn.disabled = false;
                        }
                        return;
                    }
                }

                /* Profile update moved after order creation
                // SAVE ADDRESS & INFO TO PROFILE
                if (user) {
                    const updateData = { id: user.id };
                    updateData.address = newAddr;
                    updateData.username = newName;
                    updateData.phone = newPhone;
                    updateData.city = newCity;
                    updateData.district = newDistrict;

                    try {
                        await fetch('/api/profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updateData)
                        });
                        // Update local storage if username is different
                        if (newName) {
                            user.username = newName;
                            localStorage.setItem('user', JSON.stringify(user));
                        }
                    } catch (e) {
                        console.error("Bilgiler güncellenemedi", e);
                    }
                }
                */

                // CREATE ORDER
                const cart = JSON.parse(localStorage.getItem('cart')) || [];
                const totalText = document.getElementById('summary-total')?.textContent || '0 TL';
                const total = parseFloat(totalText.replace(' TL', '').trim());
                const fullAddress = `${newAddr}, ${newDistrict}/${newCity} - Tel: ${newPhone}`;

                console.log('Starting order submission...');
                console.log('User:', user);
                console.log('Cart:', cart);
                console.log('Total:', total);

                // Misafir kullanıcı veya giriş yapmış kullanıcı - ikisi de sipariş verebilir
                const userId = user && user.id ? user.id : 'guest_' + Date.now();
                const customerName = newName || (user && user.username) || 'Misafir Kullanıcı';

                try {
                    console.log('Sending order request...');
                    const orderRes = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: userId,
                            customerName: customerName,
                            total: total,
                            items: cart,
                            address: fullAddress
                        })
                    });

                    console.log('Order response status:', orderRes.status);

                    if (!orderRes.ok) {
                        const errorData = await orderRes.json();
                        console.error('Order failed:', errorData);
                        throw new Error(errorData.error || 'Sipariş oluşturulamadı');
                    }

                    const responseData = await orderRes.json();
                    console.log('Order success:', responseData);

                    // Update profile in background (only for logged-in users)
                    if (user && user.id && newAddr) {
                        const updateData = { id: user.id, address: newAddr, username: newName, phone: newPhone, city: newCity, district: newDistrict };
                        fetch('/api/profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updateData)
                        }).then(() => {
                            console.log('Profile updated');
                            if (newName) {
                                user.username = newName;
                                localStorage.setItem('user', JSON.stringify(user));
                            }
                        }).catch(e => console.error("Profile update failed:", e));
                    }

                    // Redirect on success (don't wait for profile update)
                    console.log('Redirecting to order-status.html...');
                    setTimeout(() => {
                        localStorage.removeItem('cart');
                        updateCartBadge();
                        window.location.href = 'order-status.html';
                    }, 1500);

                } catch (err) {
                    console.error('Order error:', err);
                    showPaymentError(`Sipariş oluşturulurken hata: ${err.message}`);
                    if (btn) {
                        btn.innerHTML = 'Siparişi Onayla';
                        btn.disabled = false;
                    }
                }
            });
        }
    }

    // --- DİĞER SAYFALAR (Detay, Admin, Login vb.) AYNI KALIYOR ---
    // (Kod tekrarı olmasın diye burayı kısa tutuyorum, önceki mantıklar çalışmaya devam edecek)

    // ... Product Detail Logic ...
    // --- PRODUCT DETAIL PAGE LOGIC ---
    if (path.includes('product.html')) {
        const id = new URLSearchParams(window.location.search).get('id');
        if (id) {
            try {
                const p = await (await fetch(`${API_URL}/${id}`)).json();

                // Basic Info
                document.getElementById('detail-img').src = p.image;
                document.getElementById('detail-title').textContent = p.name;
                document.getElementById('detail-price').textContent = `${p.price} TL`;
                document.getElementById('detail-desc').textContent = p.description;
                document.getElementById('breadcrumb-category').textContent = p.category || 'Kategori';
                document.getElementById('breadcrumb-name').textContent = p.name;

                // Colors (as Images)
                const colorContainer = document.getElementById('color-options');
                const selectedColorName = document.getElementById('selected-color-name');
                colorContainer.innerHTML = ''; // Clear previous

                if (p.colors && p.colors.length > 0) {
                    document.getElementById('color-section').style.display = 'block';
                    p.colors.forEach((color, index) => {
                        const variantDiv = document.createElement('div');
                        variantDiv.className = 'variant-option';
                        if (index === 0) {
                            variantDiv.classList.add('selected');
                            selectedColorName.textContent = color;
                        }

                        // Use product image acting as variant thumbnail
                        // In a real app, product.variant_images[index] would be used
                        const img = document.createElement('img');
                        img.src = p.image;
                        img.alt = color;
                        img.title = color;

                        variantDiv.appendChild(img);

                        variantDiv.onclick = () => {
                            document.querySelectorAll('.variant-option').forEach(el => el.classList.remove('selected'));
                            variantDiv.classList.add('selected');
                            selectedColorName.textContent = color;
                            // Optional: Change main image if we had real variant images
                        };

                        colorContainer.appendChild(variantDiv);
                    });
                } else {
                    document.getElementById('color-section').style.display = 'none';
                }

                // Dynamic Size Buttons Based on Category
                const sizeContainer = document.getElementById('size-options');
                if (sizeContainer) {
                    sizeContainer.innerHTML = ''; // Clear existing buttons

                    let sizeRange = [];
                    // Check category and set size range accordingly
                    if (p.category && p.category.includes('Çocuk')) {
                        // Children: 28-36
                        sizeRange = [28, 29, 30, 31, 32, 33, 34, 35, 36];
                    } else if (p.category && (p.category.includes('Kadın') || p.category.includes('Women'))) {
                        // Women: 36-41
                        sizeRange = [36, 37, 38, 39, 40, 41];
                    } else {
                        // Men or default: 40-45
                        sizeRange = [40, 41, 42, 43, 44, 45];
                    }

                    // Generate size buttons with event listeners
                    sizeRange.forEach(size => {
                        const btn = document.createElement('button');
                        btn.className = 'size-btn';
                        btn.textContent = size;

                        // Add click event listener to each button
                        btn.addEventListener('click', function () {
                            // Remove 'selected' class from all size buttons
                            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
                            // Add 'selected' class to clicked button
                            this.classList.add('selected');
                            // Update selected size variable (for product.html)
                            if (typeof selectedSize !== 'undefined') {
                                selectedSize = this.textContent;
                            }
                            // Remove error border if exists
                            const sizeOptions = document.querySelector('.size-options');
                            if (sizeOptions) sizeOptions.style.border = 'none';
                        });

                        sizeContainer.appendChild(btn);
                    });
                }

                // Reviews Rendering
                const reviewsContainer = document.getElementById('reviews-list');
                const user = JSON.parse(localStorage.getItem('user'));
                const isAdmin = user && user.isAdmin;

                if (p.reviews && p.reviews.length > 0) {
                    reviewsContainer.innerHTML = ''; // Clear default
                    p.reviews.forEach((review, index) => {
                        const rDiv = document.createElement('div');
                        rDiv.style.marginBottom = '15px';
                        rDiv.style.borderBottom = '1px solid #eee';
                        rDiv.style.paddingBottom = '10px';
                        rDiv.style.position = 'relative';
                        rDiv.innerHTML = `
                            <div style="font-size:0.8rem; font-weight:700;"><i class="fas fa-user-circle"></i> ${review.user}</div>
                            <div style="color:#ffa41c; font-size:0.8rem;">
                                ${'<i class="fas fa-star"></i>'.repeat(review.rating)}
                            </div>
                            <div style="font-size:0.9rem; margin-top:5px;">${review.comment}</div>
                            ${isAdmin ? `<button onclick="deleteReview(${id}, ${index})" style="position: absolute; top: 5px; right: 5px; background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;" title="Yorumu Sil"><i class="fas fa-trash"></i></button>` : ''}
                        `;
                        reviewsContainer.appendChild(rDiv);
                    });
                }

                // Button Actions - Removed from here
                // These are handled in product.html with size validation
                // DO NOT add onclick handlers here for #add-cart-btn or #buy-now-btn


            } catch (err) {
                console.error("Error loading product:", err);
            }
        }
    }

    // Helper to map color names to CSS codes
    function getColorCode(name) {
        const map = {
            'Siyah': 'black', 'Beyaz': 'white', 'Kırmızı': 'red', 'Mavi': 'blue',
            'Yeşil': 'green', 'Sarı': 'yellow', 'Gri': 'gray', 'Pembe': 'pink',
            'Lacivert': 'navy', 'Bordo': 'maroon', 'Kahverengi': 'brown', 'Ten': '#f1c27d', 'Turuncu': 'orange', 'Renkli': 'linear-gradient(45deg, red, blue)'
        };
        if (name === 'Renkli') return 'white'; // Special case
        return map[name] || '#eee';
    }

    // Add Review Function (Global)
    window.addReview = function () {
        const text = document.getElementById('new-review-text').value;
        const ratingInput = document.getElementById('selected-rating');
        const rating = ratingInput ? parseInt(ratingInput.value) : 5; // Default 5 if missing

        if (!text) return;
        if (rating === 0) {
            showToast('Lütfen puan veriniz.', 'error');
            return;
        }

        // ... (User logic same as before)
        let userName = "Misafir Kullanıcı";
        try {
            const userStr = localStorage.getItem('user');
            if (userStr && userStr !== "undefined") {
                const user = JSON.parse(userStr);
                if (user.username) userName = user.username;
                else if (user.name) userName = user.name;
                else if (user.email) userName = user.email.split('@')[0];

                if (userName) userName = userName.toUpperCase();
            }
        } catch (e) { console.error("User parse error", e); }

        const reviewsContainer = document.getElementById('reviews-list');
        const rDiv = document.createElement('div');
        rDiv.className = 'review-item';
        rDiv.style.marginBottom = '15px';
        rDiv.style.borderBottom = '1px solid #eee';
        rDiv.style.paddingBottom = '10px';

        // Dynamic Star HTML
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) starsHtml += '<i class="fas fa-star"></i>';
            else starsHtml += '<i class="far fa-star"></i>';
        }

        rDiv.innerHTML = `
            <div style="font-size:0.9rem; font-weight:700; color:#333; margin-bottom:5px; display:flex; align-items:center; gap:5px;">
                <i class="fas fa-user-circle" style="font-size:1.1rem; color:#888;"></i>
                ${userName}
                <span style="font-weight:400; color:#067D62; font-size:0.75rem;">(Yeni)</span>
            </div>
            <div style="color:#f27a1a; font-size:0.8rem; margin-bottom:5px;">${starsHtml}</div>
            <div style="font-size:0.95rem; color:#555;">${text}</div>
        `;

        if (reviewsContainer.innerHTML.includes('Henüz yorum')) reviewsContainer.innerHTML = '';
        reviewsContainer.prepend(rDiv);

        // Reset inputs
        document.getElementById('new-review-text').value = '';
        if (ratingInput) {
            ratingInput.value = "0";
            // Reset stars visual
            document.querySelectorAll('#star-rating-input i').forEach(s => {
                s.classList.remove('fas');
                s.classList.add('far');
                s.style.color = '#ddd';
            });
        }

        showToast('Yorumunuz eklendi!', 'success');
    };

    // ... Sidebar Functions ...
});

window.addToCart = (id, name, price, image) => {
    console.log("Adding to cart:", id, name);
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push({ id, name, price, image });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderSidebarCart();
    toggleSidebar(true);
};

window.renderSidebarCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('sidebar-cart-items');
    const totalEl = document.getElementById('sidebar-total');
    if (!container) return;

    let total = 0;
    container.innerHTML = cart.map((item, index) => {
        total += item.price;
        return `
            <div class="cart-item">
                <img src="${item.image || 'https://via.placeholder.com/60'}" alt="">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">${item.price} TL</div>
                    <a onclick="removeFromCart(${index}); return false;"><i class="fas fa-trash-alt"></i> Kaldır</a>
                </div>
            </div>
        `;
    }).join('');

    if (cart.length === 0) container.innerHTML = '<p style="text-align:center; padding:20px;">Sepetiniz boş.</p>';
    if (totalEl) totalEl.textContent = total + ' TL';
};

window.removeFromCart = (index) => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderSidebarCart();
};

window.toggleSidebar = (forceOpen = false) => {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    if (forceOpen) { sidebar.classList.add('active'); overlay.classList.add('active'); }
    else { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); }
    if (sidebar.classList.contains('active')) renderSidebarCart();
};

window.updateCartBadge = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    document.querySelectorAll('.cart-count').forEach(b => b.textContent = cart.length);
};

// Alias for updateCartBadge (used by product.html)
window.updateCartCount = () => updateCartBadge();

window.updateHeaderAuth = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const authArea = document.getElementById('auth-area');
    if (!authArea) return;
    if (user) {
        let adminHtml = user.isAdmin ? `<div style="margin-left:10px;"><a href="admin.html" style="color:var(--orange-primary);">Yönetici</a></div>` : '';
        authArea.innerHTML = `<div style="display:flex; align-items:center;">
            <div class="nav-item" onclick="window.location.href='profile.html'" style="cursor:pointer; display:flex; align-items:center; gap:5px;">
                <i class="fas fa-user"></i>
                <span style="font-weight:600; text-transform: uppercase;">${user.username}</span>
            </div>
            ${adminHtml}
        </div>`;
    } else {
        authArea.innerHTML = `<a href="login.html" class="nav-item">
            <i class="fas fa-user" style="font-size: 1.2rem;"></i>
        </a>`;
    }
};

window.logout = () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};

// --- FILTER & SIDEBAR LOGIC ---

window.toggleFilterSidebar = () => {
    const sidebar = document.getElementById('filter-sidebar');
    const overlay = document.getElementById('filter-curtain');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
};

window.toggleSubmenu = (id) => {
    const submenu = document.getElementById(id);
    if (submenu) submenu.classList.toggle('active');
};

let allProducts = [];

window.loadAllProducts = async () => {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("API Error");
        allProducts = await res.json();
        renderProducts(allProducts);
    } catch (e) {
        console.error("Products load failed", e);
        // Dont show error to user, just log and maybe blank state
        const container = document.getElementById('product-list');
        if (container && container.innerHTML.includes('yükleniyor')) {
            container.innerHTML = '<p>Ürünler yüklenemedi.</p>';
        }
    }
};

// Search Products Function
window.performSearch = () => {
    const searchInput = document.getElementById('search-input');
    const searchCategory = document.getElementById('search-category');

    // Use Turkish locale for proper lowercase conversion (İ->i, I->ı)
    const query = (searchInput?.value || '').toLocaleLowerCase('tr-TR').trim();
    const category = searchCategory?.value || '';

    let filtered = allProducts;

    // Filter by category only if a specific category is selected (not "Tümü")
    if (category && category !== 'Tümü' && category !== '') {
        filtered = filtered.filter(p => p.category === category);
    }

    // Filter by search query
    if (query) {
        filtered = filtered.filter(p => {
            const name = (p.name || '').toLocaleLowerCase('tr-TR');
            const type = (p.type || '').toLocaleLowerCase('tr-TR');
            const subtype = (p.subtype || '').toLocaleLowerCase('tr-TR');
            const description = (p.description || '').toLocaleLowerCase('tr-TR');
            const categoryName = (p.category || '').toLocaleLowerCase('tr-TR');

            return name.includes(query) ||
                type.includes(query) ||
                subtype.includes(query) ||
                description.includes(query) ||
                categoryName.includes(query);
        });
    }

    renderProducts(filtered);

    // Scroll to products section
    const productList = document.getElementById('product-list');
    if (productList) {
        productList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Show result count
    if (query || category) {
        const resultCount = filtered.length;
        const categoryText = category ? ` "${category}" kategorisinde` : '';
        const queryText = query ? ` "${searchInput?.value || ''}" için` : '';
        showToast(`${resultCount} ürün bulundu${categoryText}${queryText}`, 'success');
    }
};

window.filterProducts = (category, type, subtype, closeSidebar = true) => {
    let filtered = allProducts;

    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }
    if (type && type !== 'Ayakkabı') {
        // Flexible matching: check if type matches or is included in product type
        filtered = filtered.filter(p => {
            if (!p.type) return false;
            return p.type === type || p.type.includes(type) || type.includes(p.type);
        });
    }
    if (subtype) {
        // Flexible matching for subtype: check type and subtype only (not name to be more accurate)
        filtered = filtered.filter(p => {
            const pType = (p.type || '').toLocaleLowerCase('tr-TR');
            const pSubtype = (p.subtype || '').toLocaleLowerCase('tr-TR');
            const searchTerm = subtype.toLocaleLowerCase('tr-TR');

            // Check if type contains the search term (e.g., "Spor" matches "Spor Ayakkabı")
            // Or if subtype matches
            return pType.includes(searchTerm) || pSubtype.includes(searchTerm);
        });
    }

    renderProducts(filtered);

    // Only toggle sidebar if called from sidebar menu
    if (closeSidebar) {
        const sidebar = document.getElementById('filter-sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            toggleFilterSidebar();
        }
    }

    // Scroll to products section
    const productList = document.getElementById('product-list');
    if (productList) {
        productList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.renderProducts = (products) => {
    const container = document.getElementById('product-list');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p>Aradığınız kriterlere uygun ürün bulunamadı.</p>';
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="card">
            <div class="card-img-wrapper">
                <a href="product.html?id=${p.id}"><img src="${p.image || 'https://via.placeholder.com/300'}" alt="${p.name}"></a>
            </div>
            <div class="card-body">
                <a href="product.html?id=${p.id}" class="card-title">${p.name}</a>
                <div class="rating-container">
                    <span class="rating-stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i></span>
                    <span class="rating-count">1,240</span>
                </div>
                <div class="card-price">${p.price} <sup>TL</sup></div>
            </div>
            <div class="card-footer">
                <button onclick="window.location.href='product.html?id=${p.id}'" class="btn btn-primary">Sepete Ekle</button>
            </div>
        </div>
    `).join('');
};

// --- HERO SLIDER AUTO-RUN ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Slider script running");
    let currentSlide = 0;
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.indicator');
    const totalSlides = slides.length;

    // Safety check
    if (totalSlides === 0) return;

    // Update indicators
    function updateIndicators() {
        indicators.forEach((ind, index) => {
            ind.classList.remove('active');
            if (index === currentSlide) {
                ind.classList.add('active');
            }
        });
    }

    window.changeSlide = function (direction) {
        if (slides.length > 0) {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
            slides[currentSlide].classList.add('active');
            updateIndicators();
        }
    };

    window.goToSlide = function (index) {
        if (index >= 0 && index < totalSlides) {
            slides[currentSlide].classList.remove('active');
            currentSlide = index;
            slides[currentSlide].classList.add('active');
            updateIndicators();
        }
    };

    // Auto-play
    setInterval(() => {
        if (typeof window.changeSlide === 'function') {
            window.changeSlide(1);
        }
    }, 5000);

    // --- COUNTDOWN TIMER ---
    initCountdownTimer();
});

// Countdown Timer for Deals Section (0-2 hours)
function initCountdownTimer() {
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (!hoursEl || !minutesEl || !secondsEl) return;

    // Get or set end time (0-2 hours from now)
    let endTime = localStorage.getItem('dealsEndTime');

    if (!endTime || new Date(parseInt(endTime)) <= new Date()) {
        // Set new random end time between 0-2 hours
        const randomMinutes = Math.floor(Math.random() * 120); // 0-120 minutes
        const newEndTime = new Date().getTime() + (randomMinutes * 60 * 1000);
        localStorage.setItem('dealsEndTime', newEndTime.toString());
        endTime = newEndTime;
    } else {
        endTime = parseInt(endTime);
    }

    function getTimeRemaining() {
        const now = new Date().getTime();
        const total = endTime - now;

        if (total <= 0) {
            // Reset timer with new random time
            const randomMinutes = Math.floor(Math.random() * 120);
            endTime = new Date().getTime() + (randomMinutes * 60 * 1000);
            localStorage.setItem('dealsEndTime', endTime.toString());
            return { total: randomMinutes * 60 * 1000, hours: Math.floor(randomMinutes / 60), minutes: randomMinutes % 60, seconds: 0 };
        }

        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);

        return { total, hours, minutes, seconds };
    }

    function updateTimer() {
        const t = getTimeRemaining();
        hoursEl.textContent = String(t.hours).padStart(2, '0');
        minutesEl.textContent = String(t.minutes).padStart(2, '0');
        secondsEl.textContent = String(t.seconds).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// --- TOAST & MODAL UTILS ---
window.showToast = function (message, type = 'success') {
    // If it's a "Sepete eklendi" message, use the Top Bar instead
    if (message.includes('Sepete eklendi') || message.includes('eklendi')) {
        showTopNotification(message);
        return;
    }

    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showTopNotification(message) {
    let bar = document.getElementById('top-notification-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'top-notification-bar';
        document.body.appendChild(bar);
    }

    bar.textContent = message;
    bar.classList.add('show');

    // Auto hide after 3 seconds
    setTimeout(() => {
        bar.classList.remove('show');
    }, 3000);
}

// Payment Error Notification (Centered Modal Design)
window.showPaymentError = function (message) {
    // Remove existing elements
    let errorBar = document.getElementById('payment-error-bar');
    let overlay = document.getElementById('payment-error-overlay');
    if (errorBar) errorBar.remove();
    if (overlay) overlay.remove();

    // Create overlay
    overlay = document.createElement('div');
    overlay.id = 'payment-error-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        z-index: 99998;
        animation: fadeIn 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // Create modal card
    errorBar = document.createElement('div');
    errorBar.id = 'payment-error-bar';
    errorBar.style.cssText = `
        background: white;
        border-radius: 24px;
        padding: 40px;
        max-width: 420px;
        width: 90%;
        text-align: center;
        z-index: 99999;
        animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
        position: relative;
        overflow: hidden;
    `;

    errorBar.innerHTML = `
        <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #E47911, #f39c12, #E47911);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
        "></div>
        
        <div style="
            width: 90px;
            height: 90px;
            background: linear-gradient(135deg, #fff5eb 0%, #ffe4cc 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 25px;
            position: relative;
        ">
            <div style="
                width: 70px;
                height: 70px;
                background: linear-gradient(135deg, #E47911 0%, #f39c12 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: pulse 2s infinite;
            ">
                <i class="fas fa-map-marker-alt" style="font-size: 32px; color: white;"></i>
            </div>
        </div>
        
        <h2 style="
            color: #1a1a2e;
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 12px 0;
        ">Adres Bilgisi Gerekli</h2>
        
        <p style="
            color: #666;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 30px 0;
        ">${message}</p>
        
        <button onclick="document.getElementById('payment-error-bar').remove(); document.getElementById('payment-error-overlay').remove();" style="
            background: linear-gradient(135deg, #E47911 0%, #f39c12 100%);
            border: none;
            color: white;
            padding: 16px 50px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 700;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(228, 121, 17, 0.35);
        " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 35px rgba(228, 121, 17, 0.45)';" 
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(228, 121, 17, 0.35)';">
            Tamam, Anladım
        </button>
    `;

    // Add animation styles
    if (!document.getElementById('payment-error-style')) {
        const style = document.createElement('style');
        style.id = 'payment-error-style';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes bounceIn {
                0% { opacity: 0; transform: scale(0.3); }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(228, 121, 17, 0.4); }
                50% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(228, 121, 17, 0); }
            }
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }

    overlay.appendChild(errorBar);
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) {
        // Fallback if modal not present
        if (confirm(message)) onConfirm();
        return;
    }

    const msgEl = document.getElementById('modal-message');
    const btnConfirm = document.getElementById('modal-confirm');
    const btnCancel = document.getElementById('modal-cancel');

    if (msgEl) msgEl.textContent = message;

    // Show modal
    modal.classList.add('active');

    // Clean previous events to avoid multiple clicks
    const newConfirm = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);

    const newCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(newCancel, btnCancel);

    // Bind events
    newConfirm.addEventListener('click', () => {
        modal.classList.remove('active');
        onConfirm();
    });

    newCancel.addEventListener('click', () => {
        modal.classList.remove('active');
    });
}

// --- ADMIN PAGE LOGIC ---
const addForm = document.getElementById('add-form');
if (addForm) {
    // 1. Add Product Listener
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const product = {
            name: document.getElementById('name').value,
            price: parseFloat(document.getElementById('price').value),
            category: document.getElementById('category').value,
            type: document.getElementById('type').value,
            subtype: document.getElementById('subtype').value,
            colors: document.getElementById('colors').value.split(',').map(c => c.trim()).filter(c => c),
            image: document.getElementById('image').value || 'https://via.placeholder.com/300',
            description: document.getElementById('desc').value,
            reviews: []
        };

        const editId = addForm.dataset.editId;
        const isEdit = !!editId;
        const url = isEdit ? `${API_URL}/${editId}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });

            if (res.ok) {
                showToast(isEdit ? 'Ürün güncellendi!' : 'Ürün başarıyla eklendi!', 'success');
                resetAdminForm();
                renderAdminTable();
            } else {
                showToast('Hata oluştu.', 'error');
            }
        } catch (err) { console.error(err); }
    });

    // 2. Render Admin Table
    async function renderAdminTable() {
        const tbody = document.getElementById('admin-tbody');
        if (!tbody) return;
        const products = await (await fetch(API_URL)).json();

        tbody.innerHTML = products.map(p => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;"><img src="${p.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
                <td style="padding: 10px;">${p.name}</td>
                <td style="padding: 10px;">${p.category || '-'}</td>
                <td style="padding: 10px;">${p.price} TL</td>
                <td style="padding: 10px; text-align: right;">
                    <button onclick="editProduct(${p.id})" style="color: white; border: none; background: #3498db; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-right: 5px;">Düzenle</button>
                    <button onclick="deleteProduct(${p.id})" style="color: white; border: none; background: #e74c3c; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Sil</button>
                </td>
            </tr>
        `).join('');
    }

    // Initial Load
    renderAdminTable();
}

// Edit Product Function
window.editProduct = async (id) => {
    try {
        // Fetch product data
        const product = await (await fetch(`${API_URL}/${id}`)).json();

        // Populate form fields
        document.getElementById('name').value = product.name;
        document.getElementById('price').value = product.price;
        document.getElementById('category').value = product.category;
        document.getElementById('type').value = product.type;
        document.getElementById('subtype').value = product.subtype || '';
        document.getElementById('colors').value = product.colors ? product.colors.join(', ') : '';
        document.getElementById('image').value = product.image;
        document.getElementById('desc').value = product.description;

        // Change form to edit mode
        const formTitle = document.querySelector('.amazon-card h3');
        if (formTitle) formTitle.textContent = 'Ürünü Düzenle';

        const submitBtn = document.querySelector('#add-form button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Değişiklikleri Kaydet';

        // Show cancel button
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.style.display = 'block';

        // Store product ID for update
        document.getElementById('add-form').dataset.editId = id;

        // Scroll to form
        document.querySelector('.amazon-card').scrollIntoView({ behavior: 'smooth', block: 'start' });

        showToast('Düzenleme moduna geçildi', 'info');
    } catch (err) {
        console.error(err);
        showToast('Ürün yüklenemedi', 'error');
    }
};

// Reset Admin Form Function
window.resetAdminForm = () => {
    const form = document.getElementById('add-form');
    if (form) {
        form.reset();
        delete form.dataset.editId; // Remove edit mode
    }

    const formTitle = document.querySelector('.amazon-card h3');
    if (formTitle) formTitle.textContent = 'Yeni Ürün Ekle';

    const submitBtn = document.querySelector('#add-form button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Envantere Ekle';

    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';
};

// Global Delete Function
// ... (previous admin logic)

// Global Delete Function (updated with custom modal)
window.deleteProduct = (id) => {
    // Modal'ı göster
    const modal = document.getElementById('confirm-modal');
    const modalMsg = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    if (!modal) {
        // Fallback: Modal yoksa confirm kullan
        if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
            deleteProductConfirm(id);
        }
        return;
    }

    modalMsg.textContent = 'Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.';
    modal.style.display = 'flex';

    // Evet butonuna tıklanınca
    confirmBtn.onclick = () => {
        modal.style.display = 'none';
        deleteProductConfirm(id);
    };

    // İptal butonuna tıklanınca
    cancelBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // Modal dışına tıklanınca kapat
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
};

// --- RETURN SYSTEM LOGIC ---

// 1. User Side (Order Status Page)
window.openReturnModal = () => {
    const modal = document.getElementById('return-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Auto-fill random order ID for demo purposes if needed
    }
};

window.closeReturnModal = () => {
    const modal = document.getElementById('return-modal');
    if (modal) modal.style.display = 'none';
};

window.submitReturnRequest = async () => {
    const type = document.getElementById('return-type').value;
    const productName = document.getElementById('return-product').value;
    const reason = document.getElementById('return-reason').value;
    const user = JSON.parse(localStorage.getItem('user'));

    if (!productName || !reason) {
        alert("Lütfen tüm alanları doldurunuz.");
        return;
    }

    const userId = user ? user.id : 0; // Guest or Logged in

    try {
        const res = await fetch('/api/returns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                orderId: 0, // Placeholder
                productName,
                type,
                reason
            })
        });

        if (res.ok) {
            alert("İade/Değişim talebiniz alındı. En kısa sürede iletişime geçeceğiz.");
            closeReturnModal();
        } else {
            alert("Talep oluşturulurken hata.");
        }
    } catch (e) {
        console.error(e);
        alert("Bağlantı hatası.");
    }
};

// 2. Admin Side
window.switchAdminTab = (tabName) => {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.admin-tabs button').forEach(el => el.style.background = '');

    document.getElementById(tabName + '-tab').style.display = 'block';
    // Highlight button logically (in real app, use IDs or classes for buttons)

    if (tabName === 'users') loadUsersAdmin();
    if (tabName === 'returns') loadReturnsAdmin();
};

async function loadUsersAdmin() {
    // ... (existing user load logic or new) ...
    // Re-implementing simplified user load for context since I might have overwritten it or it's implicitly there
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    try {
        const users = await (await fetch('/api/users')).json();
        tbody.innerHTML = users.map(u => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${u.id}</td>
                <td style="padding: 10px;">${u.username}</td>
                <td style="padding: 10px;">${u.email || '-'}</td>
                <td style="padding: 10px;">${u.isAdmin ? 'Yönetici' : 'Üye'}</td>
                <td style="padding: 10px;">${u.address || '-'}</td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

async function loadReturnsAdmin() {
    const tbody = document.getElementById('returns-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">Yükleniyor...</td></tr>';

    try {
        const returns = await (await fetch('/api/returns')).json();
        if (returns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:10px;">Hiç talep yok.</td></tr>';
            return;
        }

        tbody.innerHTML = returns.map(r => `
            <tr style="border-bottom: 1px solid #eee; background: ${r.status === 'Approved' ? '#e6fffa' : r.status === 'Rejected' ? '#fff5f5' : '#fff'}">
                <td style="padding: 10px;">#${r.id}</td>
                <td style="padding: 10px;">User ID: ${r.user_id}</td>
                <td style="padding: 10px;">${r.product_name}</td>
                <td style="padding: 10px;">
                    <span style="font-weight:bold; color:${r.type === 'return' ? 'red' : 'blue'}">${r.type === 'return' ? 'İADE' : 'DEĞİŞİM'}</span><br>
                    <small>${r.reason}</small>
                </td>
                <td style="padding: 10px; font-weight:bold;">${r.status}</td>
                <td style="padding: 10px;">
                    ${r.status === 'Pending' ? `
                    <button onclick="updateReturnStatus(${r.id}, 'Approved')" style="padding:5px; background:green; color:white; border:none; border-radius:4px; cursor:pointer;">Onayla</button>
                    <button onclick="updateReturnStatus(${r.id}, 'Rejected')" style="padding:5px; background:red; color:white; border:none; border-radius:4px; cursor:pointer;">Reddet</button>
                    ` : '-'}
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

window.updateReturnStatus = async (id, status) => {
    if (!confirm("Durumu değiştirmek istiyor musunuz?")) return;
    try {
        await fetch(`/api/returns/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        loadReturnsAdmin();
    } catch (e) { console.error(e); }
};

// Admin check functions
function updateHeaderAuth() {
    const user = JSON.parse(localStorage.getItem('user'));

    // Show/hide admin-only elements
    if (user && user.isAdmin) {
        const addProductLink = document.getElementById('add-product-link');
        if (addProductLink) addProductLink.style.display = 'flex';

        const adminPanelLink = document.getElementById('admin-panel-link');
        if (adminPanelLink) adminPanelLink.style.display = 'flex';
    }
}

// Check if user is admin, if not redirect to index
window.requireAdmin = function () {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.isAdmin) {
        alert('Bu sayfaya erişim yetkiniz yok. Admin girişi gerekli.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Add admin controls to product cards
function addAdminProductButtons() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.isAdmin) return; // Only for admins

    // Wait a bit for products to load, then inject buttons
    setTimeout(() => {
        const productElements = document.querySelectorAll('.product, [data-product-id], [onclick*="product.html"]');

        productElements.forEach(productEl => {
            // Skip if already has admin controls
            if (productEl.querySelector('.admin-controls')) return;

            // Extract product ID from onclick or href
            let productId = productEl.dataset.productId;
            if (!productId) {
                const onclick = productEl.getAttribute('onclick') || '';
                const match = onclick.match(/id=(\d+)/);
                if (match) productId = match[1];
            }

            if (!productId) return; // Can't add controls without ID

            // Create admin controls div
            const adminDiv = document.createElement('div');
            adminDiv.className = 'admin-controls';
            adminDiv.style.cssText = 'position: absolute; top: 10px; right: 10px; display: flex; gap: 5px; z-index: 10;';

            // Edit button
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Düzenle';
            editBtn.style.cssText = 'background: #007bff; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 14px;';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                window.location.href = `add-product.html?edit=${productId}`;
            };

            // Delete button  
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            delBtn.title = 'Sil';
            delBtn.style.cssText = 'background: #dc3545; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 14px;';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                deleteProductConfirm(productId);
            };

            adminDiv.appendChild(editBtn);
            adminDiv.appendChild(delBtn);

            // Make product element relative positioned
            if (getComputedStyle(productEl).position === 'static') {
                productEl.style.position = 'relative';
            }

            productEl.appendChild(adminDiv);
        });
    }, 1000); // Wait 1 second for products to load
}

// Delete product with confirmation
window.deleteProductConfirm = async function (productId) {
    try {
        const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Ürün silindi!', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            throw new Error('Silme başarısız');
        }
    } catch (err) {
        console.error(err);
        showToast('Ürün silinemedi: ' + err.message, 'error');
    }
}

// Delete review from product
window.deleteReview = async function (productId, reviewIndex) {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;

    try {
        // Get current product
        const productRes = await fetch(`/api/products/${productId}`);
        if (!productRes.ok) throw new Error('Ürün bulunamadı');

        const product = await productRes.json();

        // Remove review at index
        const updatedReviews = [...product.reviews];
        updatedReviews.splice(reviewIndex, 1);

        // Update product
        const updateRes = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviews: updatedReviews })
        });

        if (!updateRes.ok) throw new Error('Yorum silinemedi');

        showToast('Yorum silindi!', 'success');
        setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
        console.error(err);
        showToast('Yorum silinemedi: ' + err.message, 'error');
    }
}