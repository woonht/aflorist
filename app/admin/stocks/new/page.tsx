'use client'

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { v4 as uuidv4 } from 'uuid'

export default function NewStockPage() {
    const router = useRouter()
    const supabase = createClient()
    const menuRef = useRef<HTMLDivElement>(null)

    const [stockCode, setStockCode] = useState('')
    const [stockName, setStockName] = useState('')
    const [stockCategory, setStockCategory] = useState('')
    const [stockQuantity, setStockQuantity] = useState('')
    const [unitPrice, setUnitPrice] = useState<number>(0.00)
    const [imageFile, setImageFile] = useState<File | null>(null)

    const [availableStockCategory, setAvailableStockCategory] = useState<{ stockcategory: string }[]>([])

    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        async function fetchdata() {
            const { data: category } = await supabase.from('stockmaster').select('stockcategory').eq('isarchived', false)
            if (category) {
                const distinctCategory = Array.from(
                    new Map(
                        category.map((cat) => [cat.stockcategory, cat])
                    ).values()
                )
                setAvailableStockCategory(distinctCategory)
            }
        } 
        fetchdata()
    },[supabase])

    const filteredStockCategory = availableStockCategory?.filter((cat) => cat.stockcategory.toLowerCase().includes(stockCategory.toLowerCase()))

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if(menuRef.current && !menuRef.current.contains(event.target as Node))
                setIsOpen(false)
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.addEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        try {
            let imageUrl = ''
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop()
                const filename = `${uuidv4()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('item-images')
                    .upload(`public/${filename}`, imageFile)

                if (uploadError) throw new Error ('Image upload failed: ' + uploadError.message)
                
                const { data: publicUrlData } = supabase.storage
                    .from('item-iamges')
                    .getPublicUrl(`public/${filename}`)

                imageUrl = publicUrlData.publicUrl
            }

            const { error : itemError } = await supabase.from('stockmaster').insert({
                stockcode: stockCode,
                stockname: stockName,
                stockcategory: stockCategory,
                stockquantity: stockQuantity,
                unitprice: unitPrice,
                imageurl: imageUrl,
                createdby: user?.user_metadata.username,
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
        <div className="relative">
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
                            <div className="relative" ref={menuRef}>
                                <label className="form-label">Stock Category</label>
                                <input className="form-input" type="text" value={stockCategory} onChange={e => { setStockCategory(e.target.value), setIsOpen(true) }} onFocus={ () => setIsOpen(true) }></input>
                                { isOpen && filteredStockCategory.length > 0 && (
                                    <ul className="absolute z-10 mt-1 max-h-48 w-full rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                                        {filteredStockCategory.map((cat, index) => (
                                            <li key={index}
                                                onClick={() => {
                                                    setStockCategory(cat.stockcategory) // Save selection
                                                    setIsOpen(false) // Close menu
                                                }}
                                                className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors"
                                            >
                                                {cat.stockcategory}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <label className="form-label">Stock Quantity</label>
                                <input className="form-input" type="text" required value={stockQuantity} onChange={e => setStockQuantity(e.target.value)}></input>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">Unit Price (RM)</label>
                                <input className="form-input" type="number" step={0.01} min={0.00} required value={unitPrice} onChange={e => setUnitPrice(isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value))}></input>
                            </div>
                        </div>
                        <div>
                            <label className="form-label mb-2">Stock Image</label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-[#EBA7A0] transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                    </svg>
                                    <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold text-[#EBA7A0]">Click to upload</span> a photo
                                    </p>
                                </div>
                                {/* The actual input is hidden, but clicking the label triggers it */}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    required 
                                    onChange={e => setImageFile(e.target.files?.[0] || null)} 
                                    className="hidden" 
                                />
                                </label>
                            </div>
                            {/* Show the selected file name if one exists */}
                            {imageFile && (
                                <p className="mt-2 text-sm text-green-600 font-medium">Selected: {imageFile.name}</p>
                            )}
                            </div>
                        <button className="button w-full py-3 font-semibold text-white disabled:opacity-50" type="submit" disabled={isLoading}>
                            {isLoading ? "Uploading & Saving..." : "Save Stock"}
                        </button>
                    </div>
                </form>
            </div>
            {imageFile && (
                <div className="absolute w-75 left-[calc(50%+420px)] top-8 bg-white rounded-lg p-6 mt-15 shadow-md">
                    <p className="mb-2 text-sm font-semibold text-gray-800">Stock Image: </p>
                    <img src={URL.createObjectURL(imageFile)} alt="Stock Image" className="w-full h-full shadow-md"/>
                </div>
            )}
        </div>
    )
}
