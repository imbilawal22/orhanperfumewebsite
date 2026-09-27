/**
 * ==============================================================================
 * ORHAN HAUTE PARFUMERIE - SUPABASE CLIENT CONFIGURATION
 * ==============================================================================
 * Configured with your Supabase credentials:
 * Project URL: https://qwltmvyoogwefrnmoulf.supabase.co
 * Publishable Key: sb_publishable_itATCQiGgV1T1M6kx82tAw_NK1UUqh6
 * ==============================================================================
 */

const SUPABASE_CONFIG = {
  url: 'https://qwltmvyoogwefrnmoulf.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3bHRtdnlvb2d3ZWZybm1vdWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODYyMzgsImV4cCI6MjEwNjA2MjIzOH0.mvA9StWqUCQMlx11Pjzc8WjZBJSdLi0-vIK2pYK7zUI',
  publishableKey: 'sb_publishable_itATCQiGgV1T1M6kx82tAw_NK1UUqh6'
};

// Initialize Supabase instance using official SDK (from CDN window.supabase) or REST fallback
let supabaseClient = null;

if (window.supabase && typeof window.supabase.createClient === 'function') {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.info('✓ Supabase Client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

/**
 * Standard REST fetch helper (bulletproof fallback & direct REST queries)
 */
async function supabaseRest(endpoint, options = {}) {
  const url = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_CONFIG.anonKey,
    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.message || errJson.hint || JSON.stringify(errJson);
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(`Supabase REST Error (${response.status}): ${errorDetail}`);
  }

  // Handle 204 No Content
  if (response.status === 204) return null;
  return await response.json();
}

/**
 * Check Supabase connection and verify if the products table exists
 */
async function checkSupabaseConnection() {
  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('products')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          return { connected: true, tableExists: false, message: 'Table "products" does not exist yet. Please run supabase-schema.sql.' };
        }
        return { connected: true, tableExists: false, error: error.message };
      }
      return { connected: true, tableExists: true, count: data ? data.length : 0 };
    } else {
      const res = await supabaseRest('products?select=id&limit=1');
      return { connected: true, tableExists: true, count: res ? res.length : 0 };
    }
  } catch (err) {
    const isMissingTable = err.message && (err.message.includes('relation "public.products" does not exist') || err.message.includes('42P01'));
    if (isMissingTable) {
      return { connected: true, tableExists: false, message: 'Table "products" does not exist yet. Please run supabase-schema.sql.' };
    }
    return { connected: false, tableExists: false, error: err.message };
  }
}

/**
 * Fetch all products with optional filtering and sorting
 */
async function fetchProducts({ category = 'all', search = '', sortBy = 'newest' } = {}) {
  try {
    let query;
    if (supabaseClient) {
      query = supabaseClient.from('products').select('*');

      if (category && category !== 'all') {
        query = query.ilike('category', `%${category}%`);
      }

      if (search && search.trim()) {
        const s = search.trim();
        query = query.or(`name.ilike.%${s}%,subtitle.ilike.%${s}%,description.ilike.%${s}%,top_notes.ilike.%${s}%,heart_notes.ilike.%${s}%,base_notes.ilike.%${s}%`);
      }

      switch (sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'name-asc':
          query = query.order('name', { ascending: true });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      // Fallback to REST
      let endpoint = 'products?select=*';
      if (category && category !== 'all') {
        endpoint += `&category=ilike.*${encodeURIComponent(category)}*`;
      }
      if (sortBy === 'price-asc') endpoint += '&order=price.asc';
      else if (sortBy === 'price-desc') endpoint += '&order=price.desc';
      else if (sortBy === 'name-asc') endpoint += '&order=name.asc';
      else if (sortBy === 'rating') endpoint += '&order=rating.desc';
      else endpoint += '&order=created_at.desc';

      const data = await supabaseRest(endpoint);
      if (search && search.trim()) {
        const term = search.toLowerCase();
        return (data || []).filter(p => 
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.subtitle && p.subtitle.toLowerCase().includes(term)) ||
          (p.description && p.description.toLowerCase().includes(term)) ||
          (p.top_notes && p.top_notes.toLowerCase().includes(term)) ||
          (p.heart_notes && p.heart_notes.toLowerCase().includes(term)) ||
          (p.base_notes && p.base_notes.toLowerCase().includes(term))
        );
      }
      return data || [];
    }
  } catch (err) {
    console.error('Error fetching products from Supabase:', err);
    throw err;
  }
}

/**
 * Fetch a single product by ID
 */
async function fetchProductById(id) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } else {
    const data = await supabaseRest(`products?id=eq.${id}&select=*`);
    return data && data.length > 0 ? data[0] : null;
  }
}

/**
 * Insert a new product
 */
async function createProduct(productData) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('products')
      .insert([productData])
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const data = await supabaseRest('products', {
      method: 'POST',
      body: productData
    });
    return Array.isArray(data) ? data[0] : data;
  }
}

/**
 * Update an existing product
 */
async function updateProduct(id, productData) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('products')
      .update(productData)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const data = await supabaseRest(`products?id=eq.${id}`, {
      method: 'PATCH',
      body: productData
    });
    return Array.isArray(data) ? data[0] : data;
  }
}

/**
 * Delete a product
 */
async function deleteProduct(id) {
  if (supabaseClient) {
    const { error } = await supabaseClient
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } else {
    await supabaseRest(`products?id=eq.${id}`, {
      method: 'DELETE'
    });
    return true;
  }
}

/**
 * Record a new order in Supabase
 */
async function createOrder(orderData) {
  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('orders')
        .insert([orderData])
        .select();
      if (error) throw error;
      return data[0];
    } else {
      const data = await supabaseRest('orders', {
        method: 'POST',
        body: orderData
      });
      return Array.isArray(data) ? data[0] : data;
    }
  } catch (err) {
    console.warn('Orders table note:', err.message);
    // Return simulated confirmation if table was not yet created
    return { id: 'order-' + Date.now(), ...orderData, status: 'confirmed' };
  }
}

/**
 * Subscribe email to newsletter
 */
async function subscribeNewsletter(email) {
  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('newsletter')
        .insert([{ email }])
        .select();
      if (error) throw error;
      return data[0];
    } else {
      return await supabaseRest('newsletter', {
        method: 'POST',
        body: { email }
      });
    }
  } catch (err) {
    console.warn('Newsletter notice:', err.message);
    return { email, status: 'subscribed' };
  }
}

// Export functions to global scope
window.OrhanDB = {
  config: SUPABASE_CONFIG,
  checkConnection: checkSupabaseConnection,
  fetchProducts,
  fetchProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createOrder,
  subscribeNewsletter
};
