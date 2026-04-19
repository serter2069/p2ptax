'use client'

import { motion } from 'framer-motion'
import { ClipboardList, Users, ThumbsUp } from 'lucide-react'

const STEPS = [
  {
    icon: ClipboardList,
    num: '01',
    title: 'Опишите ситуацию',
    text: 'Тип проверки, что пришло, сроки. Занимает 3 минуты. Регистрация не нужна.',
  },
  {
    icon: Users,
    num: '02',
    title: 'Специалисты напишут сами',
    text: 'Практики, которые работали с вашей ФНС, изучат заявку и выйдут на связь.',
  },
  {
    icon: ThumbsUp,
    num: '03',
    title: 'Выберите и решите вопрос',
    text: 'Сравните предложения, выберите подходящего — и получите реальный результат.',
  },
]

export default function SolutionSection() {
  return (
    <section className="py-20 sm:py-28 bg-[#1e3a8a] overflow-hidden relative">
      {/* decorative */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">
            Как это работает
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight max-w-2xl mx-auto">
            Большинство юристов дадут консультацию.{' '}
            <span className="text-amber-400">Нужные люди — решат.</span>
          </h2>
          <p className="mt-5 text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
            P2PTax — маркетплейс специалистов, которые знают вашу ФНС изнутри и берутся за результат.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative flex flex-col items-start"
            >
              {/* connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block absolute top-7 left-[calc(100%_+_16px)] w-8 border-t-2 border-dashed border-white/20" />
              )}
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-5">
                <step.icon size={24} className="text-amber-400" />
              </div>
              <div className="text-xs font-bold text-white/40 mb-1">{step.num}</div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-white/60 leading-relaxed text-sm">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
