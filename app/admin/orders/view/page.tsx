'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client' // Built in Phase 1
import { SalesOrderHeader, SalesOrderDetail, ItemMaster } from '@/types/database' // Defined in Phase 2

type OrderWithDetails = SalesOrderHeader & {
    salesorderdetails: SalesOrderDetail[]
}

export default function ViewOrderPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('OrderNumber')

  // 1. Customer Details State
  const [order, setOrder] = useState<OrderWithDetails[]>([])
  const [item, setItem] = useState<ItemMaster[]>([])

  const fetchData = async () => {
      const { data } = await supabase
        .from('salesorderheaders')
        .select('*, salesorderdetails(*)')
        .eq('isarchived', false)
        .eq('ordernumber', orderNumber)
      
      if (data) {
        setOrder(data)
        const orderItem = data.flatMap(o => (o.salesorderdetails || []).filter((d: any) => d.ordernumber == orderNumber).map((d: any) => d.itemcode))
        console.log(orderItem)
        const { data : items } = await supabase
          .from('itemmaster')
          .select('*')
          .eq('isarchived', false)
          .in('itemcode', orderItem)
          if (items) setItem(items)

        console.log(items)
      }
  }

  // Fetch active bouquets for the dropdown when page loads
  useEffect(() => {
    fetchData()
  }, [])

  const calculatedTotal = order.map(o => (o.salesorderdetails).reduce((sum ,current) => sum + (current.itemprice * current.itemquantity), 0))
  const totalOrderPrice = calculatedTotal.reduce((sum ,current) => sum + current, 0)

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">View WhatsApp Order</h1>
      
      {order.map((o, index) => (
        <div key={index} className="space-y-8 rounded-xl border bg-white p-6 shadow-sm">
            <section>
                <h2 className="mb-4 text-xl font-semibold text-gray-800 border-b pb-2">1. Customer Details</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                    <input type="text" value={o.customername} readOnly disabled className="mt-1 w-full rounded border p-2 text-gray-900 disabled:bg-gray-200" />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="text" value={o.customerphone} readOnly disabled className="mt-1 w-full rounded border p-2 text-gray-900 disabled:bg-gray-200" />
                    </div>
                </div>
            </section>

            <section>
                <h2 className="mb-4 text-xl font-semibold text-gray-800 border-b pb-2">2. Fulfillment Details</h2>
                {!o.selfpickup && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Shipping Address</label>
                            <input type="text" value={o.shippingaddress || ''} readOnly disabled className="mt-1 w-full rounded border p-2 text-gray-900 disabled:bg-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Postcode</label>
                            <input type="text" value={o.postcode || ''} readOnly disabled className="mt-1 w-full rounded border p-2 text-gray-900 disabled:bg-gray-200" />
                        </div>
                    </div>
                )} 
                <div>
                    <label className="block text-sm font-medium text-gray-700">Scheduled Date & Time</label>
                    <input type="datetime-local" value={o.deliverydate} readOnly disabled className="mt-1 w-full md:w-1/2 rounded border p-2 text-gray-900 disabled:bg-gray-200" />
                </div>
            </section>

            <section>
                <h2 className="mb-4 text-xl font-semibold text-gray-800 border-b pb-2">3. Product Selections</h2>
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1">
                        {item.map((i, index) => (
                            <div key={index}>
                                <ul>
                                    {o.salesorderdetails.map((d, index) => (
                                        <div key={index} className='flex gap-4 items-center'>
                                            <img src={i.imageurl || ''} className='w-25 h-full shadow-md m-2'></img>
                                            <div className='flex flex-col'>
                                                <li key={i.itemname} className=''>Product Name: {i.itemname}</li>
                                                <li key={d.itemquantity} className=''>Quantity: {d.itemquantity}</li>
                                                <li key={d.itemprice} className=''>Price: RM {(d.itemprice * d.itemquantity).toFixed(2)}</li>
                                            </div>
                                        </div>
                                    ))}
                                </ul>
                                <div className="mt-4 text-right text-lg font-bold text-[#EBA7A0] border-t pt-2">
                                    Total: RM {totalOrderPrice.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {o.salesorderdetails.map((d, index) => 
                d.remark !== null && (
                    <section key={index}>
                        <h2 className="mb-4 text-xl font-semibold text-gray-800 border-b pb-2">4. Gift Card Contents</h2>
                        {d.giftcard && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bouquet {index+1}: {d.itemcode}</label>
                                <textarea key={index} value={d.remark || ''} readOnly disabled className="mt-1 w-full rounded border p-2 text-gray-900 disabled:bg-gray-200" />
                            </div>
                        )}
                    </section>
                )
            )}
        </div>
      ))}
    </div>
  )
}