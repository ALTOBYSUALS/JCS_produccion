import type { Metadata } from 'next'
import './globals.css'
import { inter, bebasNeue } from '@/app/fonts'
import React from 'react'

export const metadata: Metadata = {
  title: 'JCS El Guardián - Neumáticos y Llantas',
  description: 'Las mejores marcas en Neumáticos y Llantas. Servicios de Calidad y Confianza en San Justo.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${bebasNeue.variable}`}>
      <body>{children}</body>
    </html>
  )
}
