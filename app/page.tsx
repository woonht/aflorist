import { createClient } from '@/utils/supabase/server'
import ProductGrid from '@/components/ProductGrid'
import WhatsAppButton from '@/components/WhatsAppButton'
import { ItemMaster } from '@/types/database'

// Revalidate public catalog every 60 seconds (Incremental Static Regeneration)
export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  // 1. Fetch public flower products from Supabase ItemMaster table[cite: 3, 6]
  const { data: products, error } = await supabase
    .from('itemmaster')
    .select('ItemCode:itemcode, ItemName:itemname, ImageUrl:imageurl, ItemPrice:itemprice, GridX:gridx, GridY:gridy, GridW:gridw, GridH:gridh')
    .eq('isarchived', false)
    .order('createdon', { ascending: false })

  if (error) {
    console.error('Error fetching catalog:', error.message)
  }

  // Define shop telephone number (Replace with actual florist contact number)
  const shopPhoneNumber = '60195123707'

  return (
    <div className="min-h-screen bg-pink-50/30">
      {/* Hero / Header Banner */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💐</span>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Bloom & Blossom Florist
            </h1>
          </div>
          <a
            href={`https://wa.me/${shopPhoneNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow transition-hover hover:bg-green-600"
          >
            WhatsApp Shop
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Our Floral Catalog
          </h2>
          <p className="mt-2 text-base text-gray-600">
            Browse our hand-crafted bouquet collection. Click any bouquet or the floating button to order directly via WhatsApp.
          </p>
        </section>

        {/* Product Catalog Grid */}
        <ProductGrid
          products={(products as ItemMaster[]) || []}
          phoneNumber={shopPhoneNumber}
        />
      </main>

      {/* Persistent Guest WhatsApp Floating Action Button */}
      <WhatsAppButton phoneNumber={shopPhoneNumber} />

      {/* Simple Footer */}
      <footer className="mt-20 border-t bg-white py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Bloom & Blossom Florist. All rights reserved.</p>
      </footer>
    </div>
  )
}