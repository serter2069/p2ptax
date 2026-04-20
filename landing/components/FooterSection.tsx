export default function FooterSection() {
  return (
    <footer className="py-12 bg-[#1e3a8a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="text-xl font-extrabold text-white">P2PTax</span>
          <nav className="flex gap-6 text-sm text-white/70">
            <a href="https://p2ptax.smartlaunchhub.com" className="hover:text-white transition-colors">
              О сервисе
            </a>
            <a href="https://p2ptax.smartlaunchhub.com/specialists" className="hover:text-white transition-colors">
              Специалисты
            </a>
            <a href="https://p2ptax.smartlaunchhub.com/requests/new" className="hover:text-white transition-colors">
              Создать заявку
            </a>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-sm text-white/50">
            &copy; 2026 P2PTax
          </p>
          <p className="mt-2 text-xs text-white/30">
            Сервис не оказывает юридических услуг. Платформа для связи клиентов со специалистами.
          </p>
        </div>
      </div>
    </footer>
  )
}
