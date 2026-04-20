'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: '\uD83D\uDDFA\uFE0F',
    title: 'Фильтр по городу и ФНС',
    text: 'Только специалисты, которые работают с вашей инспекцией.',
  },
  {
    icon: '\u2709\uFE0F',
    title: 'Специалисты пишут первыми',
    text: 'Не нужно обзванивать всех. Они изучают и приходят к вам.',
  },
  {
    icon: '\uD83D\uDCB0',
    title: 'Бесплатно для клиента',
    text: 'Создать заявку и получить предложения ничего не стоит.',
  },
  {
    icon: '\uD83D\uDD00',
    title: 'Два пути входа',
    text: 'Создать заявку или найти специалиста в каталоге и написать напрямую.',
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-16 sm:py-24 bg-[#1e3a8a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-extrabold text-white text-center mb-12"
        >
          Как это работает
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-white/70 leading-relaxed">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
