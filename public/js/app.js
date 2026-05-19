const API_URL = '';
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('bth_cart')) || [];
let currentFilter = 'all';
let currentSort = 'featured';

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartUI();
    initParticles();
    initScrollAnimations();
    initNavbarScroll();
});

// API helpers
async function api(endpoint, options = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

// Load products
async function loadProducts() {
    try {
        allProducts = await api('/api/products');
        document.getElementById('statProducts').textContent = allProducts.length + '+';
        renderProducts();
    } catch (err) {
        console.error('Failed to load products:', err);
        showToast('Failed to load products. Please refresh.', 'error');
    }
}

// Particles
function initParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 8 + 's';
        p.style.animationDuration = (6 + Math.random() * 6) + 's';
        container.appendChild(p);
    }
}

// Scroll animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.product-card, .benefit, .category-card, .process-step').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

function initNavbarScroll() {
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.8)';
        }
    });
}

// Section navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (sectionId === 'shop') renderShopProducts();
}

function scrollToFeatured() {
    document.getElementById('featuredSection')?.scrollIntoView({ behavior: 'smooth' });
}

// Render product card
function productCard(p) {
    const hasImage = p.image && !p.image.includes('placehold');
    return `
        <div class="product-card" onclick="showProductModal(${p.id})">
            <div class="product-image">
                <img src="${p.image || '/images/placeholder.jpg'}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="product-image-fallback" style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:64px;">
                    ${p.emoji || '<span style="opacity:.3">&#128230;</span>'}
                </div>
                ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
                ${p.stock <= 5 ? `<span class="product-badge stock-low">Only ${p.stock} left</span>` : ''}
                <div class="product-quick-add">
                    <button class="btn btn-primary btn-full" onclick="event.stopPropagation(); addToCart(${p.id}, 1)">Add to Cart</button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <h3 class="product-title">${p.name}</h3>
                <div class="product-rating">
                    <span class="stars">${'★'.repeat(Math.floor(p.rating || 5))}${'☆'.repeat(5 - Math.floor(p.rating || 5))}</span>
                    <span class="rating-count">(${p.reviews || 0})</span>
                </div>
                <div class="product-price-row">
                    <span class="product-price">$${p.price}${p.original_price ? `<span class="original">$${p.original_price}</span>` : ''}</span>
                </div>
            </div>
        </div>
    `;
}

// Featured products
function renderProducts() {
    const featured = allProducts.slice(0, 4);
    const container = document.getElementById('featuredProducts');
    if (container) {
        container.innerHTML = featured.length ? featured.map(productCard).join('') : '<p style="text-align:center; color:var(--text-muted)">No products available.</p>';
    }
}

// Shop products
function renderShopProducts() {
    const container = document.getElementById('shopProducts');
    if (!container) return;
    let filtered = currentFilter === 'all' ? [...allProducts] : allProducts.filter(p => p.category === currentFilter);
    switch(currentSort) {
        case 'price-low': filtered.sort((a,b) => a.price - b.price); break;
        case 'price-high': filtered.sort((a,b) => b.price - a.price); break;
        case 'newest': filtered.sort((a,b) => b.id - a.id); break;
        case 'rating': filtered.sort((a,b) => (b.rating || 0) - (a.rating || 0)); break;
    }
    container.innerHTML = filtered.length ? filtered.map(productCard).join('') : '<p style="text-align:center; color:var(--text-muted); padding:40px;">No products found.</p>';
    requestAnimationFrame(() => {
        container.querySelectorAll('.product-card').forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * 80);
        });
    });
}

// Filters
function filterProducts(category) {
    currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === category);
    });
    showSection('shop');
    renderShopProducts();
}

function showCategory(cat) {
    filterProducts(cat);
}

function sortProducts(sort) {
    currentSort = sort;
    renderShopProducts();
}

// Search
function toggleSearch() {
    document.getElementById('searchBar')?.classList.toggle('active');
}

async function handleSearch(e) {
    if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (!query) return;
        try {
            allProducts = await api(`/api/products?search=${encodeURIComponent(query)}`);
            currentFilter = 'all';
            showSection('shop');
            renderShopProducts();
            toggleSearch();
        } catch (err) {
            showToast('Search failed', 'error');
        }
    }
}

// Mobile menu
function toggleMobileMenu() {
    document.getElementById('mobileMenu')?.classList.toggle('active');
}

// Cart
function toggleCart() {
    document.getElementById('cartOverlay')?.classList.toggle('active');
    document.getElementById('cartSidebar')?.classList.toggle('active');
}

function addToCart(productId, qty = 1) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    if (product.stock !== undefined && product.stock < qty) {
        showToast('Sorry, not enough stock available.', 'error');
        return;
    }
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        if (product.stock !== undefined && existing.qty + qty > product.stock) {
            showToast('Maximum stock reached.', 'error');
            return;
        }
        existing.qty += qty;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, emoji: product.emoji, qty });
    }
    saveCart();
    updateCartUI();
    showToast(`${product.name} added to cart`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(productId);
        return;
    }
    const product = allProducts.find(p => p.id === productId);
    if (product && item.qty > product.stock) {
        item.qty = product.stock;
        showToast('Maximum stock reached.', 'error');
    }
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('bth_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = count;
    const itemsContainer = document.getElementById('cartItems');
    const footer = document.getElementById('cartFooter');
    if (cart.length === 0) {
        if (itemsContainer) itemsContainer.innerHTML = `
            <div class="empty-cart">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <p>Your cart is empty</p>
                <button class="btn btn-primary" onclick="toggleCart(); showSection('shop')">Start Shopping</button>
            </div>`;
        if (footer) footer.style.display = 'none';
    } else {
        if (itemsContainer) itemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image || ''}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'; this.parentElement.textContent='${item.emoji || ''}';">
                </div>
                <div class="cart-item-details">
                    <div>
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${item.price}</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');
        if (footer) footer.style.display = 'block';
    }
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = subtotal > 100 ? 0 : 12;
    const total = subtotal + shipping;
    const subtotalEl = document.getElementById('cartSubtotal');
    const shippingEl = document.getElementById('cartShipping');
    const totalEl = document.getElementById('cartTotal');
    if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free' : '$' + shipping.toFixed(2);
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
}

// Product Modal
function showProductModal(productId) {
    const p = allProducts.find(pr => pr.id === productId);
    if (!p) return;
    const body = document.getElementById('productModalBody');
    if (!body) return;
    body.innerHTML = `
        <div class="modal-image">
            <img src="${p.image || ''}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:120px;\\'>${p.emoji || ''}</div>';">
        </div>
        <div class="modal-details">
            <div class="modal-category">${p.category}</div>
            <h2>${p.name}</h2>
            <div class="modal-price">$${p.price}${p.original_price ? `<span class="original" style="font-size:18px;margin-left:12px;">$${p.original_price}</span>` : ''}</div>
            <div class="product-rating" style="margin-bottom:20px;">
                <span class="stars">${'★'.repeat(Math.floor(p.rating || 5))}${'☆'.repeat(5 - Math.floor(p.rating || 5))}</span>
                <span class="rating-count">${p.rating || 5} (${p.reviews || 0} reviews)</span>
            </div>
            <p class="modal-description">${p.description || ''}</p>
            <ul class="modal-features">
                ${(p.features || []).map(f => `<li>${f}</li>`).join('')}
            </ul>
            <div class="modal-actions">
                <div class="qty-selector">
                    <button onclick="this.nextElementSibling.value = Math.max(1, parseInt(this.nextElementSibling.value) - 1)">−</button>
                    <input type="text" value="1" readonly id="modalQty">
                    <button onclick="this.previousElementSibling.value = parseInt(this.previousElementSibling.value) + 1">+</button>
                </div>
                <button class="btn btn-primary btn-lg" onclick="addToCart(${p.id}, parseInt(document.getElementById('modalQty').value)); closeProductModal();">
                    Add to Cart — $${p.price}
                </button>
            </div>
        </div>
    `;
    document.getElementById('productModal')?.classList.add('active');
    document.getElementById('productModalContent')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-close')) return;
    document.getElementById('productModal')?.classList.remove('active');
    document.getElementById('productModalContent')?.classList.remove('active');
    document.body.style.overflow = '';
}

// Checkout
function showCheckout() {
    toggleCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = subtotal > 100 ? 0 : 12;
    const total = subtotal + shipping;
    const body = document.getElementById('checkoutBody');
    if (!body) return;
    body.innerHTML = `
        <h2>Checkout</h2>
        <div class="checkout-grid">
            <div class="checkout-form">
                <h3>Shipping Information</h3>
                <div class="form-row">
                    <div class="form-group"><label>First Name</label><input type="text" id="chkFirstName" required></div>
                    <div class="form-group"><label>Last Name</label><input type="text" id="chkLastName" required></div>
                </div>
                <div class="form-group"><label>Email</label><input type="email" id="chkEmail" required></div>
                <div class="form-group"><label>Address</label><input type="text" id="chkAddress" required></div>
                <div class="form-row">
                    <div class="form-group"><label>City</label><input type="text" id="chkCity" required></div>
                    <div class="form-group"><label>ZIP Code</label><input type="text" id="chkZip" required></div>
                </div>
                <h3 style="margin-top:32px;">Payment</h3>
                <div class="form-group"><label>Card Number</label><input type="text" id="chkCard" placeholder="0000 0000 0000 0000" required></div>
                <div class="form-row">
                    <div class="form-group"><label>Expiry</label><input type="text" id="chkExpiry" placeholder="MM/YY" required></div>
                    <div class="form-group"><label>CVC</label><input type="text" id="chkCvc" placeholder="123" required></div>
                </div>
                <button class="btn btn-primary btn-full btn-lg" style="margin-top:24px;" onclick="processOrder()">Complete Order — $${total.toFixed(2)}</button>
            </div>
            <div class="checkout-summary">
                <h3>Order Summary</h3>
                ${cart.map(item => `
                    <div class="checkout-item">
                        <div class="checkout-item-image">
                            <img src="${item.image || ''}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'; this.parentElement.textContent='${item.emoji || ''}';">
                        </div>
                        <div class="checkout-item-details">
                            <div class="checkout-item-title">${item.name}</div>
                            <div class="checkout-item-meta">Qty: ${item.qty}</div>
                        </div>
                        <div class="checkout-item-price">$${(item.price * item.qty).toFixed(2)}</div>
                    </div>
                `).join('')}
                <div class="checkout-totals">
                    <div class="checkout-total-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
                    <div class="checkout-total-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span></div>
                    <div class="checkout-total-row final"><span>Total</span><span>$${total.toFixed(2)}</span></div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('checkoutModal')?.classList.add('active');
    document.getElementById('checkoutModalContent')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCheckoutModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-close')) return;
    document.getElementById('checkoutModal')?.classList.remove('active');
    document.getElementById('checkoutModalContent')?.classList.remove('active');
    document.body.style.overflow = '';
}

async function processOrder() {
    const email = document.getElementById('chkEmail')?.value;
    const firstName = document.getElementById('chkFirstName')?.value;
    const lastName = document.getElementById('chkLastName')?.value;
    const address = document.getElementById('chkAddress')?.value;
    const city = document.getElementById('chkCity')?.value;
    const zip = document.getElementById('chkZip')?.value;
    const card = document.getElementById('chkCard')?.value;
    const expiry = document.getElementById('chkExpiry')?.value;
    const cvc = document.getElementById('chkCvc')?.value;
    if (!email || !firstName || !lastName || !address || !city || !zip || !card || !expiry || !cvc) {
        showToast('Please fill in all fields.', 'error');
        return;
    }
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = subtotal > 100 ? 0 : 12;
    const total = subtotal + shipping;
    try {
        await api('/api/orders', {
            method: 'POST',
            body: JSON.stringify({
                email, first_name: firstName, last_name: lastName,
                address, city, zip, total, shipping,
                items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }))
            })
        });
        cart = [];
        saveCart();
        updateCartUI();
        closeCheckoutModal();
        showToast('Order placed successfully! Thank you.', 'success');
        loadProducts();
    } catch (err) {
        showToast(err.message || 'Checkout failed. Please try again.', 'error');
    }
}

// Toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-icon">${type === 'success' ? '✓' : '!'}</div><div class="toast-message">${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Newsletter
async function handleNewsletter(e) {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail')?.value;
    if (!email) return;
    try {
        const res = await api('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
        e.target.reset();
        showToast(res.message, 'success');
    } catch (err) {
        showToast(err.message || 'Subscription failed.', 'error');
    }
}

// Contact
async function handleContact(e) {
    e.preventDefault();
    const name = document.getElementById('contactName')?.value;
    const email = document.getElementById('contactEmail')?.value;
    const subject = document.getElementById('contactSubject')?.value;
    const message = document.getElementById('contactMessage')?.value;
    try {
        await api('/api/contact', {
            method: 'POST',
            body: JSON.stringify({ name, email, subject, message })
        });
        e.target.reset();
        showToast('Message sent! We will get back to you soon.', 'success');
    } catch (err) {
        showToast(err.message || 'Failed to send message.', 'error');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
        closeCheckoutModal();
        document.getElementById('cartOverlay')?.classList.remove('active');
        document.getElementById('cartSidebar')?.classList.remove('active');
    }
});
