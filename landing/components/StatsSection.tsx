'use client'

import { motion } from 'framer-motion'
import { FileText, Users, CheckCircle, Clock } from 'lucide-react'

const STATS = [
  { icon: FileText, value: '412', label: 'заявок размещено' },
  { icon: Users, value: '89', label: 'проверенных специалистов' },
  { icon: CheckCircle, value: '347', label: 'успешных обращений' },
  { icon: Clock, value: '< 2ч', label: 'среднее время первого ответа' },
]

export default function StatsSection() {
  return (
    <section className="py-10 bg-slate-50 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex flex-col items-center text-center gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1e3a8a]/8 flex items-center justify-center">
                <s.icon size={20} className="text-[#1e3a8a]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1e3a8a]">{s.value}</div>
              <div className="text-sm text-slate-500 leading-tight">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
