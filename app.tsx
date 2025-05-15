"use client"

import { useState, useEffect } from "react"
import { CartProvider } from "./contexts/cart-context"
import { ProductProvider } from "./contexts/product-context"
import dynamic from 'next/dynamic'

// Dynamically import AppContent with no SSR to avoid context issues
const AppContent = dynamic(() => import('./components/app-content'), { 
  ssr: false,
  loading: () => <Loading />
})

// Simple loading component
function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-12 h-12 border-4 border-red-600 border-solid border-t-transparent rounded-full animate-spin"></div>
      <p className="ml-4 text-gray-700" style={{ fontFamily: "var(--font-uncial-antiqua)" }}>Cargando aplicación...</p>
    </div>
  )
}

// ClientOnly component to ensure we only render when mounted
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)
  
  useEffect(() => {
    setHasMounted(true)
  }, [])
  
  if (!hasMounted) {
    return <Loading />
  }
  
  return <>{children}</>
}

// Componente que envuelve la aplicación y maneja el lado del cliente
export default function App() {
  return (
    <ClientOnly>
      <ProductProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </ProductProvider>
    </ClientOnly>
  )
}
