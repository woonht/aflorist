'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client' // Built in Phase 1[cite: 1]
import { StockMaster } from '@/types/database' // Defined in Phase 2[cite: 4]
import { v4 as uuidv4 } from 'uuid'

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Product Form State
  const [itemCode, setItemCode] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState<number>(0)
  const [imageFile, setImageFile] = useState<File | null>(null)
  
  // Raw Materials (Bill of Materials) State
  const [availableStock, setAvailableStock] = useState<StockMaster[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<{ stockCode: string, quantity: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Fetch available raw materials on page load
  useEffect(() => {
    async function loadStock() {
      const { data } = await supabase.from('StockMaster').select('*').eq('IsArchived', false)
      if (data) setAvailableStock(data)
    }
    loadStock()
  }, [supabase])
  
  const handleAddMaterial = () => {
    setSelectedMaterials([...selectedMaterials, { stockCode: '', quantity: 1 }])
  }

  const handleUpdateMaterial = (index: number, field: string, value: string | number) => {
    const updated = [...selectedMaterials]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedMaterials(updated)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // 1. Upload Image to Supabase Storage bucket created in Phase 2[cite: 4]
      let imageUrl = ''
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}` // Secure unique naming
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(`public/${fileName}`, imageFile)
          
        if (uploadError) throw new Error('Image upload failed: ' + uploadError.message)
        
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(`public/${fileName}`)
          
        imageUrl = publicUrlData.publicUrl
      }
      
      // 2. Insert into ItemMaster[cite: 4]
      const { error: itemError } = await supabase.from('ItemMaster').insert({
        ItemCode: itemCode,
        ItemName: itemName,
        ItemPrice: itemPrice,
        ImageUrl: imageUrl,
        CreatedBy: 'Admin', // Static auth attribution
        CreatedOn: new Date().toISOString()
      })
      
      if (itemError) throw new Error('Product creation failed: ' + itemError.message)
      
      // 3. Link Raw Materials in ItemDetails[cite: 4]
      const materialsToInsert = selectedMaterials
        .filter(m => m.stockCode !== '')
        .map(m => ({
          ItemCode: itemCode,
          StockCode: m.stockCode,
          Quantity: m.quantity,
          CreatedBy: 'Admin',
          CreatedOn: new Date().toISOString()
        }))
        
      if (materialsToInsert.length > 0) {
        const { error: detailError } = await supabase.from('ItemDetails').insert(materialsToInsert)
        if (detailError) throw new Error('Failed to link raw materials: ' + detailError.message)
      }
      
      // Return to inventory page on success
      router.push('/admin/products')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Upload New Bouquet</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-md">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Item Code (e.g., BQT-001)</label>
            <input type="text" required value={itemCode} onChange={e => setItemCode(e.target.value)} className="mt-1 w-full rounded border p-2 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bouquet Name</label>
            <input type="text" required value={itemName} onChange={e => setItemName(e.target.value)} className="mt-1 w-full rounded border p-2 text-gray-900" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Selling Price (RM)</label>
            <input type="number" step="0.01" required value={itemPrice} onChange={e => setItemPrice(parseFloat(e.target.value))} className="mt-1 w-full rounded border p-2 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bouquet Image</label>
            <input type="file" accept="image/*" required onChange={e => setImageFile(e.target.files?.[0] || null)} className="mt-1 w-full text-gray-900" />
          </div>
        </div>

        {/* Dynamic Raw Materials Section */}
        <div className="border-t pt-4">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Raw Materials Used (Recipe)</h3>
          {selectedMaterials.map((mat, index) => (
            <div key={index} className="mb-3 flex items-center gap-4">
              <select 
                value={mat.stockCode} 
                onChange={(e) => handleUpdateMaterial(index, 'stockCode', e.target.value)}
                className="flex-1 rounded border p-2 text-gray-900" required
              >
                <option value="">Select Raw Material...</option>
                {availableStock.map((stock) => (
                  <option key={stock.StockCode} value={stock.StockCode}>
                    {stock.StockName} (In Stock: {stock.StockQuantity})
                  </option>
                ))}
              </select>
              <input 
                type="number" min="1" value={mat.quantity} 
                onChange={(e) => handleUpdateMaterial(index, 'quantity', parseInt(e.target.value))}
                className="w-24 rounded border p-2 text-gray-900" required placeholder="Qty"
              />
            </div>
          ))}
          <button type="button" onClick={handleAddMaterial} className="text-sm font-semibold text-pink-600 hover:text-pink-700">
            + Add Material
          </button>
        </div>

        <button type="submit" disabled={isLoading} className="w-full rounded bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {isLoading ? 'Uploading & Saving...' : 'Save Product'}
        </button>
      </form>
    </div>
  )
}