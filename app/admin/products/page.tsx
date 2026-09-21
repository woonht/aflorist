'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ItemMaster, StockMaster } from '@/types/database'

export default function ProductManagement() {
  const supabase = createClient()
  const [products, setProducts] = useState<ItemMaster[]>([])
  const [stock, setStock] = useState<StockMaster[]>([])

  const fetchData = async () => {
    // Only fetch non-archived items[cite: 4]
    const { data: pData } = await supabase.from('ItemMaster').select('*').eq('IsArchived', false).order('CreatedOn', { ascending: false })
    const { data: sData } = await supabase.from('StockMaster').select('*').eq('IsArchived', false).order('StockName', { ascending: true })
    if (pData) setProducts(pData)
    if (sData) setStock(sData)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Safely hide product without destroying historical order data
  const handleArchiveProduct = async (itemCode: string) => {
    if (!confirm('Are you sure you want to archive this bouquet? It will disappear from the storefront.')) return
    await supabase.from('ItemMaster').update({ IsArchived: true }).eq('ItemCode', itemCode)
    fetchData()
  }

  // Quick-update stock quantities on input blur
  const handleUpdateStock = async (stockCode: string, newQty: number) => {
    await supabase.from('StockMaster').update({ StockQuantity: newQty }).eq('StockCode', stockCode)
    fetchData()
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Inventory Management</h1>
      
      {/* Stock Management Table */}
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Raw Materials (StockMaster)</h2>
      <div className="mb-10 overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stock Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Material Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stock Quantity (Editable)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {stock.map(item => (
              <tr key={item.StockCode}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.StockCode}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{item.StockName}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <input 
                    type="number" 
                    defaultValue={item.StockQuantity}
                    onBlur={(e) => handleUpdateStock(item.StockCode, Number(e.target.value))}
                    className="w-24 rounded border p-1 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Management Table */}
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Active Bouquets (ItemMaster)</h2>
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
              <tr key={product.ItemCode}>
                <td className="whitespace-nowrap px-6 py-4">
                  {product.ImageUrl ? (
                    <img src={product.ImageUrl} alt="img" className="h-12 w-12 rounded object-cover shadow-sm" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-gray-100" />
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{product.ItemCode}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{product.ItemName}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">RM {product.ItemPrice.toFixed(2)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button onClick={() => handleArchiveProduct(product.ItemCode)} className="text-red-600 hover:text-red-900">
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