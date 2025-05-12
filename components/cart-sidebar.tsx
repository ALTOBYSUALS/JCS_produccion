"use client"

import type React from "react"
import { XIcon as XMarkIcon, TrashIcon } from "lucide-react"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

interface CartSidebarProps {
  isCartOpen: boolean
  toggleCart: () => void
  cartItems: CartItem[]
  clearCart: () => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  totalPrice: number
}

const CartSidebar: React.FC<CartSidebarProps> = ({
  isCartOpen,
  toggleCart,
  cartItems,
  clearCart,
  removeFromCart,
  updateQuantity,
  totalPrice,
}) => {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-full md:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        isCartOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Carrito de Compras</h2>
          <button
            onClick={toggleCart}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Cerrar carrito"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
            <button
              onClick={toggleCart}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            >
              Continuar Comprando
            </button>
          </div>
        ) : (
          <>
            <div className="flex-grow overflow-y-auto p-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center mb-4 pb-4 border-b">
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden mr-4">
                    <img
                      src={item.imageUrl || "https://placehold.co/80x80/cccccc/ffffff?text=N/A"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm font-medium line-clamp-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">${item.price.toLocaleString("es-AR")}</p>
                    <div className="flex items-center mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-6 h-6 flex items-center justify-center border rounded-l"
                      >
                        -
                      </button>
                      <span className="w-8 h-6 flex items-center justify-center border-t border-b">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center border rounded-r"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto text-red-500 hover:text-red-700"
                        aria-label="Eliminar producto"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between mb-4">
                <span className="font-semibold">Total:</span>
                <span className="font-bold">${totalPrice.toLocaleString("es-AR")}</span>
              </div>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-2 transition-colors duration-200">
                Finalizar Compra
              </button>
              <button
                onClick={clearCart}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition-colors duration-200"
              >
                Vaciar Carrito
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CartSidebar
