'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import supabase from '@/lib/supabase'
import useStore from '@/lib/store'
import { toast } from 'sonner'

export default function AuthCallbackLayout({ children }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setUser = useStore((state) => state.setUser)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the auth code from the URL
        const code = searchParams.get('code')
        
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
        }

        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error

        if (session?.user) {
          setUser(session.user)
          toast.success('Successfully signed in!')
          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        toast.error('Authentication error: ' + error.message)
        router.push('/login')
      }
    }

    handleCallback()
  }, [router, searchParams, setUser])

  return children
}
