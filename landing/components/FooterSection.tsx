import { Shield } from 'lucide-react'

export default function FooterSection() {
  return (
    <footer className="py-12 bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center">
                <span className="text-white text-[10px] font-extrabold tracking-tight">P2P</span>
              </div>
              <span className="text-lg font-extrabold text-white">P2PTax</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Маркетплейс специалистов по налоговым проверкам ФНС
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-3">
            {[
              ['О сервисе', 'https://p2ptax.smartlaunchhub.com'],
              ['Специалисты', 'https://p2ptax.smartlaunchhub.com/specialists'],
              ['Создать заявку', 'https://p2ptax.smartlaunchhub.com/requests/new'],
              ['Войти', 'https://p2ptax.smartlaunchhub.com/login'],
            ].map(([label, href]) => (
              <a key={href} href={href} className="text-sm text-slate-400 hover:text-white transition-colors">
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500">&copy; 2026 P2PTax</p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Shield size={14} />
            <span>Сервис не оказывает юридических услуг. Платформа для связи с независимыми специалистами.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
