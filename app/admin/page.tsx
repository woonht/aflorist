'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ExpenseMaster, SalesOrderHeader, SalesOrderDetail, StockMaster } from '@/types/database'

type CompletedOrderWithDetails = SalesOrderHeader & {
  salesorderdetails: SalesOrderDetail[]
}

export default function FinanceDashboardPage() {
  const supabase = createClient()

  // 1. Financial Summary States
  const [totalIncome, setTotalIncome] = useState<number>(0)
  const [totalExpenses, setTotalExpenses] = useState<number>(0)
  const [totalInventoryValue, setTotalInventoryValue] = useState<number>(0)
  const [expensesList, setExpensesList] = useState<ExpenseMaster[]>([])
  
  // 2. Form & UI States
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('General Utilities')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [filterPeriod, setFilterPeriod] = useState<'MTD' | 'YTD' | 'ALL'>('MTD')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch all financial metrics from Supabase
  const loadFinancialData = async () => {
    setIsLoading(true)

    // Calculate Date Bounds
    const now = new Date()
    let startDateString: string | null = null

    if (filterPeriod === 'MTD') {
      startDateString = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    } else if (filterPeriod === 'YTD') {
      startDateString = new Date(now.getFullYear(), 0, 1).toISOString()
    }

    // A. Query Completed Orders & Revenue
    let orderQuery = supabase
      .from('salesorderheaders')
      .select('*, salesorderdetails(*)')
      .eq('statuscode', 'C')
      .eq('isarchived', false)

    if (startDateString) {
      orderQuery = orderQuery.gte('updatedon', startDateString)
    }

    const { data: orderData } = await orderQuery

    if (orderData) {
      const orders = orderData as CompletedOrderWithDetails[]
      let incomeSum = 0
      orders.forEach((order) => {
        order.salesorderdetails?.forEach((detail) => {
          incomeSum += Number(detail.orderprice || 0)
        })
      })
      setTotalIncome(incomeSum)
    }

    // B. Query Business Operating Expenses
    let expenseQuery = supabase
      .from('expensemaster')
      .select('*')
      .eq('isarchived', false)
      .order('createdon', { ascending: false })

    if (startDateString) {
      expenseQuery = expenseQuery.gte('createdon', startDateString)
    }

    const { data: expenseData } = await expenseQuery

    if (expenseData) {
      setExpensesList(expenseData as ExpenseMaster[])
      const expSum = expenseData.reduce((sum, item) => sum + Number(item.Amount || 0), 0)
      setTotalExpenses(expSum)
    }

    // C. Query Raw Material Inventory Value
    const { data: stockData } = await supabase
      .from('stockmaster')
      .select('*')
      .eq('isarchived', false)

    if (stockData) {
      const stock = stockData as StockMaster[]
      const invSum = stock.reduce(
        (sum, item) => sum + Number(item.unitprice || 0) * Number(item.stockquantity || 0),
        0
      )
      setTotalInventoryValue(invSum)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadFinancialData()
  }, [filterPeriod])

  // Handle Receipt Upload & New Expense Logging
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data:  { user } } = await supabase.auth.getUser()

    if (!amount) return alert('Please enter a description and amount.')

    setIsSubmitting(true)
    let receiptUrl: string | null = null

    try {
      // 1. Upload receipt photo to Supabase Storage if attached
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop()
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('receipt-images')
          .upload(fileName, receiptFile)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('receipt-images')
          .getPublicUrl(fileName)

        receiptUrl = publicUrlData.publicUrl
      }

      // 2. Insert record into ExpenseMaster
      const { error: insertError } = await supabase.from('expensemaster').insert({
        description: description,
        amount: parseFloat(amount),
        expensecategory: category,
        receiptimageurl: receiptUrl,
        createdby: user?.user_metadata.username,
        createdon: new Date().toISOString(),
        isarchived: false,
      })

      if (insertError) throw insertError

      alert('Expense logged successfully!')
      setDescription('')
      setAmount('')
      setReceiptFile(null)
      await loadFinancialData()
    } catch (err: any) {
      alert('Error logging expense: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Soft delete expense entry
  const handleArchiveExpense = async (id: number) => {
    const { data:  { user } } = await supabase.auth.getUser()
    if (!confirm('Are you sure you want to remove this expense record?')) return
    await supabase
      .from('expensemaster')
      .update({ isarchived: true, updatedby: user?.user_metadata.username, updatedon: new Date().toISOString() })
      .eq('id', id)
    loadFinancialData()
  }

  const netRevenue = totalIncome - (totalExpenses + totalInventoryValue)

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Header & Filter Controls */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial & Revenue Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor real-time income from completed WhatsApp orders, shop expenses, and overall profit.
          </p>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-2 rounded-lg border bg-white p-1.5 shadow-sm">
          <button
            onClick={() => setFilterPeriod('MTD')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              filterPeriod === 'MTD'
                ? 'bg-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Month-to-Date
          </button>
          <button
            onClick={() => setFilterPeriod('YTD')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              filterPeriod === 'YTD'
                ? 'bg-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Year-to-Date
          </button>
          <button
            onClick={() => setFilterPeriod('ALL')}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              filterPeriod === 'ALL'
                ? 'bg-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Income */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Income</span>
            <span className="rounded-full bg-green-100 p-2 text-green-600">💰</span>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-green-600">
            RM {totalIncome.toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">From completed sales orders</p>
        </div>

        {/* Operating Expenses */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Operating Expenses</span>
            <span className="rounded-full bg-red-100 p-2 text-red-600">🧾</span>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-red-600">
            RM {totalExpenses.toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Utilities, rent, shop costs</p>
        </div>

        {/* Inventory Valuation */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Stock Assets</span>
            <span className="rounded-full bg-blue-100 p-2 text-blue-600">🌸</span>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-blue-600">
            RM {totalInventoryValue.toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Current raw material valuation</p>
        </div>

        {/* Net Revenue */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Net Profit</span>
            <span className={`rounded-full p-2 ${netRevenue >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              📈
            </span>
          </div>
          <div className={`mt-4 text-2xl font-extrabold ${netRevenue >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            RM {netRevenue.toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Income minus expenses & stock</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form: Log New Expense */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900 border-b pb-2">Log New Business Expense</h2>
            
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Electricity Bill, Flower Shipment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600">Amount (RM)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                >
                  <option value="General Utilities">General Utilities</option>
                  <option value="Shop Rental">Shop Rental</option>
                  <option value="Flower Shipment">Flower Shipment</option>
                  <option value="Packaging Supplies">Packaging Supplies</option>
                  <option value="Marketing & Ads">Marketing & Ads</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600">Attach Receipt / Invoice (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full text-xs text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-pink-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-pink-700 hover:file:bg-pink-100"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-pink-600 py-2.5 text-sm font-bold text-white shadow hover:bg-pink-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving Expense...' : 'Record Expenditure'}
              </button>
            </form>
          </div>
        </div>

        {/* Expense History Table */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Operating Expenses Log</h2>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-sm text-gray-500">Loading financial records...</div>
            ) : expensesList.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">No expenses recorded for this period.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-600">Date</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Category & Description</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Amount</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Receipt</th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {expensesList.map((exp) => (
                      <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500">
                          {new Date(exp.createdon).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{exp.description}</div>
                          <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                            {exp.expensecategory || 'General'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-bold text-red-600">
                          RM {Number(exp.amount).toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-xs">
                          {exp.receiptimageurl ? (
                            <a
                              href={exp.receiptimageurl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-blue-600 hover:underline"
                            >
                              View Invoice ↗
                            </a>
                          ) : (
                            <span className="italic text-gray-400">No Attachment</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <button
                            onClick={() => handleArchiveExpense(exp.id)}
                            className="text-xs font-semibold text-red-600 hover:text-red-900 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}