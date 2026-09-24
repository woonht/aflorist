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
  const [itemCategory, setItemCategory] = useState<string | null>(null)
  const [itemPrice, setItemPrice] = useState<number>(0)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [unitPrice, setUnitPrice] = useState('')
  
  // Raw Materials (Bill of Materials) State
  const [availableStock, setAvailableStock] = useState<StockMaster[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<{ stockCode: string, quantity: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Fetch available raw materials on page load
  useEffect(() => {
    async function loadStock() {
      const { data } = await supabase.from('stockmaster').select('*').eq('isarchived', false)
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
    const { data: { user } } = await supabase.auth.getUser()
    
    try {
      // 1. Upload Image to Supabase Storage bucket created in Phase 2[cite: 4]
      let imageUrl = ''
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}` // Secure unique naming
        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(`public/${fileName}`, imageFile)
          
        if (uploadError) throw new Error('Image upload failed: ' + uploadError.message)
        
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(`public/${fileName}`)
          
        imageUrl = publicUrlData.publicUrl
      }
      
      // 2. Insert into ItemMaster[cite: 4]
      const { error: itemError } = await supabase.from('itemmaster').insert({
        itemcode: itemCode,
        itemname: itemName,
        itemprice: itemPrice,
        imageurl: imageUrl,
        createdby: user?.app_metadata.username,
        createdon: new Date().toISOString()
      })
      
      if (itemError) throw new Error('Product creation failed: ' + itemError.message)
      
      // 3. Link Raw Materials in ItemDetails[cite: 4]
      const materialsToInsert = selectedMaterials
        .filter(m => m.stockCode !== '')
        .map(m => ({
          itemcode: itemCode,
          stockcode: m.stockCode,
          quantity: m.quantity,
          createdby: user?.app_metadata.username,
          createdon: new Date().toISOString()
        }))
        
      if (materialsToInsert.length > 0) {
        const { error: detailError } = await supabase.from('itemdetails').insert(materialsToInsert)
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
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Upload New Product</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-md">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Item Code</label>
            <input type="text" required value={itemCode} onChange={e => setItemCode(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Bouquet Name</label>
            <input type="text" required value={itemName} onChange={e => setItemName(e.target.value)} className="form-input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Item Category</label>
            <input type="text" required value={itemCategory || ''} onChange={e => setItemCategory(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Selling Price (RM)</label>
            <input type="number" step="0.01" min={0.00} required value={itemPrice} onChange={e => setItemPrice(parseFloat(e.target.value))} className="form-input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Unit Price (RM)</label>
            <input type="text" required value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="form-input" />
          </div>
        </div>

        <div>
          <label className="form-label mb-2">Bouquet Image</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-[#EBA7A0] transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold text-[#EBA7A0]">Click to upload</span> a photo
                </p>
              </div>
              {/* The actual input is hidden, but clicking the label triggers it */}
              <input 
                type="file" 
                accept="image/*" 
                required 
                onChange={e => setImageFile(e.target.files?.[0] || null)} 
                className="hidden" 
              />
            </label>
          </div>
          {/* Show the selected file name if one exists */}
          {imageFile && (
            <p className="mt-2 text-sm text-green-600 font-medium">Selected: {imageFile.name}</p>
          )}
        </div>

        {/* Dynamic Raw Materials Section */}
        <div className="border-t pt-4">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Stock Used</h3>
          {selectedMaterials.map((mat, index) => (
            <div key={index} className="mb-3 flex items-center gap-4">
              <select 
                value={mat.stockCode} 
                onChange={(e) => handleUpdateMaterial(index, 'stockCode', e.target.value)}
                className="flex-1 rounded border p-2 text-gray-900" required
              >
                <option value="">Select Stock...</option>
                {availableStock.map((stock) => (
                  <option key={stock.stockcode} value={stock.stockcode}>
                    {stock.stockname} (In Stock: {stock.stockquantity})
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
          <button type="button" onClick={handleAddMaterial} className="text-sm font-semibold text-[#EBA7A0] hover:text-pink-700">
            + Add Stock
          </button>
        </div>

        <button type="submit" disabled={isLoading} className="button w-full py-3 font-semibold text-white disabled:opacity-50">
          {isLoading ? 'Uploading & Saving...' : 'Save Product'}
        </button>
      </form>
    </div>
  )
}