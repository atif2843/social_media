'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

const AuthForm = dynamic(() => import('@/components/AuthForm').then(mod => ({ default: mod.AuthForm })), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded w-full"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  )
})

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 border rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <AuthForm type="login" />
        <p className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-500 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
