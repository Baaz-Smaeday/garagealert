'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Car, Bell, Mail,
  FileText, Settings, CreditCard, LogOut,
  Menu, X, ChevronDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/vehicles', label: 'Vehicles', icon: Car },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/messages', label: 'Messages', icon: Mail },
  { href: '/templates', label: 'Templates', icon: FileText },
]

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <Bell className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">GarageAlert</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-brand-600' : ''}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </Link>
        ))}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold text-gray-900">GarageAlert</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl flex flex-col">
            <NavContent />
          </aside>
        </>
      )}
    </>
  )
}
