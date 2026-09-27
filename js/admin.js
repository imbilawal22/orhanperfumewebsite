/**
 * ==============================================================================
 * ORHAN HAUTE PARFUMERIE - ADMIN CONTROLLER
 * ==============================================================================
 */

const AdminApp = (() => {
  let productsCache = [];

  // DOM Elements cache
  const el = {};

  async function init() {
    cacheDom();
    bindEvents();
    await checkHealth();
    await loadCatalog();
  }

  function cacheDom() {
    el.form = document.getElementById('product-form');
    el.editId = document.getElementById('edit-id');
    el.formTitle = document.getElementById('form-title');
    el.formModeBadge = document.getElementById('form-mode-badge');
    el.btnSubmit = document.getElementById('btn-save-prod');
    el.btnCancel = document.getElementById('btn-cancel-edit');
    el.tableBody = document.getElementById('catalog-table-body');
    el.totalCount = document.getElementById('total-count');
    el.dbStatusDot = document.getElementById('db-status-dot');
    el.dbStatusText = document.getElementById('db-status-text');
    el.schemaNotice = document.getElementById('schema-notice');

    // Inputs
    el.name = document.getElementById('prod-name');
    el.category = document.getElementById('prod-category');
    el.subtitle = document.getElementById('prod-subtitle');
    el.price = document.getElementById('prod-price');
    el.volume = document.getElementById('prod-volume');
    el.stock = document.getElementById('prod-stock');
    el.rating = document.getElementById('prod-rating');
    el.topNotes = document.getElementById('prod-top-notes');
    el.heartNotes = document.getElementById('prod-heart-notes');
    el.baseNotes = document.getElementById('prod-base-notes');
    el.desc = document.getElementById('prod-desc');
    el.image = document.getElementById('prod-image');
    el.featured = document.getElementById('prod-featured');

    // Preview
    el.previewImg = document.getElementById('preview-img');
    el.previewCaption = document.getElementById('preview-caption');
  }

  function bindEvents() {
    if (el.form) {
      el.form.addEventListener('submit', handleSubmit);
    }

    if (el.image) {
      el.image.addEventListener('input', handleImagePreview);
    }
  }

  /**
   * Check connection to Supabase and database table existence
   */
  async function checkHealth() {
    el.dbStatusText.textContent = 'Verifying Supabase...';
    try {
      const res = await OrhanDB.checkConnection();
      if (res.connected) {
        if (res.tableExists) {
          el.dbStatusDot.style.backgroundColor = '#10b981';
          el.dbStatusText.textContent = 'Supabase Connected & Active';
          if (el.schemaNotice) el.schemaNotice.style.display = 'none';
        } else {
          el.dbStatusDot.style.backgroundColor = '#f59e0b';
          el.dbStatusText.textContent = 'Supabase Active (Tables Pending)';
          if (el.schemaNotice) el.schemaNotice.style.display = 'flex';
        }
      } else {
        el.dbStatusDot.style.backgroundColor = '#ef4444';
        el.dbStatusText.textContent = 'Connection Error';
      }
    } catch (err) {
      el.dbStatusDot.style.backgroundColor = '#ef4444';
      el.dbStatusText.textContent = 'Supabase Offline';
    }
  }

  /**
   * Handle image input live preview
   */
  function handleImagePreview() {
    const url = el.image.value.trim();
    if (url) {
      el.previewImg.src = url;
      el.previewCaption.textContent = 'Live Image Preview';
      el.previewImg.onerror = () => {
        el.previewImg.src = 'assets/icons/flacon.svg';
        el.previewCaption.textContent = 'Unable to load URL · Showing placeholder flacon';
      };
      el.previewImg.onload = () => {
        if (el.previewImg.src !== window.location.origin + '/assets/icons/flacon.svg') {
          el.previewCaption.textContent = '✓ Image loaded successfully';
        }
      };
    } else {
      el.previewImg.src = 'assets/icons/flacon.svg';
      el.previewCaption.textContent = 'Using default vector flacon flacon.svg';
    }
  }

  /**
   * Load products list from Supabase
   */
  async function loadCatalog() {
    if (!el.tableBody) return;
    el.tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-table-state">
          <p>Querying Supabase database...</p>
        </td>
      </tr>
    `;

    try {
      const products = await OrhanDB.fetchProducts({ sortBy: 'newest' });
      productsCache = products;
      renderTable(products);
      if (el.totalCount) el.totalCount.textContent = products.length;
    } catch (err) {
      console.error('Failed to load catalog:', err);
      el.tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-table-state" style="color: #ef4444;">
            <p><strong>Error loading catalog:</strong> ${escapeHtml(err.message)}</p>
            <p style="font-size: 0.8rem; margin-top: 0.5rem; color: #64748b;">
              Ensure you have run <code>supabase-schema.sql</code> in your Supabase SQL editor.
            </p>
          </td>
        </tr>
      `;
    }
  }

  /**
   * Render catalog table rows
   */
  function renderTable(products) {
    if (!products || products.length === 0) {
      el.tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-table-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <p style="font-weight: 600; color: var(--indigo-950); margin-bottom: 0.25rem;">No fragrances found in Supabase</p>
            <p style="font-size: 0.82rem; color: var(--text-secondary);">Use the form on the left to add your first perfume, or click "+ Seed Sample Fragrances" above to test.</p>
          </td>
        </tr>
      `;
      return;
    }

    el.tableBody.innerHTML = products.map(p => {
      const thumb = (p.image_url && p.image_url.trim()) ? p.image_url : 'assets/icons/flacon.svg';
      const price = Number(p.price).toFixed(2);

      return `
        <tr data-id="${p.id}">
          <td>
            <div class="product-row-title">
              <div class="table-thumb">
                <img src="${thumb}" alt="${escapeHtml(p.name)}" onerror="this.src='assets/icons/flacon.svg'">
              </div>
              <div>
                <strong>${escapeHtml(p.name)}</strong>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                  ${escapeHtml(p.subtitle || p.volume || '')}
                  ${p.is_featured ? '· <span style="color: #c5a880; font-weight: 600;">Featured</span>' : ''}
                </div>
              </div>
            </div>
          </td>
          <td><span style="background: var(--indigo-50); color: var(--indigo-700); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${escapeHtml(p.category)}</span></td>
          <td><strong>$${price}</strong></td>
          <td>${p.stock !== null ? p.stock : '—'}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-table-edit" onclick="AdminApp.editProduct('${p.id}')">Edit</button>
              <button type="button" class="btn-table-del" onclick="AdminApp.deleteProduct('${p.id}', '${escapeHtml(p.name)}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Handle form submit (Insert or Update)
   */
  async function handleSubmit(e) {
    e.preventDefault();

    const isEditing = !!el.editId.value;
    const originalBtnText = el.btnSubmit.innerHTML;

    el.btnSubmit.disabled = true;
    el.btnSubmit.innerHTML = '<span>Saving to Supabase...</span>';

    const payload = {
      name: el.name.value.trim(),
      category: el.category.value,
      subtitle: el.subtitle.value.trim() || 'Eau de Parfum',
      price: parseFloat(el.price.value) || 0,
      volume: el.volume.value.trim() || '100ml / 3.4 FL. OZ.',
      stock: parseInt(el.stock.value) || 0,
      rating: parseFloat(el.rating.value) || 4.9,
      top_notes: el.topNotes.value.trim() || null,
      heart_notes: el.heartNotes.value.trim() || null,
      base_notes: el.baseNotes.value.trim() || null,
      description: el.desc.value.trim() || null,
      image_url: el.image.value.trim() || null,
      is_featured: el.featured.checked
    };

    try {
      if (isEditing) {
        await OrhanDB.updateProduct(el.editId.value, payload);
        alert(`✓ Fragrance "${payload.name}" updated successfully in Supabase!`);
      } else {
        await OrhanDB.createProduct(payload);
        alert(`✓ Fragrance "${payload.name}" published successfully to Supabase!`);
      }

      resetForm();
      await loadCatalog();
    } catch (err) {
      console.error('Save error:', err);
      alert(`Error saving to Supabase: ${err.message}\n\nTip: Ensure you have executed supabase-schema.sql in your Supabase SQL editor.`);
    } finally {
      el.btnSubmit.disabled = false;
      el.btnSubmit.innerHTML = originalBtnText;
    }
  }

  /**
   * Edit product: populate form
   */
  function editProduct(id) {
    const product = productsCache.find(p => p.id === id);
    if (!product) return;

    el.editId.value = product.id;
    el.name.value = product.name || '';
    el.category.value = product.category || 'Eau de Parfum';
    el.subtitle.value = product.subtitle || '';
    el.price.value = product.price || '';
    el.volume.value = product.volume || '';
    el.stock.value = product.stock !== undefined ? product.stock : 25;
    el.rating.value = product.rating || 4.9;
    el.topNotes.value = product.top_notes || '';
    el.heartNotes.value = product.heart_notes || '';
    el.baseNotes.value = product.base_notes || '';
    el.desc.value = product.description || '';
    el.image.value = product.image_url || '';
    el.featured.checked = !!product.is_featured;

    handleImagePreview();

    el.formTitle.textContent = `Edit Fragrance`;
    el.formModeBadge.textContent = 'Editing Mode';
    el.btnSubmit.innerHTML = '<span>Update Fragrance</span>';
    el.btnCancel.style.display = 'inline-block';

    const formCard = document.getElementById('form-card');
    if (formCard) formCard.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Delete product from Supabase
   */
  async function deleteProduct(id, name) {
    const confirmed = confirm(`Are you sure you want to permanently delete "${name}" from your Supabase catalog?`);
    if (!confirmed) return;

    try {
      await OrhanDB.deleteProduct(id);
      alert(`✓ Fragrance "${name}" was deleted.`);
      await loadCatalog();
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Failed to delete: ${err.message}`);
    }
  }

  /**
   * Reset form to default Add mode
   */
  function resetForm() {
    el.form.reset();
    el.editId.value = '';
    el.formTitle.textContent = 'Add New Fragrance';
    el.formModeBadge.textContent = 'New Item';
    el.btnSubmit.innerHTML = '<span>Save to Supabase</span>';
    el.btnCancel.style.display = 'none';

    el.volume.value = '100ml / 3.4 FL. OZ.';
    el.subtitle.value = 'Eau de Parfum';
    el.stock.value = '25';
    el.rating.value = '4.9';

    handleImagePreview();
  }

  /**
   * Seed sample data helper
   */
  async function seedSampleData() {
    const confirmSeed = confirm('Do you want to insert 3 luxury sample fragrances into your Supabase database? You can edit or delete them anytime.');
    if (!confirmSeed) return;

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
      for (const item of sampleFragrances) {
        await OrhanDB.createProduct(item);
      }
      alert('✓ 3 sample fragrances successfully created in Supabase!');
      await loadCatalog();
    } catch (err) {
      alert(`Failed to seed: ${err.message}\nMake sure supabase-schema.sql has been run.`);
    }
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

  return {
    checkHealth,
    loadCatalog,
    editProduct,
    deleteProduct,
    resetForm,
    seedSampleData
  };
})();
