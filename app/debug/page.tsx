'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    setInfo({
      pathname: window.location.pathname,
      origin: window.location.origin,
      href: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Debug Information</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Location</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(info, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Route Tests</h2>
          <div className="space-y-2">
            <a href="/" className="block text-blue-600 hover:underline">→ Home (/)</a>
            <a href="/login" className="block text-blue-600 hover:underline">→ Login (/login)</a>
            <a href="/signup" className="block text-blue-600 hover:underline">→ Signup (/signup)</a>
            <a href="/pricing" className="block text-blue-600 hover:underline">→ Pricing (/pricing)</a>
            <a href="/dashboard" className="block text-blue-600 hover:underline">→ Dashboard (/dashboard)</a>
            <a href="/budget" className="block text-blue-600 hover:underline">→ Budget (/budget)</a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Expected Behavior</h2>
          <ul className="space-y-2 text-sm">
            <li>✅ <strong>Home (/):</strong> Should show landing page</li>
            <li>✅ <strong>Login/Signup:</strong> Should show auth forms</li>
            <li>✅ <strong>Marketing pages:</strong> Should be accessible</li>
            <li>🔒 <strong>App pages:</strong> Should redirect to login if not authenticated</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
