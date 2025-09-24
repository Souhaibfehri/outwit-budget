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
        
        // Log warning if needed
        logHeaderSizeWarning(headerInfo)
        
        // Check if we need to redirect to fix page
        const redirected = redirectToFixIfNeeded(headerInfo)
        
        if (!redirected) {
          setHeaderCheckComplete(true)
          
          // Show warning toast if header size is concerning
          if (headerInfo.needsFix && !headerInfo.exceedsLimit) {
            toast.warning('Header size is getting large. Consider clearing data to prevent issues.', {
              action: {
                label: 'Fix Now',
                onClick: () => window.location.href = '/fix-now'
              },
              duration: 10000
            })
          }
        } else {
          setHasHeaderIssue(true)
        }
        
      } catch (error) {
        console.error('Header check failed:', error)
        
        // If header check fails, it might be due to header size issues
        // Redirect to fix page as a precaution
        const currentPath = window.location.pathname
        const fixPaths = ['/fix-now', '/fix-headers', '/fix', '/login', '/signup']
        const isOnFixPage = fixPaths.some(path => currentPath.startsWith(path))
        
        if (!isOnFixPage) {
          window.location.href = '/fix-now'
          setHasHeaderIssue(true)
        } else {
          setHeaderCheckComplete(true)
        }
      }
    }

    performHeaderCheck()
  }, [])

  // Show loading state while checking headers
  if (!headerCheckComplete && !hasHeaderIssue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking system status...</p>
        </div>
      </div>
    )
  }

  // If we have a header issue and redirect is in progress, show nothing
  if (hasHeaderIssue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-red-600">Redirecting to fix critical issue...</p>
        </div>
      </div>
    )
  }

  // If header check passed, render the children
  return <>{children}</>
}

export default HeaderSizeGuard
