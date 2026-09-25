'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { StockMaster } from '@/types/database'

function StockRow ({ item, handleUpdateStock, handleArchiveProduct }: { item: any, handleUpdateStock: any, handleArchiveProduct: any }) {
  const [tempQty, setTempQty] = useState(item.stockquantity)
  const [tempPrice, setTempPrice] = useState(item.unitprice)
  const isChanged = tempQty !== item.stockquantity || tempPrice !== item.unitprice

  return(
    <tr key={item.stockcode}>
      <td className="whitespace-nowrap px-6 py-4">
        {item.imageurl ? (
          <img src={item.imageurl} alt='img' className='h-12 w-12 rounded object-cover shadow-sm'/>
        ) : (
          <div className="h-12 w-12 rounded bg-gray-100"/>
        )}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.stockcode}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{item.stockname}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{item.stockcategory}</td>
      <td className="whitespace-nowrap px-6 py-4 text-sm">
        <input 
          type="number" 
          min={0}
          value={tempQty}
          // onBlur={(e) => handleUpdateStock(item.stockcode, Number(e.target.value))}
          onChange={(e) => setTempQty(parseFloat(e.target.value))}
          className="w-24 rounded border p-1 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
        />
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm">
        <input 
          type='number' 
          min={0}
          step={0.01}
          value={tempPrice} 
          // onBlur={(e) => handleUpdateStock(item.stockcode, Number(e.target.value))}
          onChange={(e) => setTempPrice(parseFloat(e.target.value))}
          className="w-24 rounded border p-1 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
        />
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
        <div className='flex gap-4'>
          <button onClick={() => handleArchiveProduct(item.stockcode)} className="bg-red-600 hover:bg-red-900 text-white font-semibold w-[65%] py-3 rounded-full cursor-pointer">
            Archive (Hide)
          </button>
          <button onClick={() => {handleUpdateStock(item.stockcode, tempQty, tempPrice), console.log(isChanged)}} className="bg-[#B8CCD8] hover:bg-[#A8B59A] rounded-full cursor-pointer font-semibold text-white w-[35%] py-3 disabled:opacity-50 disabled:cursor-default disabled:hover:bg-[#B8CCD8]" disabled={!isChanged}>
            Save
          </button>
        </div>
      </td>
    </tr>
  )
}

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
  const handleUpdateStock = async (stockCode: string, newQty: number, newPrice: number) => {
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('stockmaster').update({ 
        stockquantity: newQty,
        unitprice: newPrice,
        updatedby: user?.user_metadata.username,
        updatedon: new Date().toISOString()
    }).eq('stockcode', stockCode)
    alert("Updated Successfully")
    fetchData()
  }

  const handleArchiveProduct = async (stockCode: string) => {
    const { data: {user} } = await supabase.auth.getUser()

    if(!confirm('Are you sure you want to archive this stock?')) return
    await supabase.from('stockmaster').update({
      isarchived: true,
      updatedby: user?.user_metadata.username,
      updatedon: new Date().toISOString()
    }).eq('stockCode', stockCode)
    fetchData()
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stock Image</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stock Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stock Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stock Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stock Quantity</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unit Price</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {stock.map(item => (
              <StockRow 
                key={item.stockcode} 
                item={item} 
                handleArchiveProduct={handleArchiveProduct}
                handleUpdateStock={handleUpdateStock} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}