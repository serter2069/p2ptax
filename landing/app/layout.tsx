import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'P2PTax — Специалисты по проверкам ФНС',
  description: 'Маркетплейс специалистов по камеральным, выездным проверкам и ОКК. Создайте заявку — специалисты по вашей ФНС напишут сами. Бесплатно.',
  openGraph: {
    title: 'P2PTax — Специалисты по проверкам ФНС',
    description: 'Маркетплейс специалистов по ФНС-проверкам. Создайте заявку бесплатно.',
    locale: 'ru_RU',
    type: 'website',
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
