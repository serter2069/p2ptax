'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Star, BadgeCheck, MessageCircle } from 'lucide-react'

const SPECIALISTS = [
  {
    name: 'Алексей Морозов',
    city: 'Москва',
    tag: 'Выездная проверка',
    rating: 4.9,
    reviews: 31,
    exp: '12 лет в ФНС',
    gradient: 'from-[#1e3a8a] to-[#3b5fb5]',
    initials: 'АМ',
    online: true,
  },
  {
    name: 'Ирина Козлова',
    city: 'Санкт-Петербург',
    tag: 'Камеральная проверка',
    rating: 4.8,
    reviews: 47,
    exp: '9 лет в ФНС',
    gradient: 'from-[#7c3aed] to-[#a78bfa]',
    initials: 'ИК',
    online: true,
  },
  {
    name: 'Дмитрий Смирнов',
    city: 'Екатеринбург',
    tag: 'ОКК',
    rating: 5.0,
    reviews: 22,
    exp: '8 лет в ФНС',
    gradient: 'from-[#0f766e] to-[#2dd4bf]',
    initials: 'ДС',
    online: false,
  },
]

function SpecialistCard({ spec, index }: { spec: typeof SPECIALISTS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${spec.gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {spec.initials}
          {spec.online && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-slate-900 truncate">{spec.name}</span>
            <BadgeCheck size={14} className="text-[#1e3a8a] flex-shrink-0" />
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{spec.city} · {spec.exp}</div>
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-slate-700">{spec.rating}</span>
            <span className="text-xs text-slate-400">({spec.reviews} отзывов)</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#1e3a8a]/8 text-[#1e3a8a]">
          {spec.tag}
        </span>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-[#b45309] hover:underline">
          <MessageCircle size={12} />
          Написать
        </button>
      </div>
    </motion.div>
  )
}

export default function HeroSection() {
  return (
    <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e3a8a]/8 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-[#1e3a8a]">89 специалистов онлайн</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1e3a8a] leading-[1.1] tracking-tight">
              Специалисты по вашей ФНС —{' '}
              <span className="text-[#b45309]">не юристы из интернета</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
              Практики с опытом в камеральных, выездных и ОКК. Они изучат вашу ситуацию и напишут первыми. Бесплатно для клиента.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="https://p2ptax.smartlaunchhub.com/requests/new"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-[#b45309] text-white font-semibold text-base hover:bg-[#92400e] transition-colors shadow-sm"
              >
                Создать заявку бесплатно
                <ArrowRight size={18} />
              </a>
              <a
                href="https://p2ptax.smartlaunchhub.com/specialists"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border-2 border-[#1e3a8a] text-[#1e3a8a] font-semibold text-base hover:bg-[#1e3a8a] hover:text-white transition-colors"
              >
                Найти специалиста
              </a>
            </div>
          </motion.div>

          {/* Visual — specialist cards (desktop: 3 stacked, mobile: 1 compact) */}
          <div className="relative">
            {/* Desktop: full stack */}
            <div className="hidden lg:flex flex-col gap-3">
              {SPECIALISTS.map((spec, i) => (
                <SpecialistCard key={i} spec={spec} index={i} />
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center"
              >
                <a href="https://p2ptax.smartlaunchhub.com/specialists" className="text-sm font-semibold text-[#1e3a8a] hover:underline">
                  Смотреть всех специалистов →
                </a>
              </motion.div>
            </div>

            {/* Mobile: one card */}
            <div className="lg:hidden mt-8">
              <SpecialistCard spec={SPECIALISTS[0]} index={0} />
              <p className="mt-3 text-center text-sm text-slate-500">
                + ещё 88 специалистов в каталоге
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
