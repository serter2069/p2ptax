'use client'

import { motion } from 'framer-motion'
import { MapPin, MessageCircle, Banknote, LayoutGrid } from 'lucide-react'

const FEATURES = [
  {
    icon: MapPin,
    title: 'Фильтр по городу и ФНС',
    text: 'Только специалисты, которые реально работали с вашей инспекцией и знают её практику.',
  },
  {
    icon: MessageCircle,
    title: 'Специалисты пишут первыми',
    text: 'Не нужно никого обзванивать. Разместили заявку — они изучают и сами выходят на связь.',
  },
  {
    icon: Banknote,
    title: 'Бесплатно для клиента',
    text: 'Создать заявку, получить предложения и общаться со специалистами ничего не стоит.',
  },
  {
    icon: LayoutGrid,
    title: 'Два пути входа',
    text: 'Создать заявку и ждать предложений — или найти специалиста в каталоге и написать напрямую.',
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold text-[#b45309] uppercase tracking-widest mb-3">
            Преимущества
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            Почему выбирают P2PTax
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex gap-5 p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:border-[#1e3a8a]/20 hover:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1e3a8a]/8 flex items-center justify-center flex-shrink-0">
                <f.icon size={22} className="text-[#1e3a8a]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
