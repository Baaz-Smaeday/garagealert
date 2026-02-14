import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: { value: string; positive: boolean }
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-brand-600" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {trend && (
        <p className={`text-xs mt-1 ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  )
}
