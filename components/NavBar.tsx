import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ProfileMenu from './ProfileMenu'

export default async function Navbar() {
    const supabase = await createClient()
    const { data : { user } } = await supabase.auth.getUser()

    return (    
        <nav className="sticky top-0 z-50 bg-navbar p-4 backdrop-blur-md shadow-sm">
            {!user ? (
                <div className="mx-auto flex max-w-7xl items-center justify-between m-2">
                    <Link
                        href="/"
                        className="absolute left-10 top-18 -translate-y-1/2"
                    >
                        <img
                            src="/logo.jpeg"
                            alt="Company Logo"
                            className="h-30 w-30 rounded-full border-3 border-gray-200 object-cover shadow-md"
                        />
                    </Link>
                
                    <div className="flex gap-6 font-medium items-center ml-auto">
                        <>
                            <Link href="/" className="text-navbar">
                                Catalog
                            </Link>
                            <Link href="/admin/login" className="text-navbar">
                                Login
                            </Link>
                        </>
                    </div>
                </div>
            ) : (
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <Link
                        href="/admin"
                        className="absolute left-10 top-18 -translate-y-1/2"
                    >
                        <img
                            src="/logo.jpeg"
                            alt="Company Logo"
                            className="h-30 w-30 rounded-full border-3 border-gray-200 object-cover shadow-md"
                        />
                    </Link>
                    <div className="flex gap-6 font-medium items-center ml-auto">
                        <>
                            <div className="flex gap-6">
                                <Link href="/" className="text-navbar">
                                    Catalog
                                </Link>
                                <Link href="/admin/layout" className="text-navbar">
                                    Layout
                                </Link>
                                <Link href="/admin/pricing" className="text-navbar">
                                    Pricing
                                </Link>
                                <Link href="/admin/products" className="text-navbar">
                                    Products
                                </Link>
                            </div>
                            <div className="ml-4 border-l border-gray-200 pl-4">
                                <ProfileMenu />
                            </div>
                        </> 
                    </div>
                </div>
            )}
        </nav>
    )
}