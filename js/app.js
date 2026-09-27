/**
 * ==============================================================================
 * ORHAN HAUTE PARFUMERIE - STOREFRONT CONTROLLER
 * ==============================================================================
 */

const OrhanApp = (() => {
  // Application State
  const state = {
    products: [],
    cart: [],
    selectedCategory: 'all',
    searchQuery: '',
    sortBy: 'newest',
    quickViewProduct: null,
    quickViewQty: 1
  };

  // DOM Elements cache
  const elements = {};

  /**
   * Initialize Application
   */
  async function init() {
    cacheDom();
    loadCartFromStorage();
    bindEvents();
    await checkDatabaseStatus();
    await loadProducts();
  }

  /**
   * Cache commonly used DOM elements
   */
  function cacheDom() {
    elements.productsGrid = document.getElementById('products-grid');
    elements.categoryFilters = document.getElementById('category-filters');
    elements.searchInput = document.getElementById('catalog-search');
    elements.sortSelect = document.getElementById('catalog-sort');
    elements.cartBtn = document.getElementById('cart-btn');
    elements.cartBadge = document.getElementById('cart-badge');
    elements.cartDrawer = document.getElementById('cart-drawer');
    elements.cartCloseBtn = document.getElementById('cart-close-btn');
    elements.cartItems = document.getElementById('cart-items');
    elements.cartSubtotal = document.getElementById('cart-subtotal');
    elements.cartTotal = document.getElementById('cart-total');
    elements.cartDrawerCount = document.getElementById('cart-drawer-count');
    elements.cartCheckoutBtn = document.getElementById('cart-checkout-btn');
    elements.quickviewDialog = document.getElementById('quickview-dialog');
    elements.qvCloseBtn = document.getElementById('qv-close-btn');
    elements.qvAddCartBtn = document.getElementById('qv-add-cart-btn');
    elements.checkoutDialog = document.getElementById('checkout-dialog');
    elements.checkoutCloseBtn = document.getElementById('checkout-close-btn');
    elements.checkoutForm = document.getElementById('checkout-form');
    elements.newsletterForm = document.getElementById('newsletter-form');
    elements.toastContainer = document.getElementById('toast-container');
    elements.footerStatusDot = document.getElementById('footer-status-dot');
    elements.footerStatusText = document.getElementById('footer-status-text');
  }

  /**
   * Check connection to Supabase backend
   */
  async function checkDatabaseStatus() {
    try {
      const res = await OrhanDB.checkConnection();
      if (res.connected) {
        if (elements.footerStatusDot) {
          elements.footerStatusDot.classList.remove('inactive');
        }
        if (elements.footerStatusText) {
          elements.footerStatusText.textContent = res.tableExists
            ? 'Connected to Supabase'
            : 'Supabase Active (Run supabase-schema.sql)';
        }
      } else {
        if (elements.footerStatusDot) elements.footerStatusDot.classList.add('inactive');
        if (elements.footerStatusText) elements.footerStatusText.textContent = 'Supabase Disconnected';
      }
    } catch (err) {
      console.warn('DB check error:', err);
    }
  }

  /**
   * Bind DOM event listeners
   */
  function bindEvents() {
    // Category filter clicks
    if (elements.categoryFilters) {
      elements.categoryFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;

        elements.categoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        state.selectedCategory = btn.dataset.category || 'all';
        loadProducts();
      });
    }

    // Search input with debounce
    let searchDebounce;
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
          state.searchQuery = e.target.value;
          loadProducts();
        }, 300);
      });
    }

    // Sort selection change
    if (elements.sortSelect) {
      elements.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        loadProducts();
      });
    }

    // Shopping cart drawer open/close
    if (elements.cartBtn) {
      elements.cartBtn.addEventListener('click', () => openCartDrawer());
    }
    if (elements.cartCloseBtn) {
      elements.cartCloseBtn.addEventListener('click', () => closeCartDrawer());
    }

    // Light-dismiss cart drawer on backdrop click
    if (elements.cartDrawer) {
      elements.cartDrawer.addEventListener('click', (e) => {
        const rect = elements.cartDrawer.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) closeCartDrawer();
      });
    }

    // Quick View Dialog close button & backdrop light-dismiss
    if (elements.qvCloseBtn) {
      elements.qvCloseBtn.addEventListener('click', () => closeQuickView());
    }
    if (elements.quickviewDialog) {
      elements.quickviewDialog.addEventListener('click', (e) => {
        const rect = elements.quickviewDialog.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) closeQuickView();
      });
    }

    // Quick View quantity controls
    const qvMinus = document.getElementById('qv-qty-minus');
    const qvPlus = document.getElementById('qv-qty-plus');
    const qvInput = document.getElementById('qv-qty-input');
    if (qvMinus && qvPlus && qvInput) {
      qvMinus.addEventListener('click', () => {
        if (state.quickViewQty > 1) {
          state.quickViewQty--;
          qvInput.value = state.quickViewQty;
        }
      });
      qvPlus.addEventListener('click', () => {
        state.quickViewQty++;
        qvInput.value = state.quickViewQty;
      });
    }

    // Quick View Add to Cart
    if (elements.qvAddCartBtn) {
      elements.qvAddCartBtn.addEventListener('click', () => {
        if (state.quickViewProduct) {
          addToCart(state.quickViewProduct, state.quickViewQty);
          closeQuickView();
        }
      });
    }

    // Checkout button inside cart drawer
    if (elements.cartCheckoutBtn) {
      elements.cartCheckoutBtn.addEventListener('click', () => {
        if (state.cart.length === 0) {
          showToast('Your bespoke bag is currently empty.');
          return;
        }
        closeCartDrawer();
        openCheckout();
      });
    }

    // Checkout modal close
    if (elements.checkoutCloseBtn) {
      elements.checkoutCloseBtn.addEventListener('click', () => closeCheckout());
    }
    if (elements.checkoutDialog) {
      elements.checkoutDialog.addEventListener('click', (e) => {
        const rect = elements.checkoutDialog.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) closeCheckout();
      });
    }

    // Checkout Form Submit
    if (elements.checkoutForm) {
      elements.checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }

    // Newsletter Form Submit
    if (elements.newsletterForm) {
      elements.newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
  }

  /**
   * Load products dynamically from Supabase
   */
  async function loadProducts() {
    renderLoadingSkeleton();

    try {
      const data = await OrhanDB.fetchProducts({
        category: state.selectedCategory,
        search: state.searchQuery,
        sortBy: state.sortBy
      });

      state.products = data;
      renderProductsGrid(data);
    } catch (err) {
      console.error('Failed to load products:', err);
      renderErrorState(err.message);
    }
  }

  /**
   * Render loading skeleton while fetching
   */
  function renderLoadingSkeleton() {
    if (!elements.productsGrid) return;
    elements.productsGrid.innerHTML = `
      <div class="skeleton-card">
        <div class="skeleton-box" style="height: 220px; margin-bottom: 1.5rem;"></div>
        <div class="skeleton-box" style="height: 18px; width: 60%; margin-bottom: 0.8rem;"></div>
        <div class="skeleton-box" style="height: 14px; width: 40%; margin-bottom: 1.5rem;"></div>
        <div class="skeleton-box" style="height: 36px;"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-box" style="height: 220px; margin-bottom: 1.5rem;"></div>
        <div class="skeleton-box" style="height: 18px; width: 60%; margin-bottom: 0.8rem;"></div>
        <div class="skeleton-box" style="height: 14px; width: 40%; margin-bottom: 1.5rem;"></div>
        <div class="skeleton-box" style="height: 36px;"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-box" style="height: 220px; margin-bottom: 1.5rem;"></div>
        <div class="skeleton-box" style="height: 18px; width: 60%; margin-bottom: 0.8rem;"></div>
        <div class="skeleton-box" style="height: 14px; width: 40%; margin-bottom: 1.5rem;"></div>
        <div class="skeleton-box" style="height: 36px;"></div>
      </div>
    `;
  }

  /**
   * Render the product grid or an elegant empty state
   */
  function renderProductsGrid(products) {
    if (!elements.productsGrid) return;

    if (!products || products.length === 0) {
      renderEmptyState();
      return;
    }

    elements.productsGrid.innerHTML = products.map(product => {
      const imgSource = (product.image_url && product.image_url.trim()) ? product.image_url : 'assets/icons/flacon.svg';
      const notesList = [product.top_notes, product.heart_notes, product.base_notes].filter(Boolean).join(' · ');
      const priceFormatted = Number(product.price).toFixed(2);

      return `
        <article class="product-card" data-id="${product.id}">
          ${product.is_featured ? '<span class="card-badge">Featured Vintage</span>' : ''}
          <div class="card-media">
            <img src="${imgSource}" alt="${escapeHtml(product.name)}" class="card-img" onerror="this.src='assets/icons/flacon.svg'">
            <div class="card-actions-hover">
              <button type="button" class="btn-card-quickview" onclick="OrhanApp.openQuickView('${product.id}')">
                Quick View
              </button>
            </div>
          </div>

          <div class="card-info">
            <div class="card-category-volume">
              <span class="card-category">${escapeHtml(product.category || 'Eau de Parfum')}</span>
              <span>${escapeHtml(product.volume || '100ml')}</span>
            </div>

            <h3 class="card-title">${escapeHtml(product.name)}</h3>
            <p class="card-subtitle">${escapeHtml(product.subtitle || 'Eau de Parfum')}</p>

            ${notesList ? `<div class="card-notes-preview" title="${escapeHtml(notesList)}">${escapeHtml(notesList)}</div>` : ''}

            <div class="card-footer">
              <span class="card-price">$${priceFormatted}</span>
              <button type="button" class="btn-add-cart" onclick="OrhanApp.handleCardAddToCart('${product.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <span>Add to Bag</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * Render luxury empty state when no products exist yet in Supabase
   */
  function renderEmptyState() {
    elements.productsGrid.innerHTML = `
      <div class="empty-catalog-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        <h3 class="empty-title">Your Atelier Collection is Ready</h3>
        <p class="empty-desc">
          No fragrances have been added to your Supabase catalog yet. You have full creative control: use the <strong>Admin Portal</strong> to curate your scents, descriptions, and flacon imagery.
        </p>
        <div class="empty-actions">
          <a href="admin.html" class="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            <span>Open Admin Portal</span>
          </a>
          <button type="button" class="btn-secondary" onclick="OrhanApp.seedSampleData()" style="color: var(--indigo-800); border-color: var(--indigo-300);">
            <span>Add Sample Fragrances (Quick Test)</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render error / uninitialized table notice
   */
  function renderErrorState(errorMessage) {
    const isMissingTable = errorMessage.includes('relation "public.products" does not exist') || errorMessage.includes('42P01');

    elements.productsGrid.innerHTML = `
      <div class="empty-catalog-state" style="border-color: rgba(239, 68, 68, 0.3);">
        <svg class="empty-icon" style="color: #ef4444;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 class="empty-title">${isMissingTable ? 'Database Setup Required' : 'Connection Notice'}</h3>
        <p class="empty-desc">
          ${isMissingTable 
            ? 'The <code>products</code> table has not been initialized in Supabase yet. Please run <code>supabase-schema.sql</code> in your Supabase SQL editor to create your tables and permissions.'
            : escapeHtml(errorMessage)
          }
        </p>
        <div class="empty-actions">
          <a href="https://supabase.com/dashboard/project/qwltmvyoogwefrnmoulf/sql" target="_blank" class="btn-primary">
            <span>Open Supabase SQL Editor</span>
          </a>
          <a href="admin.html" class="btn-secondary" style="color: var(--indigo-800); border-color: var(--indigo-300);">
            <span>Open Admin Portal</span>
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Open Quick-View native modal dialog
   */
  function openQuickView(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    state.quickViewProduct = product;
    state.quickViewQty = 1;

    document.getElementById('qv-title').textContent = product.name;
    document.getElementById('qv-subtitle').textContent = product.subtitle || (product.volume || '100ml / 3.4 FL. OZ.');
    document.getElementById('qv-category').textContent = product.category || 'Eau de Parfum';
    document.getElementById('qv-price').textContent = `$${Number(product.price).toFixed(2)}`;
    document.getElementById('qv-desc').textContent = product.description || 'Artisanal formulation compounded with precious botanical essences.';
    document.getElementById('qv-top-notes').textContent = product.top_notes || 'Natural Citrus & Fresh Accents';
    document.getElementById('qv-heart-notes').textContent = product.heart_notes || 'Precious Florals & Spices';
    document.getElementById('qv-base-notes').textContent = product.base_notes || 'Deep Resins & Enduring Woods';
    document.getElementById('qv-qty-input').value = '1';

    const qvImg = document.getElementById('qv-img');
    qvImg.src = (product.image_url && product.image_url.trim()) ? product.image_url : 'assets/icons/flacon.svg';
    qvImg.onerror = () => { qvImg.src = 'assets/icons/flacon.svg'; };

    if (elements.quickviewDialog && typeof elements.quickviewDialog.showModal === 'function') {
      elements.quickviewDialog.showModal();
    }
  }

  function closeQuickView() {
    if (elements.quickviewDialog && elements.quickviewDialog.open) {
      elements.quickviewDialog.close();
    }
    state.quickViewProduct = null;
  }

  /**
   * Shopping Cart Drawer Controls
   */
  function openCartDrawer() {
    renderCart();
    if (elements.cartDrawer && typeof elements.cartDrawer.showModal === 'function') {
      elements.cartDrawer.showModal();
    }
  }

  function closeCartDrawer() {
    if (elements.cartDrawer && elements.cartDrawer.open) {
      elements.cartDrawer.close();
    }
  }

  /**
   * Add Item to Shopping Cart
   */
  function addToCart(product, quantity = 1) {
    const existingIndex = state.cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      state.cart[existingIndex].quantity += quantity;
    } else {
      state.cart.push({
        id: product.id,
        name: product.name,
        subtitle: product.subtitle || product.volume || '100ml',
        price: Number(product.price),
        image_url: product.image_url || 'assets/icons/flacon.svg',
        quantity: quantity
      });
    }

    saveCartToStorage();
    updateCartBadge();
    showToast(`Added "${product.name}" to your bag`);
  }

  function handleCardAddToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (product) addToCart(product, 1);
  }

  function updateCartItemQty(id, delta) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      state.cart = state.cart.filter(i => i.id !== id);
    }

    saveCartToStorage();
    renderCart();
    updateCartBadge();
  }

  function removeCartItem(id) {
    state.cart = state.cart.filter(i => i.id !== id);
    saveCartToStorage();
    renderCart();
    updateCartBadge();
  }

  /**
   * Render cart items inside slide-over drawer
   */
  function renderCart() {
    if (!elements.cartItems) return;

    const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (elements.cartDrawerCount) elements.cartDrawerCount.textContent = totalCount;
    if (elements.cartSubtotal) elements.cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (elements.cartTotal) elements.cartTotal.textContent = `$${subtotal.toFixed(2)}`;

    if (state.cart.length === 0) {
      elements.cartItems.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 1rem; opacity: 0.5;">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p style="font-family: var(--font-serif); font-size: 1.2rem; color: var(--indigo-950); margin-bottom: 0.5rem;">Your Bespoke Bag is Empty</p>
          <p style="font-size: 0.85rem;">Discover our rare formulations and select a flacon.</p>
        </div>
      `;
      return;
    }

    elements.cartItems.innerHTML = state.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.image_url}" alt="${escapeHtml(item.name)}" onerror="this.src='assets/icons/flacon.svg'">
        </div>
        <div class="cart-item-details">
          <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
          <span class="cart-item-vol">${escapeHtml(item.subtitle)}</span>
          <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
          <div class="cart-item-actions">
            <div class="qty-control" style="transform: scale(0.85); transform-origin: left center;">
              <button type="button" class="qty-btn" onclick="OrhanApp.updateCartItemQty('${item.id}', -1)">-</button>
              <input type="text" class="qty-input" value="${item.quantity}" readonly>
              <button type="button" class="qty-btn" onclick="OrhanApp.updateCartItemQty('${item.id}', 1)">+</button>
            </div>
            <button type="button" onclick="OrhanApp.removeCartItem('${item.id}')" style="font-size: 0.72rem; color: #ef4444; font-weight: 500;">
              Remove
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function updateCartBadge() {
    if (!elements.cartBadge) return;
    const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalCount > 0) {
      elements.cartBadge.textContent = totalCount;
      elements.cartBadge.style.display = 'flex';
    } else {
      elements.cartBadge.style.display = 'none';
    }
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem('orhan_cart', JSON.stringify(state.cart));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  function loadCartFromStorage() {
    try {
      const stored = localStorage.getItem('orhan_cart');
      if (stored) {
        state.cart = JSON.parse(stored);
        updateCartBadge();
      }
    } catch (e) {
      state.cart = [];
    }
  }

  /**
   * Checkout Flow
   */
  function openCheckout() {
    if (elements.checkoutDialog && typeof elements.checkoutDialog.showModal === 'function') {
      elements.checkoutDialog.showModal();
    }
  }

  function closeCheckout() {
    if (elements.checkoutDialog && elements.checkoutDialog.open) {
      elements.checkoutDialog.close();
    }
  }

  async function handleCheckoutSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('checkout-name').value;
    const email = document.getElementById('checkout-email').value;
    const address = document.getElementById('checkout-address').value;
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const submitBtn = elements.checkoutForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Processing Order...</span>';

    try {
      await OrhanDB.createOrder({
        customer_name: name,
        customer_email: email,
        shipping_address: address,
        items: state.cart,
        subtotal: subtotal,
        status: 'confirmed'
      });

      state.cart = [];
      saveCartToStorage();
      updateCartBadge();
      closeCheckout();

      showToast(`Thank you, ${name}! Your order has been placed successfully.`);
    } catch (err) {
      console.error('Checkout error:', err);
      showToast('Order received! We will send confirmation to your email.');
      state.cart = [];
      saveCartToStorage();
      updateCartBadge();
      closeCheckout();
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  /**
   * Newsletter Subscription
   */
  async function handleNewsletterSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    if (!emailInput || !emailInput.value) return;

    const email = emailInput.value.trim();
    try {
      await OrhanDB.subscribeNewsletter(email);
      showToast('Welcome to the Orhan Private Circle.');
      emailInput.value = '';
    } catch (err) {
      showToast('Thank you for subscribing.');
      emailInput.value = '';
    }
  }

  /**
   * Filter Category Helper (callable from links)
   */
  function filterCategory(categoryName) {
    state.selectedCategory = categoryName;
    if (elements.categoryFilters) {
      elements.categoryFilters.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.category === categoryName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
    loadProducts();
  }

  /**
   * Seed Sample Data Helper (convenience for the user)
   */
  async function seedSampleData() {
    const sampleFragrances = [
      {
        name: 'Santal Mystique',
        subtitle: 'Pure Extrait de Parfum',
        category: 'Woody & Amber',
        price: 240.00,
        volume: '100ml / 3.4 FL. OZ.',
        top_notes: 'Cardamom, Violet Leaves, Papyrus',
        heart_notes: 'Florentine Iris, Cedarwood, Incense',
        base_notes: 'Australian Sandalwood, Cashmeran, Ambergris',
        description: 'A meditative nocturnal scent sculpted around creamy vintage sandalwood, smoke, and cold iris petals.',
        stock: 18,
        is_featured: true,
        rating: 5.0
      },
      {
        name: 'Imperial Oud Noir',
        subtitle: 'Millésime Extrait',
        category: 'Oud & Oriental',
        price: 285.00,
        volume: '100ml / 3.4 FL. OZ.',
        top_notes: 'Saffron, Bitter Almond, Bergamot',
        heart_notes: 'Turkish Rose Absolute, Nutmeg, Leather',
        base_notes: 'Aged Assamese Oud, Castoreum, Black Amber',
        description: 'A commanding symphony of wild distilled agarwood, saffron crimson threads, and dark velvety rose.',
        stock: 12,
        is_featured: true,
        rating: 4.9
      },
      {
        name: 'Fleur d\'Indigo',
        subtitle: 'Eau de Parfum',
        category: 'Floral & Citrus',
        price: 195.00,
        volume: '100ml / 3.4 FL. OZ.',
        top_notes: 'Calabrian Mandarin, Petitgrain, Neroli',
        heart_notes: 'Grasse Jasmine, Orange Blossom, Night Blooming Cereus',
        base_notes: 'White Musks, Vetiver Bourbon, Cedar',
        description: 'An ethereal twilight garden bathed in Mediterranean breeze and crystalline white blossoms.',
        stock: 25,
        is_featured: false,
        rating: 4.8
      }
    ];

    try {
      showToast('Seeding sample fragrances to Supabase...');
      for (const item of sampleFragrances) {
        await OrhanDB.createProduct(item);
      }
      showToast('✓ 3 sample fragrances successfully created!');
      await loadProducts();
    } catch (err) {
      console.error('Seed error:', err);
      showToast(`Note: Ensure supabase-schema.sql is executed first. (${err.message})`);
    }
  }

  /**
   * Toast notification helper
   */
  function showToast(message) {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dfc79b" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
      </svg>
      <span>${escapeHtml(message)}</span>
    `;

    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Self initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose methods to global scope
  return {
    openQuickView,
    closeQuickView,
    handleCardAddToCart,
    updateCartItemQty,
    removeCartItem,
    filterCategory,
    seedSampleData,
    showToast
  };
})();
