'use client'

import { motion } from 'framer-motion'

export default function CtaSection() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-[#b45309] to-[#92400e]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
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
            Создайте заявку — это займёт 3 минуты. Специалисты напишут сами.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://p2ptax.smartlaunchhub.com/requests/new"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-white text-[#1e3a8a] font-semibold text-base hover:bg-slate-100 transition-colors"
            >
              Создать заявку &rarr;
            </a>
            <a
              href="https://p2ptax.smartlaunchhub.com/specialists"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-white/80 font-semibold text-base hover:text-white transition-colors"
            >
              Смотреть специалистов
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
