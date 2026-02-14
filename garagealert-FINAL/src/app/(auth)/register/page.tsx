'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [garageName, setGarageName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. Create the auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // 2. Update the garage name (the garage row was auto-created by the trigger)
    if (data.user) {
      await supabase
        .from('garages')
        .update({ name: garageName })
        .eq('user_id', data.user.id)
    }

    toast.success('Account created! Check your email to confirm, then sign in.')
    router.push('/login')
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
          Start your free trial
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          14 days free. No card required.
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            id="garageName"
            label="Garage name"
            type="text"
            placeholder="e.g., Smith's Auto Services"
            value={garageName}
            onChange={(e) => setGarageName(e.target.value)}
            required
          />

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
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      <p className="text-sm text-gray-500 text-center mt-4">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  )
}
