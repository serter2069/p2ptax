'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export default function CtaSection() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-[#b45309] to-[#7c2d12] relative overflow-hidden">
      {/* decorative */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Уже пришло уведомление?
          </h2>
          <p className="mt-4 text-lg text-white/80 leading-relaxed">
            Создайте заявку — это займёт 3 минуты. Специалисты, которые знают вашу ФНС, напишут сами.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://p2ptax.smartlaunchhub.com/requests/new"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#1e3a8a] font-semibold text-base hover:bg-slate-50 transition-colors shadow-sm"
            >
              Создать заявку
              <ArrowRight size={18} />
            </a>
            <a
              href="https://p2ptax.smartlaunchhub.com/specialists"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/40 text-white font-semibold text-base hover:border-white hover:bg-white/10 transition-colors"
            >
              Каталог специалистов
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-white/60 text-sm">
            <ShieldCheck size={16} className="text-white/60" />
            <span>Бесплатно для клиента · Без регистрации</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
