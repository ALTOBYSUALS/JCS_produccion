import type { Metadata } from 'next'
import './globals.css'
import { uncialAntiqua } from '@/app/fonts'
import React from 'react'
import { Inter } from 'next/font/google'
import { Bebas_Neue } from 'next/font/google'
import { Space_Mono } from 'next/font/google'

export const metadata: Metadata = {
  title: 'JCS El Guardián - Neumáticos y Llantas',
  description: 'Las mejores marcas en Neumáticos y Llantas. Servicios de Calidad y Confianza en San Justo.',
  icons: {
    icon: 'https://res.cloudinary.com/dt5pkdr0k/image/upload/v1747061148/Asset_1-8_hychdy.png',
    shortcut: 'https://res.cloudinary.com/dt5pkdr0k/image/upload/v1747061148/Asset_1-8_hychdy.png',
    apple: 'https://res.cloudinary.com/dt5pkdr0k/image/upload/v1747061148/Asset_1-8_hychdy.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: 'https://res.cloudinary.com/dt5pkdr0k/image/upload/v1747061148/Asset_1-8_hychdy.png',
    },
  },
}

const inter = Inter({
  variable: '--font-inter',
  weight: '400',
  subsets: ['latin'],
})

const bebasNeue = Bebas_Neue({
  variable: '--font-bebas-neue',
  weight: '400',
  subsets: ['latin'],
})

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  weight: '400',
  subsets: ['latin'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${bebasNeue.variable} ${spaceMono.variable} ${uncialAntiqua.variable} font-sans antialiased bg-gray-100 text-gray-800`}>
      <head>
        {/* El favicon se manejará a través del objeto metadata en Next.js 13+ */}
        {/* Si se necesitara un control más directo o para versiones anteriores, se usaría:
        <link rel="icon" href="https://res.cloudinary.com/dt5pkdr0k/image/upload/v1747061148/Asset_1-8_hychdy.png" />
        */}
        {/* Script de Mercado Pago */}
        <script src="https://sdk.mercadopago.com/js/v2" async></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
