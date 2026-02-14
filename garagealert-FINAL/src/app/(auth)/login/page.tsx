'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Welcome back!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
          Sign in to your account
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Welcome back. Enter your details below.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            id="email"
            label="Email address"
            type="email"
            placeholder="you@yourgarage.co.uk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            Sign In
          </Button>
        </form>
      </div>

      <p className="text-sm text-gray-500 text-center mt-4">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-brand-600 font-medium hover:text-brand-700">
          Start free trial
        </Link>
      </p>
    </div>
  )
}
