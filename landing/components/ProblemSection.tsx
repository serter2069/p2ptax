'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, HelpCircle, UserX } from 'lucide-react'

const PROBLEMS = [
  {
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    title: 'Не знаете, насколько серьёзно',
    text: 'Требование пришло — штраф? Доначисления? Блокировка счёта? Все пугают, никто не даёт прямого ответа.',
  },
  {
    icon: HelpCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    title: 'Не знаете, что делать',
    text: 'Куда идти, что готовить к проверке, как правильно разговаривать с инспектором — инструкций нет.',
  },
  {
    icon: UserX,
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    title: 'Не можете найти нужного',
    text: 'Обычные бухгалтеры разводят руками. Знакомые советуют "просто заплати". Нужен тот, кто знает изнутри.',
  },
]

export default function ProblemSection() {
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
            Узнаёте себя?
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            С чем приходят на P2PTax
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
            >
              <div className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center mb-5`}>
                <p.icon size={24} className={p.color} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{p.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
