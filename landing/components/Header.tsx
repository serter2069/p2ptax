'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Специалисты', href: 'https://p2ptax.smartlaunchhub.com/specialists' },
  { label: 'Как это работает', href: '#how-it-works' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center">
              <span className="text-white text-[10px] font-extrabold tracking-tight">P2P</span>
            </div>
            <span className="text-lg font-extrabold text-[#1e3a8a]">P2PTax</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-slate-600 hover:text-[#1e3a8a] transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="https://p2ptax.smartlaunchhub.com/login" className="text-sm font-semibold text-slate-600 hover:text-[#1e3a8a] transition-colors">
              Войти
            </a>
            <a href="https://p2ptax.smartlaunchhub.com/requests/new" className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#b45309] text-white font-semibold text-sm hover:bg-[#92400e] transition-colors">
              Создать заявку
            </a>
          </div>

          <button className="md:hidden p-2 -mr-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors" onClick={() => setMenuOpen(v => !v)} aria-label="Меню">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <nav className="absolute top-16 left-0 right-0 bg-white border-t border-slate-100 shadow-2xl">
            <div className="px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="py-3 px-3 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                <a href="https://p2ptax.smartlaunchhub.com/login" className="py-3 px-3 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-50 transition-colors text-center border border-slate-200" onClick={() => setMenuOpen(false)}>
                  Войти
                </a>
                <a href="https://p2ptax.smartlaunchhub.com/requests/new" className="py-3.5 rounded-xl bg-[#b45309] text-white font-semibold text-base text-center hover:bg-[#92400e] transition-colors" onClick={() => setMenuOpen(false)}>
                  Создать заявку бесплатно
                </a>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
