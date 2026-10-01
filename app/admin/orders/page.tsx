'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { SalesOrderHeader, SalesOrderDetail } from '@/types/database' // Defined in Phase 2[cite: 7]

// Define a custom type that includes the nested line items returned by the SQL Join
type OrderWithDetails = SalesOrderHeader & {
  salesorderdetails: SalesOrderDetail[]
}

export default function OrderManagementPage() {
  const supabase = createClient()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'new' | 'pending' | 'completed'>('new')
  const [newOrders, setNewOrders] = useState<OrderWithDetails[]>([])
  const [pendingOrders, setPendingOrders] = useState<OrderWithDetails[]>([])
  const [completedOrders, setCompletedOrders] = useState<OrderWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrders = async () => {
    setIsLoading(true)

    // 1. Fetch Pending Orders: Sort chronologically so the nearest deadline is at the top[cite: 1]
    const { data: newOrder } = await supabase
      .from('salesorderheaders')
      .select('*, salesorderdetails(*)') // SQL Join grabs all linked bouquets[cite: 7]
      .eq('statuscode', 'N')
      .eq('isarchived', false)
      .order('deliverydate', { ascending: true })

    const { data: pending } = await supabase
      .from('salesorderheaders')
      .select('*, salesorderdetails(*)') // SQL Join grabs all linked bouquets[cite: 7]
      .eq('statuscode', 'P')
      .eq('isarchived', false)
      .order('deliverydate', { ascending: true })

    // 2. Month-to-Date (MTD) Logic[cite: 1]
    const now = new Date()
    // Create an exact timestamp for the 1st day of the current month at 00:00:00
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    
    // 3. Fetch Past Orders: Filter for 'C' (Completed) AND updated within this month
    const { data: completed } = await supabase
      .from('salesorderheaders')
      .select('*, salesorderdetails(*)')
      .eq('statuscode', 'C')
      .eq('isarchived', false)
      .gte('updatedon', startOfMonth)
      .order('updatedon', { ascending: false })

    if (newOrder) setNewOrders(newOrder as OrderWithDetails[])
    if (pending) setPendingOrders(pending as OrderWithDetails[])
    if (completed) setCompletedOrders(completed as OrderWithDetails[])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleMarkPending = async (orderNumber: string) => {
    if (!confirm(`Are you sure you want to pending order ${orderNumber}?`)) return
    
    const { data: { user } } = await supabase.auth.getUser()
    const now = new Date().toISOString()

    // Update SalesOrderHeaders[cite: 7]
    await supabase
      .from('salesorderheaders')
      .update({ statuscode: 'P', updatedon: now, updatedby: user?.user_metadata.username })
      .eq('ordernumber', orderNumber)
      
    // Update SalesOrderDetails[cite: 7]
    await supabase
      .from('salesorderdetails')
      .update({ statuscode: 'P', updatedon: now, updatedby: user?.user_metadata.username })
      .eq('ordernumber', orderNumber)

    fetchOrders() // Instantly refresh the tables
  }

  // Marks both the header and all individual line items as Completed ('C')
  const handleMarkCompleted = async (orderNumber: string) => {
    if (!confirm(`Are you sure you want to complete order ${orderNumber}?`)) return
    
    const { data: { user } } = await supabase.auth.getUser()
    const now = new Date().toISOString()

    // Update SalesOrderHeaders[cite: 7]
    await supabase
      .from('salesorderheaders')
      .update({ statuscode: 'C', updatedon: now, updatedby: user?.user_metadata.username })
      .eq('ordernumber', orderNumber)
      
    // Update SalesOrderDetails[cite: 7]
    await supabase
      .from('salesorderdetails')
      .update({ statuscode: 'C', updatedon: now, updatedby: user?.user_metadata.username })
      .eq('ordernumber', orderNumber)

    fetchOrders() // Instantly refresh the tables
  }

  const handleCancelOrder = async (orderNumber: string) => {
    const { data : {user} } = await supabase.auth.getUser()
    const { error : errorHeaderCancel } = await supabase.from('salesorderheaders').update({
      statuscode: 'X',
      updatedby: user?.user_metadata.username,
      updatedon: new Date().toISOString()
    }).eq('ordernumber', orderNumber)

    if (errorHeaderCancel) {
      alert("Error cancel order in SalesOrderHeaders: " + errorHeaderCancel.message)
      return
    }

    const { error : errorDetailCancel } = await supabase.from('salesorderdetails').update({
      statuscode: 'X',
      updatedby: user?.user_metadata.username,
      updatedon: new Date().toISOString()
    }).eq('ordernumber', orderNumber)

    if (errorDetailCancel) {
      alert("Error cancel order SalesOrderDetails: " + errorDetailCancel.message)
      return
    }

    fetchOrders()
  }

  // Helper to sum the total cost of the nested array of order details
  const calculateTotal = (details: SalesOrderDetail[]) => {
    return details.reduce((sum, item) => sum + item.orderprice, 0)
  }

  // Reusable Native Table Renderer
  const renderTable = (orders: OrderWithDetails[], isCompleted: boolean) => {
    if (orders.length === 0) return <div className="py-10 text-center text-gray-500">No orders found.</div>

    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Order Details</th>
              <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Bouquets Ordered</th>
              <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Total</th>
              {!isCompleted && <th className="px-6 py-3 text-right font-bold text-gray-500 uppercase">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {orders.map(order => (
              <tr key={order.ordernumber} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{order.ordernumber}</div>
                  <div className="mt-1 text-xs text-pink-600 font-semibold">
                    {order.selfpickup ? '🏃 Self Pick-up' : '🚚 Delivery'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Due: {new Date(order.deliverydate).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-800">{order.customername}</div>
                  <a href={`https://wa.me/${order.customerphone}`} target="_blank" className="text-xs text-blue-600 hover:underline">
                    {order.customerphone}
                  </a>
                  {!order.selfpickup && <div className="text-xs text-gray-500 mt-1">{order.shippingaddress}</div>}
                </td>
                <td className="px-6 py-4">
                  <ul className="text-xs text-gray-600 space-y-1">
                    {order.salesorderdetails.map(detail => (
                      <li key={detail.salesorderdetailid}>• {detail.itemquantity}x {detail.itemcode}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">
                  RM {calculateTotal(order.salesorderdetails).toFixed(2)}
                </td>
                {!isCompleted && (
                  <td className="px-6 py-4 text-right">
                    <div className='grid grid-cols-2'>
                      {activeTab == 'new' ? (
                        <button 
                          onClick={() => handleMarkPending(order.ordernumber)}
                          className="rounded bg-[#A8B59A] px-4 py-1.5 text-xs font-bold text-white hover:bg-green-500 transition-colors"
                        >
                          Pending
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleMarkCompleted(order.ordernumber)}
                          className="rounded bg-[#A8B59A] px-4 py-1.5 text-xs font-bold text-white hover:bg-green-500 transition-colors"
                        >
                          Complete
                        </button>
                      )}
                      <button 
                        onClick={() => handleCancelOrder(order.ordernumber)}
                        className="rounded bg-[#EBA7A0] px-4 py-1.5 text-xs font-bold text-white hover:bg-red-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className='grid grid-cols-2'>
                      <button 
                        onClick={() => router.push(`/admin/orders/edit?OrderNumber=${order.ordernumber}`)}
                        className="rounded bg-[#B8CCD8] px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-300 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => router.push(`/admin/orders/view?OrderNumber=${order.ordernumber}`)}
                        className="rounded bg-[#D4B483] px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <Link href="/admin/orders/new" className="button p-2">
          + New Order
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex space-x-4 border-b">
        <button 
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === 'new' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          New Orders
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === 'pending' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Pending Orders
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === 'completed' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Past Orders (MTD)
        </button>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="py-10 text-center text-gray-500">Loading orders...</div>
      ) : (
        renderTable(activeTab === 'new' ? newOrders : activeTab === 'pending' ? pendingOrders : completedOrders, activeTab === 'completed')
      )}
    </div>
  )
}