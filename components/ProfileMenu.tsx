'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  // Create a reference to track the dropdown's physical location on screen
  const menuRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the menu is open, AND the user clicked an element that is NOT inside our menuRef, close it
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // Only attach the background listener when the menu is actually open
    // mousedown fires when mouse is pressed down
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    // Clean up the listener so it doesn't cause memory leaks
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = async () => {
    // Terminate session and route back to login screen[cite: 1, 2]
    setIsOpen(!isOpen)
    await supabase.auth.signOut()
    router.refresh()
    router.push('/admin/login')
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Icon Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xl transition hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Profile Menu"
      >
        <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-4Z" clipRule="evenodd"/>
        </svg>
      </button>
      


      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-30 rounded-md bg-white shadow-lg ring-1 ring-gray-300 ring-opacity-5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"/>
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}