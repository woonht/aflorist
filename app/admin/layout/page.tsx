'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ItemMaster } from '@/types/database'
import { Responsive, WidthProvider } from 'react-grid-layout/legacy'
import type { Layout } from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// Automatically scale the grid to fit the admin's screen
const ResponsiveGridLayout = WidthProvider(Responsive)

export default function LayoutArranger() {
  const supabase = createClient()
  const [products, setProducts] = useState<ItemMaster[]>([])
  const [layout, setLayout] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadLayout() {
      const { data } = await supabase.from('itemmaster').select('*').eq('isarchived', false)
      if (data) {
        setProducts(data)
        
        // Map database Grid columns to React-Grid-Layout specific parameters
        const initialLayout = data.map((p) => ({
          i: p.itemcode,
          x: p.gridx || 0,
          y: p.gridy || 0,
          w: p.gridw || 1, // 1 = Standard width, 2 = Double width
          h: p.gridh || 1, 
        }))
        setLayout(initialLayout)
      }
    }
    loadLayout()
  }, [supabase])

  // Triggers dynamically as you drag items around the screen
  const handleLayoutChange = (newLayout: Layout) => {
    setLayout([...newLayout])
  }

  // Loop through items and update PostgreSQL database coordinates
  const saveLayoutToDatabase = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setIsSaving(true)
    try {
      for (const item of layout) {
        await supabase.from('itemmaster').update({
          gridx: item.x,
          gridy: item.y,
          gridw: item.w,
          gridh: item.h,
          updatedby: user?.app_metadata.username,
          updatedon: new Date().toISOString()
        }).eq('itemcode', item.i)
      }
      alert('Storefront layout updated successfully!')
    } catch (error: any) {
      alert('Error saving layout: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Storefront Layout Arranger</h1>
          <p className="mt-2 text-gray-600">Drag bouquets to rearrange them or pull corners to enlarge featured items.</p>
        </div>
        <button 
          onClick={saveLayoutToDatabase} 
          disabled={isSaving}
          className="rounded bg-blue-600 px-6 py-3 font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Public Layout'}
        </button>
      </div>
      
      {/* Replaced min-h-[800px] with the standard Tailwind min-h-200 class */}
      <div className="rounded-xl border bg-gray-100 p-4 shadow-inner min-h-200">
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }} // Responsive column matching
          rowHeight={340} // Base height matching the public frontend auto-rows-[340px] logic
          onLayoutChange={handleLayoutChange}
          isDraggable={true}
          isResizable={true}
        >
          {products.map(p => (
            <div 
              key={p.itemcode} 
              className="flex cursor-move flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 shadow transition-shadow hover:shadow-lg"
            >
              {p.imageurl ? (
                <img src={p.imageurl} alt={p.itemname} className="mb-3 h-full max-h-50 w-full object-cover rounded" />
              ) : (
                <div className="mb-3 h-32 w-32 rounded bg-gray-200" />
              )}
              <h3 className="text-center font-bold text-gray-800">{p.itemname}</h3>
              <p className="text-sm font-semibold text-pink-600">RM {p.itemprice.toFixed(2)}</p>
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  )
}