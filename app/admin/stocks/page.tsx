'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { StockMaster } from '@/types/database'

export default function ProductManagement() {
  const router = useRouter()
  const supabase = createClient()
  const [stock, setStock] = useState<StockMaster[]>([])

  const fetchData = async () => {
    // Only fetch non-archived items[cite: 4]
    const { data: sData } = await supabase.from('stockmaster').select('*').eq('isarchived', false).order('stockname', { ascending: true })
    if (sData) setStock(sData)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Quick-update stock quantities on input blur
  const handleUpdateStock = async (stockCode: string, newQty: number) => {
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('stockmaster').update({ 
        stockquantity: newQty,
        updatedby: user?.app_metadata.username,
        updatedon: new Date().toISOString()
    }).eq('stockcode', stockCode)
    fetchData()
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      
      {/* Stock Management Table */}
      <div className='flex gap-4 mb-4 items-center justify-between'>
        <h2 className="text-xl font-semibold text-gray-800">Stocks List</h2>
        <button className='button p-2' onClick={() => router.push('/admin/stocks/new')}>
          Add New Stock
        </button>
      </div>
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
              <tr key={item.stockcode}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.stockcode}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{item.stockname}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <input 
                    type="number" 
                    defaultValue={item.stockquantity}
                    onBlur={(e) => handleUpdateStock(item.stockcode, Number(e.target.value))}
                    className="w-24 rounded border p-1 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}