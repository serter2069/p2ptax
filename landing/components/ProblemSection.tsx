'use client'

import { motion } from 'framer-motion'

const cards = [
  {
    icon: '\u26A0\uFE0F',
    title: 'Не знаете, насколько серьёзно',
    text: 'Штраф? Доначисления? Блокировка счёта? Все пугают, никто не объясняет.',
  },
  {
    icon: '\uD83D\uDCCB',
    title: 'Не знаете что делать',
    text: 'Куда идти, что готовить, как разговаривать с инспектором.',
  },
  {
    icon: '\uD83D\uDD0D',
    title: 'Не можете найти нужного',
    text: 'Обычные бухгалтеры разводят руками. Знакомые ненадёжны.',
  },
]

export default function ProblemSection() {
  return (
    <section className="py-16 sm:py-24 bg-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] text-center mb-12"
        >
          С чем приходят на P2PTax
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <div className="text-3xl mb-4">{card.icon}</div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-2">{card.title}</h3>
              <p className="text-[#64748B] leading-relaxed">{card.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
