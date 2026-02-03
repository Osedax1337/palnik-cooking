"use client"

import { useState, useEffect } from 'react'

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] opacity-50" />

      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse delay-700" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl">
        <h1 className={`text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
          MOLTO STUDIO
        </h1>

        <p className={`text-xl md:text-2xl text-gray-300 mb-8 ${mounted ? 'animate-fade-in delay-200' : 'opacity-0'}`}>
          AI-Powered Art Portfolio
        </p>

        <div className={`flex gap-4 justify-center ${mounted ? 'animate-fade-in delay-400' : 'opacity-0'}`}>
          <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white hover:scale-105 transition-transform">
            View Portfolio
          </button>
          <button className="px-8 py-3 border-2 border-purple-500 rounded-lg font-semibold hover:bg-purple-500/10 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </section>
  )
}
