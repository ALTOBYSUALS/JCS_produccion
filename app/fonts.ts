import { Inter, Space_Mono, Bebas_Neue, Uncial_Antiqua, Anton } from 'next/font/google';

// Fuente principal (Inter)
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', 
});

// Fuente para el ticker digital (Space Mono)
export const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-space-mono',
});

// Fuente para títulos (Bebas Neue)
export const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-bebas-neue',
});

// Fuente medieval para navbar (Uncial Antiqua)
export const uncialAntiqua = Uncial_Antiqua({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-uncial-antiqua',
});

// Fuente impactante para títulos principales (Anton)
export const anton = Anton({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-anton',
}); 