'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ItemMaster } from '@/types/database'

export default function ProductManagement() {
  const router = useRouter()
  const supabase = createClient()
  const [products, setProducts] = useState<ItemMaster[]>([])

  const fetchData = async () => {
    // Only fetch non-archived items[cite: 4]
    const { data: pData } = await supabase.from('itemmaster').select('*').eq('isarchived', false).order('createdon', { ascending: false })
    if (pData) setProducts(pData)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Safely hide product without destroying historical order data
  const handleArchiveProduct = async (itemCode: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!confirm('Are you sure you want to archive this bouquet? It will disappear from the storefront.')) return
    await supabase.from('itemmaster').update({ 
      isarchived: true,
      updatedby: user?.app_metadata.username,
      updatedon: new Date().toISOString()
    }).eq('itemCode', itemCode)
    fetchData()
  }

  return (
    <div className="mx-auto max-w-6xl p-8">

      {/* Product Management Table */}
      <div className='flex gap-4 mb-4 items-center justify-between'>
        <h2 className="text-xl font-semibold text-gray-800">Active Products</h2>
        <button className='button p-2' onClick={() => router.push('/admin/products/new')}>
          Add New Product
        </button>
      </div>
      <div className="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Image</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Item Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products.map(product => (
              <tr key={product.itemcode}>
                <td className="whitespace-nowrap px-6 py-4">
                  {product.imageurl ? (
                    <img src={product.imageurl} alt="img" className="h-12 w-12 rounded object-cover shadow-sm" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-gray-100" />
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{product.itemcode}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{product.itemname}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">RM {product.itemprice.toFixed(2)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button onClick={() => handleArchiveProduct(product.itemcode)} className="text-red-600 hover:text-red-900">
                    Archive (Hide)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}