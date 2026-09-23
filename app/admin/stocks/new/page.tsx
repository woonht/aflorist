'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function NewStockPage() {
    const router = useRouter()
    const supabase = createClient()

    const [stockCode, setStockCode] = useState('')
    const [stockName, setStockName] = useState('')
    const [stockCategory, setStockCategory] = useState<string|null>(null)
    const [stockQuantity, setStockQuantity] = useState('')
    const [unitPrice, setUnitPrice] = useState<number>(0.00)
    const [createdBy, setCreatedBy] = useState('')

    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error : itemError } = await supabase.from('stockmaster').insert({
                stockcode: stockCode,
                stockname: stockName,
                stockcategory: stockCategory,
                stockquantity: stockQuantity,
                unitprice: unitPrice,
                createdby: createdBy,
                createdon: new Date().toISOString()
            })

            if (itemError) throw new Error ("Stock creation failed: " + itemError.message)
            router.push('/admin/stocks')
        }
        catch (err: any) {
            alert(err.message)
        }
        finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl p-8">
            <h1 className="mb-6 text-3xl font-bold text-gray-900">Upload New Stock</h1>
            <form onSubmit={handleSubmit}>
                <div className="space-y-6 rounded-lg bg-white p-6 shadow-md">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Stock Code</label>
                            <input className="form-input" type="text" required value={stockCode} onChange={e => setStockCode(e.target.value)}></input>
                        </div>
                        <div>
                            <label className="form-label">Stock Name</label>
                            <input className="form-input" type="text" required value={stockName} onChange={e => setStockName(e.target.value)}></input>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Stock Category</label>
                            <input className="form-input" type="text" value={stockCategory || ''} onChange={e => setStockCategory(e.target.value)}></input>
                        </div>
                        <div>
                            <label className="form-label">Stock Quantity</label>
                            <input className="form-input" type="text" required value={stockQuantity} onChange={e => setStockQuantity(e.target.value)}></input>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Unit Price (RM)</label>
                            <input className="form-input" type="number" step={0.01} min={0.00} required value={unitPrice} onChange={e => setUnitPrice(parseFloat(e.target.value))}></input>
                        </div>
                        <div>
                            <label className="form-label">Created By</label>
                            <input className="form-input" type="text" required value={createdBy} onChange={e => setCreatedBy(e.target.value)}></input>
                        </div>
                    </div>
                    <button className="button w-full py-3 font-semibold text-white disabled:opacity-50" type="submit" disabled={isLoading}>
                        {isLoading ? "Uploading & Saving..." : "Save Stock"}
                    </button>
                </div>
            </form>
        </div>
    )
}
