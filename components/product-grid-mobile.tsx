"use client"

import { useState, useEffect } from "react"
import ProductCardMobile from "./product-card-mobile"
import { Button } from "@/components/ui/button"
import { Filter, ChevronDown, ChevronUp } from "lucide-react"

interface Product {
  id: string | number;
  name: string;
  price: number;
  rating?: number;
  [key: string]: any;
}

interface ProductGridMobileProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  addToCart: (product: Product) => void;
  categoryLabel: string;
}

export default function ProductGridMobile({ products, onProductSelect, addToCart, categoryLabel }: ProductGridMobileProps) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  const [sortOption, setSortOption] = useState<string>("default")
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000])
  const [selectedRatings, setSelectedRatings] = useState<number[]>([])

  useEffect(() => {
    let result = [...products]

    // Apply price filter
    result = result.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1])

    // Apply rating filter
    if (selectedRatings.length > 0) {
      result = result.filter((product) => {
        const rating = Math.round(product.rating || 0)
        return selectedRatings.includes(rating)
      })
    }

    // Apply sorting
    if (sortOption === "price-asc") {
      result.sort((a, b) => a.price - b.price)
    } else if (sortOption === "price-desc") {
      result.sort((a, b) => b.price - a.price)
    } else if (sortOption === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }

    setFilteredProducts(result)
  }, [products, sortOption, priceRange, selectedRatings])

  const toggleRating = (rating: number) => {
    if (selectedRatings.includes(rating)) {
      setSelectedRatings(selectedRatings.filter((r) => r !== rating))
    } else {
      setSelectedRatings([...selectedRatings, rating])
    }
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 z-20 bg-gradient-to-r from-red-600 to-red-700 shadow-lg mb-4">
        <div className="flex justify-between items-center py-4 px-4">
          <div>
            <h2 className="text-lg font-bold text-white">{categoryLabel}</h2>
            <p className="text-red-100 text-xs">{filteredProducts.length} productos</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                showFilters 
                  ? 'bg-white text-red-600 shadow-md' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="text-sm bg-white/20 text-white border border-white/30 rounded-xl px-3 py-2 backdrop-blur-sm focus:bg-white focus:text-red-600 transition-all duration-200"
            >
              <option value="default" className="text-gray-800">Ordenar por</option>
              <option value="price-asc" className="text-gray-800">Menor precio</option>
              <option value="price-desc" className="text-gray-800">Mayor precio</option>
              <option value="rating" className="text-gray-800">Mejor valorados</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white border-t border-red-200 mx-4 mb-4 rounded-xl shadow-lg overflow-hidden">
            {/* Header de filtros */}
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 border-b border-red-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
                  <Filter className="h-3 w-3 text-white" />
                </div>
                <h3 className="font-semibold text-red-800">Filtros Avanzados</h3>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Filtro de precio mejorado */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-800">Rango de Precio</h4>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Desde</span>
                    <span className="text-sm font-medium text-gray-600">Hasta</span>
                  </div>
                  
                  <div className="relative mb-4">
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="10000"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number.parseInt(e.target.value), priceRange[1]])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="10000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb absolute top-0"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                      <span className="text-sm font-bold text-green-600">
                        ${priceRange[0].toLocaleString("es-AR")}
                      </span>
                    </div>
                    <div className="w-4 h-0.5 bg-gray-300"></div>
                    <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                      <span className="text-sm font-bold text-green-600">
                        ${priceRange[1].toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtro de valoración mejorado */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="h-3 w-3 text-yellow-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Valoración</h4>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => toggleRating(rating)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                        selectedRatings.includes(rating)
                          ? "bg-yellow-500 border-yellow-500 text-white shadow-lg transform scale-105"
                          : "bg-white border-gray-200 text-gray-700 hover:border-yellow-400 hover:bg-yellow-50"
                      }`}
                    >
                      <Star className="h-4 w-4" />
                      <span className="text-xs font-bold">{rating}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón para limpiar filtros */}
              {(selectedRatings.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000000) && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedRatings([]);
                      setPriceRange([0, 1000000]);
                    }}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 px-3">
        {filteredProducts.length === 0 ? (
          <div className="col-span-2 py-8 text-center text-gray-500">
            No se encontraron productos con los filtros seleccionados.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCardMobile
              key={product.id}
              product={product}
              onProductSelect={onProductSelect}
              addToCart={addToCart}
            />
          ))
        )}
      </div>
    </div>
  )
}

function Star({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
