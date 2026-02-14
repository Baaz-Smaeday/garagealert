import { Bell } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900 tracking-tight">GarageAlert</span>
      </div>
      {children}
    </div>
  )
}
