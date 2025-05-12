"use client"
import { CartProvider } from "./contexts/cart-context"
import { ProductProvider } from "./contexts/product-context"
import AppContent from "./components/app-content"

// Main App component that provides context
export default function App() {
  return (
    <ProductProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </ProductProvider>
  )
}
