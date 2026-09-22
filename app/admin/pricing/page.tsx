'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client' // Built in Phase 1
import { ItemMaster, ItemDetails, StockMaster } from '@/types/database' // Defined in Phase 2

interface ExtendedProductPricing extends ItemMaster {
  calculatedCostPrice: number;
  suggestedPrice: number;
  recipeSummary: { stockName: string; quantity: number; unitPrice: number }[];
}

export default function PricingEnginePage() {
  const supabase = createClient()
  const [pricingData, setPricingData] = useState<ExtendedProductPricing[]>([])
  const [markupMultiplier, setMarkupMultiplier] = useState<number>(3.0) // Default florist markup
  const [editingPrices, setEditingPrices] = useState<{ [itemCode: string]: number }>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)

  // Fetch products, details, and stock to calculate cost prices
  const fetchPricingData = async () => {
    setIsLoading(true)

    // 1. Fetch non-archived bouquets[cite: 4]
    const { data: items } = await supabase
      .from('ItemMaster')
      .select('*')
      .eq('IsArchived', false)
      .order('CreatedOn', { ascending: false })

    // 2. Fetch raw material recipes[cite: 4]
    const { data: details } = await supabase
      .from('ItemDetails')
      .select('*')
      .eq('IsArchived', false)

    // 3. Fetch raw material costs[cite: 4]
    const { data: stocks } = await supabase
      .from('StockMaster')
      .select('*')
      .eq('IsArchived', false)

    if (items && details && stocks) {
      // Build lookup maps for fast access
      const stockMap = new Map<string, StockMaster>()
      stocks.forEach((s) => stockMap.set(s.StockCode, s))

      const computed: ExtendedProductPricing[] = items.map((item) => {
        // Find all raw materials linked to this specific bouquet
        const itemRecipe = details.filter((d) => d.ItemCode === item.ItemCode)

        let totalCost = 0
        const recipeSummary: { stockName: string; quantity: number; unitPrice: number }[] = []

        itemRecipe.forEach((detail) => {
          const stock = stockMap.get(detail.StockCode)
          const unitPrice = stock?.UnitPrice || 0
          totalCost += unitPrice * detail.Quantity

          if (stock) {
            recipeSummary.push({
              stockName: stock.StockName,
              quantity: detail.Quantity,
              unitPrice: unitPrice,
            })
          }
        })

        return {
          ...item,
          calculatedCostPrice: totalCost,
          suggestedPrice: totalCost * markupMultiplier,
          recipeSummary,
        }
      })

      setPricingData(computed)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPricingData()
  }, [markupMultiplier])

  // Track user edits in price inputs
  const handlePriceInputChange = (itemCode: string, value: string) => {
    setEditingPrices({
      ...editingPrices,
      [itemCode]: parseFloat(value) || 0,
    })
  }

  // Pre-fill input with the calculated suggested price
  const handleApplySuggestedPrice = (itemCode: string, suggestedPrice: number) => {
    setEditingPrices({
      ...editingPrices,
      [itemCode]: parseFloat(suggestedPrice.toFixed(2)),
    })
  }

  // Save new selling price to ItemMaster in Supabase[cite: 3]
  const handleSavePrice = async (itemCode: string) => {
    const newPrice = editingPrices[itemCode]
    if (newPrice === undefined) return

    setIsSaving(itemCode)
    const { error } = await supabase
      .from('ItemMaster')
      .update({
        ItemPrice: newPrice,
        UpdatedOn: new Date().toISOString(),
        UpdatedBy: 'Admin',
      })
      .eq('ItemCode', itemCode)

    if (error) {
      alert('Failed to update price: ' + error.message)
    } else {
      await fetchPricingData()
      alert(`Selling price for ${itemCode} updated to RM ${newPrice.toFixed(2)}`)
    }
    setIsSaving(null)
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Header and Controls */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Costing & Pricing Engine</h1>
          <p className="mt-1 text-gray-600">
            Review raw material costs, calculate profit margins, and update bouquet selling prices.
          </p>
        </div>

        {/* Global Markup Multiplier Setting */}
        <div className="flex items-center gap-3 rounded-lg bg-pink-50 p-4 border border-pink-200">
          <label className="text-sm font-semibold text-gray-800">Target Markup Multiplier:</label>
          <select
            value={markupMultiplier}
            onChange={(e) => setMarkupMultiplier(parseFloat(e.target.value))}
            className="rounded border bg-white p-2 font-bold text-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value={2.0}>2.0x (Budget Margin)</option>
            <option value={2.5}>2.5x (Standard Margin)</option>
            <option value={3.0}>3.0x (Standard Florist Margin)</option>
            <option value={3.5}>3.5x (Premium Margin)</option>
            <option value={4.0}>4.0x (Luxury Margin)</option>
          </select>
        </div>
      </div>

      {/* Main Pricing Table */}
      {isLoading ? (
        <div className="py-20 text-center text-gray-500">Calculating raw material costs...</div>
      ) : pricingData.length === 0 ? (
        <div className="py-20 text-center text-gray-500">No active products found in catalog.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Bouquet Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Recipe Breakdown (Raw Cost)
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Cost Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Suggested Price ({markupMultiplier}x)
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Current Selling Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {pricingData.map((item) => {
                const currentEditVal =
                  editingPrices[item.ItemCode] !== undefined
                    ? editingPrices[item.ItemCode]
                    : item.ItemPrice
                const profitMargin = currentEditVal - item.calculatedCostPrice

                return (
                  <tr key={item.ItemCode} className="hover:bg-gray-50 transition-colors">
                    {/* Item Name & Code */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.ImageUrl ? (
                          <img
                            src={item.ImageUrl}
                            alt={item.ItemName}
                            className="h-12 w-12 rounded-lg object-cover shadow-sm"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-100" />
                        )}
                        <div>
                          <div className="font-bold text-gray-900">{item.ItemName}</div>
                          <div className="text-xs text-gray-500">{item.ItemCode}</div>
                        </div>
                      </div>
                    </td>

                    {/* Recipe List */}
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {item.recipeSummary.length > 0 ? (
                        <ul className="space-y-1">
                          {item.recipeSummary.map((r, i) => (
                            <li key={i}>
                              • {r.stockName} × {r.quantity} (RM {(r.unitPrice * r.quantity).toFixed(2)})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="italic text-gray-400">No materials tagged</span>
                      )}
                    </td>

                    {/* Calculated Cost Price */}
                    <td className="px-6 py-4 font-semibold text-gray-700">
                      RM {item.calculatedCostPrice.toFixed(2)}
                    </td>

                    {/* Suggested Price with Quick Apply Button */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-pink-600">
                          RM {item.suggestedPrice.toFixed(2)}
                        </span>
                        <button
                          onClick={() =>
                            handleApplySuggestedPrice(item.ItemCode, item.suggestedPrice)
                          }
                          className="rounded bg-pink-100 px-2 py-1 text-[10px] font-bold text-pink-700 hover:bg-pink-200 transition-colors"
                          title="Use suggested price as input value"
                        >
                          Use
                        </button>
                      </div>
                    </td>

                    {/* Editable Selling Price Input */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="relative rounded-md shadow-sm">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">
                            RM
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={currentEditVal}
                            placeholder={`Suggested: ${item.suggestedPrice.toFixed(2)}`}
                            onChange={(e) => handlePriceInputChange(item.ItemCode, e.target.value)}
                            className="w-32 rounded-md border border-gray-300 py-1.5 pl-10 pr-3 text-sm font-bold text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div
                          className={`mt-1 text-[11px] font-semibold ${
                            profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          Profit: RM {profitMargin.toFixed(2)}
                        </div>
                      </div>
                    </td>

                    {/* Save Button */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSavePrice(item.ItemCode)}
                        disabled={isSaving === item.ItemCode}
                        className="rounded bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isSaving === item.ItemCode ? 'Saving...' : 'Update Price'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}