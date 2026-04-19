export default function HeroSection() {
  return (
    <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1e3a8a] leading-tight">
              Специалисты по вашей ФНС — не юристы из интернета
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[#64748B] leading-relaxed">
              Практики с опытом в камеральных, выездных и ОКК. Выберите сами или получите предложения.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="https://p2ptax.smartlaunchhub.com/requests/new"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-[#b45309] text-white font-semibold text-base hover:bg-[#92400e] transition-colors"
              >
                Создать заявку бесплатно &rarr;
              </a>
              <a
                href="https://p2ptax.smartlaunchhub.com/specialists"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border-2 border-[#1e3a8a] text-[#1e3a8a] font-semibold text-base hover:bg-[#1e3a8a] hover:text-white transition-colors"
              >
                Смотреть каталог
              </a>
            </div>
          </div>

          {/* Visual — mock specialist cards */}
          <div className="hidden lg:block">
            <div className="space-y-4">
              {[
                { name: 'Алексей М.', rating: 4.9, tag: 'Выездная проверка' },
                { name: 'Ирина К.', rating: 4.8, tag: 'Камеральная проверка' },
                { name: 'Дмитрий С.', rating: 5.0, tag: 'ОКК' },
              ].map((spec, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1e3a8a]/10 flex items-center justify-center text-[#1e3a8a] font-bold text-lg">
                    {spec.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#0f172a]">{spec.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-amber-500 text-sm">
                        {'★'.repeat(Math.floor(spec.rating))}
                      </span>
                      <span className="text-sm text-[#64748B]">{spec.rating}</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#1e3a8a]/10 text-[#1e3a8a]">
                    {spec.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
