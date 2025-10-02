'use client'

import { useEffect, useState } from 'react'
import { checkHeaderSize, redirectToFixIfNeeded, logHeaderSizeWarning } from '@/lib/utils/header-size-detector'
import { toast } from 'sonner'

interface HeaderSizeGuardProps {
  children: React.ReactNode
}

export function HeaderSizeGuard({ children }: HeaderSizeGuardProps) {
  const [headerCheckComplete, setHeaderCheckComplete] = useState(false)
  const [hasHeaderIssue, setHasHeaderIssue] = useState(false)

  useEffect(() => {
    const performHeaderCheck = async () => {
      try {
        const headerInfo = await checkHeaderSize()
        
        // Log warning if needed (but don't redirect automatically)
        logHeaderSizeWarning(headerInfo)
        
        // DISABLED: Automatic redirect to fix pages
        // This was causing redirect loops with large Supabase auth cookies
        // const redirected = redirectToFixIfNeeded(headerInfo)
        
        setHeaderCheckComplete(true)
        
        // Show warning toast if header size is concerning (but don't redirect)
        if (headerInfo.needsFix) {
          console.warn('Header size is large:', headerInfo)
          toast.warning(`Header size is ${Math.round(headerInfo.totalEstimated/1024)}KB. Consider clearing cookies if you experience issues.`, {
            action: {
              label: 'Clear Cookies',
              onClick: () => window.location.href = '/clear-cookies'
            },
            duration: 15000
          })
        }
        
      } catch (error) {
        console.error('Header check failed:', error)
        
        // Don't redirect on error - just complete the check
        setHeaderCheckComplete(true)
        
        // Show a non-blocking warning
        toast.warning('Could not check header size. If you experience issues, try clearing cookies.', {
          duration: 10000
        })
      }
    }

    performHeaderCheck()
  }, [])

  // Show loading state while checking headers (brief)
  if (!headerCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If header check passed, render the children
  return <>{children}</>
}

export default HeaderSizeGuard
