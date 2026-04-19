'use client'

import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { useState } from 'react'

const TYPES = [
  { label: 'Камеральная проверка', value: 'camera' },
  { label: 'Выездная проверка', value: 'field' },
  { label: 'ОКК', value: 'okk' },
  { label: 'Не знаю тип', value: 'unknown' },
]

export default function MiniRequestSection() {
  const [selected, setSelected] = useState<string | null>(null)

  const ctaUrl = selected
    ? `https://p2ptax.smartlaunchhub.com/requests/new?type=${selected}`
    : 'https://p2ptax.smartlaunchhub.com/requests/new'

  return (
    <section className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-10"
        >
          <p className="text-xs font-semibold text-[#b45309] uppercase tracking-widest mb-3">
            Начните прямо сейчас
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-2">
            Что пришло?
          </h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Выберите тип — специалисты с опытом именно по этому направлению увидят заявку первыми.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelected(t.value)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                  selected === t.value
                    ? 'border-[#1e3a8a] bg-[#1e3a8a]/5 text-[#1e3a8a]'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selected === t.value ? 'border-[#1e3a8a] bg-[#1e3a8a]' : 'border-slate-300'
                }`}>
                  {selected === t.value && <CheckCircle size={12} className="text-white" />}
                </div>
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>

          <a
            href={ctaUrl}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-[#b45309] text-white font-semibold text-base hover:bg-[#92400e] transition-colors shadow-sm"
          >
            Описать ситуацию
            <ArrowRight size={18} />
          </a>

          <p className="mt-4 text-center text-xs text-slate-400">
            Бесплатно · Без регистрации · Специалисты напишут сами
          </p>
        </motion.div>
      </div>
    </section>
  )
}
