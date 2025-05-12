"use client"

import { useState } from "react"
import { Menu, X, ShoppingCart, User, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MobileNavigation({ 
  setView, 
  totalItems, 
  toggleCart 
}: { 
  setView: (view: string) => void;
  totalItems: number;
  toggleCart: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { label: "Inicio", view: "storefront" },
    { label: "Neumáticos", view: "neumaticos" },
    { label: "Llantas", view: "llantas" },
    { label: "Accesorios", view: "accesorios" },
    { label: "Servicios", view: "servicios" },
    { label: "Contacto", view: "contacto" },
    { label: "Marcas", view: "shopByBrand" },
  ]

  const handleNavigation = (view: string) => {
    setView(view)
    setIsMenuOpen(false)
  }

  return (
    <div className="lg:hidden">
      {/* Barra de navegación móvil */}
      <div className="flex justify-between items-center w-full h-16 px-4 border-b border-gray-100 bg-white">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>

        <div
          className="cursor-pointer"
          onClick={() => handleNavigation("storefront")}
        >
          <img 
            src="https://res.cloudinary.com/dt5pkdr0k/image/upload/v1745035390/image_1_yd8doa.png" 
            alt="Logo JCS El Guardián" 
            className="h-8 w-auto" 
          />
        </div>

          <button
            onClick={toggleCart}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
            aria-label="Ver carrito"
          >
          <ShoppingCart className="h-6 w-6 text-gray-700" />
            {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {totalItems}
              </span>
            )}
          </button>
      </div>

      {/* Overlay del menú móvil */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Panel lateral del menú móvil */}
      <div
        className={`fixed top-0 left-0 h-full w-4/5 max-w-xs bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col shadow-xl`}
      >
        {/* Cabecera del menú */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div className="cursor-pointer" onClick={() => handleNavigation("storefront")}>
            <img 
              src="https://res.cloudinary.com/dt5pkdr0k/image/upload/v1745035390/image_1_yd8doa.png" 
              alt="Logo JCS El Guardián" 
              className="h-8 w-auto" 
            />
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Contenido del menú */}
        <div className="flex-1 overflow-y-auto">
          <nav className="py-2">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavigation(item.view)}
                className="flex items-center w-full px-6 py-3.5 text-left text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors font-medium text-sm uppercase tracking-wide"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="border-t border-gray-100 mt-2 pt-4 px-6 space-y-4">
            <button
              onClick={() => handleNavigation("adminLogin")}
              className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors py-2"
            >
              <User className="h-5 w-5" />
              <span className="text-sm">Acceso Admin</span>
            </button>

            <a
              href="tel:+123456789"
              className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors py-2"
            >
              <Phone className="h-5 w-5" />
              <span className="text-sm">Llamar ahora</span>
            </a>
          </div>
        </div>

        {/* Pie del menú */}
        <div className="p-4 border-t border-gray-100">
          <Button
            onClick={() => {
              setIsMenuOpen(false)
              toggleCart()
            }}
            className="w-full"
          >
            Ver Carrito {totalItems > 0 && `(${totalItems})`}
          </Button>
        </div>
      </div>
    </div>
  )
}
