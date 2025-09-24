'use client'

import { createClient } from '@/lib/supabase/client'

export interface HeaderSizeInfo {
  metadataSize: number
  cookiesSize: number
  totalEstimated: number
  exceedsLimit: boolean
  needsFix: boolean
}

export async function checkHeaderSize(): Promise<HeaderSizeInfo> {
  try {
    const supabase = createClient()
    
    // Get user metadata
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return {
        metadataSize: 0,
        cookiesSize: 0,
        totalEstimated: 0,
        exceedsLimit: false,
        needsFix: false
      }
    }

    const metadata = user.user_metadata || {}
    const metadataSize = JSON.stringify(metadata).length
    
    // Check cookies size
    const cookiesSize = document.cookie.length
    
    // Estimate total header size (conservative)
    const estimatedOtherHeaders = 2000 // User-Agent, Accept, etc.
    const totalEstimated = metadataSize + cookiesSize + estimatedOtherHeaders
    
    // Vercel limit is 16KB, but we want a safety margin
    const safeLimit = 12000 // 12KB safe limit
    const hardLimit = 16000 // 16KB hard limit
    
    const exceedsLimit = totalEstimated > hardLimit
    const needsFix = totalEstimated > safeLimit
    
    return {
      metadataSize,
      cookiesSize,
      totalEstimated,
      exceedsLimit,
      needsFix
    }
    
  } catch (error) {
    console.error('Error checking header size:', error)
    
    // If we can't check, assume we need a fix
    return {
      metadataSize: 0,
      cookiesSize: 0,
      totalEstimated: 20000, // Assume large
      exceedsLimit: true,
      needsFix: true
    }
  }
}

export function redirectToFixIfNeeded(headerInfo: HeaderSizeInfo): boolean {
  if (headerInfo.exceedsLimit) {
    console.warn('🚨 Header size exceeds limit, redirecting to fix page')
    
    // Don't redirect if we're already on a fix page
    const currentPath = window.location.pathname
    const fixPaths = ['/fix-now', '/fix-headers', '/fix', '/migrate', '/login', '/signup']
    const isOnFixPage = fixPaths.some(path => currentPath.startsWith(path))
    
    if (!isOnFixPage) {
      window.location.href = '/fix-now'
      return true
    }
  }
  
  return false
}

export function logHeaderSizeWarning(headerInfo: HeaderSizeInfo) {
  if (headerInfo.needsFix) {
    console.warn('⚠️ Header size warning:', {
      metadataSize: `${Math.round(headerInfo.metadataSize / 1024)}KB`,
      totalEstimated: `${Math.round(headerInfo.totalEstimated / 1024)}KB`,
      limit: '16KB',
      recommendation: 'Visit /fix-now to reduce metadata size'
    })
  }
}
