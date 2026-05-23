"use client"

import React, { useState } from "react"
import Link from "next/link"
import { SpiderWebBackground } from "@/components/spider-web-background"
import { authClient } from "@/lib/auth-client"

export default function LandingPage() {
  const { data: session, isPending } = authClient.useSession()
  const [isSignOutPending, setIsSignOutPending] = useState(false)

  const handleSignOut = async () => {
    setIsSignOutPending(true)
    await authClient.signOut()
    window.location.assign("/")
  }

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      <SpiderWebBackground />

      {/* Navigation Card */}
      <div className="fixed top-8 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="bg-rose-500 backdrop-blur-2xl border border-rose-600 p-6 rounded-[2rem] w-[300px] shadow-2xl ring-1 ring-rose-400 group hover:border-rose-400 transition-all">
          <div className="mb-4">
            <h3 className="text-white font-bold text-xl">
              {session ? `Welcome, ${session.user.name || "Hunter"}` : "Ready to Spot?"}
            </h3>
            <p className="text-rose-50 text-sm">
              {session ? "You are currently hunting bugs." : "Join the future of debugging."}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {session ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="bg-blue-600 hover:bg-blue-500 text-white text-center py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] active:scale-[0.98]"
                >
                  Go to Dashboard
                </Link>
                <button 
                  onClick={handleSignOut}
                  disabled={isSignOutPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white border border-rose-400 text-center py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSignOutPending ? "Signing out..." : "Sign Out"}
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="bg-blue-600 hover:bg-blue-500 text-white text-center py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] active:scale-[0.98]"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="bg-rose-600 hover:bg-rose-700 text-white border border-rose-400 text-center py-3 rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <div className="mb-8 animate-in zoom-in fade-in duration-1000">
          <svg 
            className="w-32 h-32 text-blue-500 filter drop-shadow-[0_0_25px_rgba(59,130,246,0.6)] animate-[pulse_4s_ease-in-out_infinite]" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
            <path d="M3 7l6 5" />
            <path d="M3 17l6 -5" />
            <path d="M21 7l-6 5" />
            <path d="M21 17l-6 -5" />
            <path d="M12 4v5" />
            <path d="M12 15v5" />
            <path d="M7 3l5 9" />
            <path d="M17 3l-5 9" />
            <path d="M7 21l5 -9" />
            <path d="M17 21l-5 -9" />
          </svg>
        </div>
        
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-500 mb-4 animate-in slide-in-from-bottom-8 duration-1000 delay-200">
          SPOTTING
        </h1>
        
        <div className="text-blue-400 font-medium tracking-[0.3em] uppercase text-xl md:text-2xl animate-in fade-in duration-1000 delay-500">
          Interactive Bug Detection
        </div>
      </div>
    </main>
  )
}
