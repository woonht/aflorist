'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client' // Built in Phase 1
import { ItemMaster } from '@/types/database' // Defined in Phase 2

export default function NewOrderPage() {
  const supabase = createClient()
  const router = useRouter()

  // 1. Customer Details State
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selfPickUp, setSelfPickUp] = useState(true)
  const [shippingAddress, setShippingAddress] = useState('')
  const [postcode, setPostcode] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [giftCard, setGiftCard] = useState(false)
  const [totalRemark, setTotalRemark] = useState<string[]>([])

  // 2. Bouquet Selection State
  const [availableItems, setAvailableItems] = useState<ItemMaster[]>([])
  const [selectedItemCode, setSelectedItemCode] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [orderItems, setOrderItems] = useState<{ item: ItemMaster; qty: number }[]>([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch active bouquets for the dropdown when page loads
  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase.from('itemmaster').select('*').eq('isarchived', false)
      if (data) setAvailableItems(data)
    }
    fetchItems()
  }, [])

  // Add selected bouquet to the order list
  const handleAddItem = () => {
    const item = availableItems.find(i => i.itemcode === selectedItemCode)
    if (item && quantity > 0) {
      setOrderItems([...orderItems, { item, qty: quantity }])
      setSelectedItemCode('') // Reset dropdown
      setQuantity(1)
    }
  }

  const handleRemoveItem = (index: number) => {
    const removedItem = orderItems[index]
    const updatedOrderItem = orderItems.filter((oi) => oi !== removedItem)
    setOrderItems(updatedOrderItem)
  }

  const handleAddRemark = (index: number, newRemark: string) => {
    const tempRemark = [...totalRemark]
    tempRemark[index] = newRemark
    setTotalRemark(tempRemark)
  } 

  // Calculate the live total order price
  const totalOrderPrice = orderItems.reduce((sum, current) => sum + (current.item.itemprice * current.qty), 0)

  // Submit everything to Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (orderItems.length === 0) return alert('Please add at least one bouquet to the order.')
    
    setIsSubmitting(true)
    
    // Generate a unique order identifier based on the current timestamp
    const orderNumber = `ORD-${Date.now()}` 

    // 3. Save to SalesOrderHeaders
    const { error: headerError } = await supabase.from('salesorderheaders').insert({
      ordernumber: orderNumber,
      customername: customerName,
      customerphone: customerPhone,
      shippingaddress: selfPickUp ? null : shippingAddress,
      postcode: selfPickUp ? null : postcode,
      selfpickup: selfPickUp,
      deliverydate: new Date(deliveryDate).toISOString(), // Convert local time to UTC[cite: 7]
      statuscode: 'N', 
      createdby: user?.user_metadata.username,
      createdon: new Date().toISOString()
    })

    if (headerError) {
      alert('Error creating order header: ' + headerError.message)
      setIsSubmitting(false)
      return
    }

    // 4. Save to SalesOrderDetails[cite: 7]
    const details = orderItems.map((oi, index) => ({
      ordernumber: orderNumber,
      customername: customerName,
      itemcode: oi.item.itemcode,
      itemprice: oi.item.itemprice,
      itemquantity: oi.qty,
      orderprice: oi.item.itemprice * oi.qty,
      giftcard: giftCard,
      remark: totalRemark[index],
      statuscode: 'N',
      createdby: user?.user_metadata.username,
      createdon: new Date().toISOString()
    }))

    const { error: detailsError } = await supabase.from('salesorderdetails').insert(details)

    if (detailsError) {
      const { error: headerDeleteError } = await supabase.from('salesorderheaders').delete().eq('ordernumber', orderNumber)
      alert('Error saving order items: ' + detailsError.message + `\nError deleting order header: ${headerDeleteError ? headerDeleteError.message : 'N/A'}`)
    } else {
      alert('Order successfully created!')
      router.push('/admin/orders') // Send admin to the management dashboard
    }
    setIsSubmitting(false)
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Create WhatsApp Order</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border bg-white p-6 shadow-sm">
        {/* Customer Details Section */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-800 border-b pb-2">1. Customer Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-1 w-full rounded border p-2 text-gray-900 focus:border-pink-500 focus:ring-pink-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input type="text" required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="mt-1 w-full rounded border p-2 text-gray-900 focus:border-pink-500 focus:ring-pink-500" />
            </div>
          </div>
        </section>

        {/* Logistics Section */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-800 border-b pb-2">2. Fulfillment Details</h2>
          <div className="mb-4 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={selfPickUp} onChange={() => setSelfPickUp(true)} className="text-pink-600 focus:ring-pink-500" />
              <span className="text-gray-700 font-medium">Self Pick-Up</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!selfPickUp} onChange={() => setSelfPickUp(false)} className="text-pink-600 focus:ring-pink-500" />
              <span className="text-gray-700 font-medium">Delivery</span>
            </label>
          </div>

          {!selfPickUp && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Shipping Address</label>
                <input type="text" required={!selfPickUp} value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} className="mt-1 w-full rounded border p-2 text-gray-900 focus:border-pink-500 focus:ring-pink-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Postcode</label>
                <input type="text" required={!selfPickUp} value={postcode} onChange={e => setPostcode(e.target.value)} className="mt-1 w-full rounded border p-2 text-gray-900 focus:border-pink-500 focus:ring-pink-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Scheduled Date & Time</label>
            <input type="datetime-local" required value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="mt-1 w-full md:w-1/2 rounded border p-2 text-gray-900 focus:border-pink-500 focus:ring-pink-500" />
          </div>
        </section>

        {/* Bouquet Selection Section */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-800 border-b pb-2">3. Bouquet Selection</h2>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Select Bouquet</label>
              <select value={selectedItemCode} onChange={e => setSelectedItemCode(e.target.value)} className="mt-1 w-full rounded border p-2 text-gray-900 focus:border-pink-500 focus:ring-pink-500">
                <option value="">-- Choose a bouquet --</option>
                {availableItems.map(item => (
                  <option key={item.itemcode} value={item.itemcode}>{item.itemname} (RM {item.itemprice.toFixed(2)})</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700">Qty</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="mt-1 w-full rounded border p-2 text-gray-900 focus:border-pink-500 focus:ring-pink-500" />
            </div>
            <button type="button" onClick={handleAddItem} disabled={!selectedItemCode} className="rounded bg-[#B8CCD8] px-4 py-2 font-bold text-gray-800 hover:bg-[#A8B59A] disabled:opacity-50">
              Add
            </button>
          </div>

          {/* Render selected items */}
          {orderItems.length > 0 && (
            <div className="mt-4 rounded-lg border bg-gray-50 p-4">
              <ul className="space-y-2">
                {orderItems.map((oi, index) => (
                  <li key={index} className="flex justify-between items-center text-sm font-medium text-gray-700">
                    <span>{oi.qty}x {oi.item.itemname}</span>
                    <div className="flex items-center gap-4">
                      <span>RM {(oi.item.itemprice * oi.qty).toFixed(2)}</span>
                      <button type="button" onClick={() => handleRemoveItem(index)} className="bg-red-600 hover:bg-red-900 text-white font-semibold p-2 rounded-full cursor-pointer">Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-right text-lg font-bold text-[#EBA7A0] border-t pt-2">
                Total: RM {totalOrderPrice.toFixed(2)}
              </div>
            </div>
          )}
        </section>
        
        {orderItems.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-800 border-b pb-2">4. Gift Card Contents</h2>
            <div className="mb-4 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={giftCard} onChange={() => setGiftCard(true)} />
                <span className="text-gray-700 font-medium">Gift Card</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!giftCard} onChange={() => setGiftCard(false)} />
                <span className="text-gray-700 font-medium">N/A</span>
              </label>
            </div>
            {giftCard && (
              <div>
                {orderItems.map((oi, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700">Bouquet {index+1}: {oi.item.itemname}</label>
                    <textarea key={index} value={totalRemark[index]} onChange={e => handleAddRemark(index, e.target.value)} className="mt-1 w-full rounded border p-2 text-gray-900 focus:border-pink-500 focus:ring-pink-500" />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <button type="submit" disabled={isSubmitting} className="button w-full py-3 disabled:opacity-50">
          {isSubmitting ? 'Saving Order...' : 'Confirm & Save Order'}
        </button>
      </form>
    </div>
  )
}