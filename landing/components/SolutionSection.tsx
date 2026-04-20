'use client'

import { motion } from 'framer-motion'

const steps = [
  { num: '1', text: 'Создайте заявку' },
  { num: '2', text: 'Специалисты напишут сами' },
  { num: '3', text: 'Выберите и решите вопрос' },
]

export default function SolutionSection() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-semibold text-[#b45309] uppercase tracking-wide mb-3">
            Почему P2PTax
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] leading-tight">
            Большинство юристов дадут консультацию. Нужные люди — решат.
          </h2>
          <p className="mt-6 text-lg text-[#64748B] leading-relaxed">
            P2PTax — маркетплейс специалистов, которые знают вашу ФНС изнутри и берутся за результат. Не за теорию. Опишите ситуацию — они напишут сами.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8"
        >
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center text-lg font-bold mb-3">
                {step.num}
              </div>
              <p className="font-semibold text-[#0f172a]">{step.text}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
