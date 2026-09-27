# ORHAN · Haute Parfumerie
### Minimalist Luxury Fragrance Store with Supabase Backend

An e-commerce website designed in a **Minimalist Indigo & Champagne Gold luxury aesthetic** for **Orhan Perfume Store**.

The store is built with pure semantic HTML5, modern CSS3, vanilla JavaScript, and connects directly to your **Supabase** backend. It starts with **no hardcoded products**, allowing you to curate your own fragrances, scent notes, descriptions, and images directly through the included browser-based **Admin Portal**.

---

## 📁 Files & Folder Structure

```
orhan_website/
├── index.html                 # Main Luxury Storefront (Catalog, Cart, Quick View, Philosophy)
├── admin.html                 # Admin Dashboard to Add, Edit & Delete Fragrances
├── supabase-schema.sql        # Database schema & RLS policies to run in Supabase SQL editor
├── README.md                  # Complete setup and user documentation
├── css/
│   ├── style.css              # Storefront styles (Indigo luxury palette, typography, dialogs)
│   └── admin.css              # Minimalist dashboard styles for fragrance management
├── js/
│   ├── supabase-client.js     # Supabase client setup with credentials & CRUD helpers
│   ├── app.js                 # Storefront controller: dynamic catalog, filters, cart drawer, modals
│   └── admin.js               # Admin controller: add/edit/delete fragrances, image URL previews
└── assets/
    ├── icons/
    │   └── flacon.svg         # Bespoke minimalist luxury perfume flacon vector
    └── images/
        └── hero-pattern.svg   # Atmospheric deep indigo vector hero pattern
```

---

## 🚀 Quick Setup Guide (3 Simple Steps)

### Step 1: Initialize your Supabase Database
Your Supabase project is active at: `https://qwltmvyoogwefrnmoulf.supabase.co`

1. Open your Supabase Dashboard SQL Editor:  
   👉 **[Supabase SQL Editor](https://supabase.com/dashboard/project/qwltmvyoogwefrnmoulf/sql)**
2. Click **New query**.
3. Open the file `supabase-schema.sql` in this folder, copy all contents, paste into the SQL editor, and click **RUN** (or press `Ctrl + Enter`).
4. This instantly creates:
   - `public.products` (for your fragrances, notes, prices, flacons, categories)
   - `public.orders` (for orders placed by customers)
   - `public.newsletter` (for VIP club subscriptions)
   - Row Level Security (RLS) policies allowing public browsing and administration.

---

### Step 2: Open or Run the Website
You can launch the website in multiple ways:
- **Directly**: Double-click `index.html` to open it in any browser (Chrome, Edge, Safari, Firefox).
- **With a local web server** (Recommended for local dev):
  ```bash
  # Using Node.js npx:
  npx serve .
  
  # Or using Python:
  python -m http.server 8000
  ```
- **Deploy to Web**: Drag and drop this folder directly to [Netlify Drop](https://app.netlify.com/drop), [Vercel](https://vercel.com), or push to GitHub Pages. It requires zero build step or npm compilation.

---

### Step 3: Add Your Fragrances & Images
You do not need to write SQL or code to populate your store:

1. Open **`admin.html`** in your browser (or click the **Admin Portal** button in the storefront header).
2. Enter your fragrance details:
   - **Name**: e.g., *Santal Mystique*, *Oud Royal*, *Rose Impériale*
   - **Category**: *Eau de Parfum*, *Extrait de Parfum*, *Oud & Oriental*, *Floral & Citrus*, *Woody & Amber*, etc.
   - **Price**: e.g., `185.00`
   - **Volume**: e.g., `100ml / 3.4 FL. OZ.`
   - **Olfactory Notes**:
     - *Top Notes*: Initial evanescent scent (e.g. *Calabrian Bergamot, Pink Peppercorn*)
     - *Heart Notes*: Core personality (e.g. *Turkish Rose, Cardamom, Florentine Iris*)
     - *Base Notes*: Long-lasting sillage (e.g. *Aged Agarwood, Sandalwood, Golden Amber*)
   - **Description**: The evocative scent story.
   - **Image URL**: Paste any direct image link or Supabase Storage public URL.  
     *(Note: If left empty, the site automatically displays a bespoke minimalist indigo & champagne gold flacon vector art!)*
3. Click **Save to Supabase**.
4. Visit `index.html` — your fragrance immediately appears in your live store!

---

## ✨ Design & Features

- **Color Scheme**: Deep Midnight Indigo (`#090a14`, `#121324`), Royal Indigo (`#3730a3`, `#4338ca`), Soft Porcelain Wash (`#f8f9ff`), and Warm Champagne Gold (`#c5a880`).
- **Typography**: Editorial serif headers (*Cormorant Garamond* & *Cinzel*) paired with clean geometric body (*Plus Jakarta Sans*).
- **Dynamic Catalog**: Real-time category filtering (Eau de Parfum, Extrait, Oud, Floral, Woody), keyword search with note recognition, and sorting by price or rating.
- **Native `<dialog>` Architecture**:
  - Accessible **Quick View Modal** featuring the complete Olfactory Pyramid architecture.
  - Slide-over **Shopping Bag Drawer** with quantity controls, calculated subtotals, and persistent `localStorage` syncing.
  - Bespoke **Checkout Dialog** connected to the Supabase `orders` table.
- **Micro-Interactions**: Floating luxury toasts, card hover elevation, live image link validator, and live Supabase connectivity status indicators.
