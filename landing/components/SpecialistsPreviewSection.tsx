'use client'

import { motion } from 'framer-motion'
import { Star, BadgeCheck, ArrowRight, MessageCircle, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

const ALL_SPECIALISTS = [
  { name: 'Алексей Морозов', city: 'Москва', type: 'Выездная', rating: 4.9, reviews: 31, exp: '12 лет в ФНС', gradient: 'from-[#1e3a8a] to-[#3b5fb5]', initials: 'АМ', online: true },
  { name: 'Ирина Козлова', city: 'СПб', type: 'Камеральная', rating: 4.8, reviews: 47, exp: '9 лет в ФНС', gradient: 'from-[#7c3aed] to-[#a78bfa]', initials: 'ИК', online: true },
  { name: 'Дмитрий Смирнов', city: 'Екатеринбург', type: 'ОКК', rating: 5.0, reviews: 22, exp: '8 лет в ФНС', gradient: 'from-[#0f766e] to-[#2dd4bf]', initials: 'ДС', online: false },
  { name: 'Светлана Петрова', city: 'Новосибирск', type: 'Камеральная', rating: 4.7, reviews: 38, exp: '11 лет в ФНС', gradient: 'from-[#be185d] to-[#f472b6]', initials: 'СП', online: true },
  { name: 'Роман Васильев', city: 'Казань', type: 'Выездная', rating: 4.9, reviews: 19, exp: '7 лет в ФНС', gradient: 'from-[#92400e] to-[#f59e0b]', initials: 'РВ', online: false },
  { name: 'Наталья Фёдорова', city: 'Москва', type: 'ОКК', rating: 4.8, reviews: 55, exp: '14 лет в ФНС', gradient: 'from-[#1e3a8a] to-[#60a5fa]', initials: 'НФ', online: true },
]

const FILTERS = ['Все', 'Камеральная', 'Выездная', 'ОКК']

export default function SpecialistsPreviewSection() {
  const [active, setActive] = useState('Все')

  const shown = ALL_SPECIALISTS.filter(s => active === 'Все' || s.type === active)

  return (
    <section className="py-20 sm:py-28 bg-slate-50" id="how-it-works">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10"
        >
          <div>
            <p className="text-xs font-semibold text-[#b45309] uppercase tracking-widest mb-3">
              Каталог
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Специалисты, которые берутся за результат
            </h2>
          </div>
          <a
            href="https://p2ptax.smartlaunchhub.com/specialists"
            className="flex items-center gap-2 text-sm font-semibold text-[#1e3a8a] whitespace-nowrap hover:underline"
          >
            Все специалисты
            <ArrowRight size={16} />
          </a>
        </motion.div>

        {/* Filter chips */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-2 mb-8 flex-wrap"
        >
          <SlidersHorizontal size={16} className="text-slate-400 flex-shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                active === f
                  ? 'bg-[#1e3a8a] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-[#1e3a8a] hover:text-[#1e3a8a]'
              }`}
            >
              {f}
            </button>
          ))}
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((spec, i) => (
            <motion.div
              key={spec.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${spec.gradient} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                  {spec.initials}
                  {spec.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-900 text-sm truncate">{spec.name}</span>
                    <BadgeCheck size={15} className="text-[#1e3a8a] flex-shrink-0" />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{spec.city} · {spec.exp}</div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-slate-700">{spec.rating}</span>
                    <span className="text-xs text-slate-400">({spec.reviews})</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                  spec.type === 'Выездная' ? 'bg-blue-50 text-blue-700' :
                  spec.type === 'Камеральная' ? 'bg-violet-50 text-violet-700' :
                  'bg-teal-50 text-teal-700'
                }`}>
                  {spec.type}
                </span>
                <a
                  href="https://p2ptax.smartlaunchhub.com/specialists"
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#b45309] hover:underline"
                >
                  <MessageCircle size={14} />
                  Написать
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <a
            href="https://p2ptax.smartlaunchhub.com/specialists"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-[#1e3a8a] text-[#1e3a8a] font-semibold text-base hover:bg-[#1e3a8a] hover:text-white transition-colors"
          >
            Смотреть всех {ALL_SPECIALISTS.length > 6 ? '89' : ''} специалистов
            <ArrowRight size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
