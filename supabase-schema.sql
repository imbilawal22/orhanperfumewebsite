-- ==============================================================================
-- ORHAN HAUTE PARFUMERIE - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- 1. Go to https://supabase.com/dashboard/project/qwltmvyoogwefrnmoulf/sql
-- 2. Click "New Query", paste this entire script, and click "RUN" (or Ctrl+Enter).
-- ==============================================================================

-- 1. Create the products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subtitle TEXT DEFAULT 'Eau de Parfum',
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    volume TEXT DEFAULT '100ml / 3.4 FL. OZ.',
    category TEXT NOT NULL DEFAULT 'Eau de Parfum',
    top_notes TEXT,
    heart_notes TEXT,
    base_notes TEXT,
    image_url TEXT,
    stock INTEGER DEFAULT 25,
    is_featured BOOLEAN DEFAULT false,
    rating NUMERIC(2, 1) DEFAULT 4.9,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create index for fast filtering and search
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. Create policy: Anyone can view fragrances (Public Read Access)
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products"
    ON public.products
    FOR SELECT
    USING (true);

-- 5. Create policy: Allow product management via anon/store admin
-- Note: In production you can restrict this to authenticated users if desired.
DROP POLICY IF EXISTS "Allow product insert" ON public.products;
CREATE POLICY "Allow product insert"
    ON public.products
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow product update" ON public.products;
CREATE POLICY "Allow product update"
    ON public.products
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow product delete" ON public.products;
CREATE POLICY "Allow product delete"
    ON public.products
    FOR DELETE
    USING (true);

-- 6. (Optional) Orders Table for tracking purchases/inquiries
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    shipping_address TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can place orders" ON public.orders;
CREATE POLICY "Public can place orders"
    ON public.orders
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read orders" ON public.orders;
CREATE POLICY "Admin can read orders"
    ON public.orders
    FOR SELECT
    USING (true);

-- 7. (Optional) Newsletter subscriptions table
CREATE TABLE IF NOT EXISTS public.newsletter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter;
CREATE POLICY "Public can subscribe to newsletter"
    ON public.newsletter
    FOR INSERT
    WITH CHECK (true);
