'use client'

import { useEffect, useState } from 'react'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 bg-white ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/" className="text-xl font-extrabold text-[#1e3a8a]">
          P2PTax
        </a>
        <a
          href="https://p2ptax.smartlaunchhub.com"
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#b45309] text-white font-semibold text-sm hover:bg-[#92400e] transition-colors"
        >
          Создать заявку
        </a>
      </div>
    </header>
  )
}
