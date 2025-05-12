"use client"

import { useState, useEffect } from "react"
import ProductCardMobile from "./product-card-mobile"
import { Button } from "@/components/ui/button"
import { Filter, ChevronDown, ChevronUp } from "lucide-react"

export default function ProductGridMobile({ products, onProductSelect, addToCart, categoryLabel }) {
  const [filteredProducts, setFilteredProducts] = useState(products)
  const [sortOption, setSortOption] = useState("default")
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 1000000])
  const [selectedRatings, setSelectedRatings] = useState([])

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

  const toggleRating = (rating) => {
    if (selectedRatings.includes(rating)) {
      setSelectedRatings(selectedRatings.filter((r) => r !== rating))
    } else {
      setSelectedRatings([...selectedRatings, rating])
    }
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 mb-4">
        <div className="flex justify-between items-center py-3 px-4">
          <h2 className="text-lg font-semibold">{categoryLabel}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              <span className="sr-only md:not-sr-only">Filtros</span>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="default">Ordenar</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="rating">Mejor valorados</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Rango de precio</h3>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  step="10000"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number.parseInt(e.target.value), priceRange[1]])}
                  className="w-full"
                />
                <span className="text-xs whitespace-nowrap">
                  ${priceRange[0].toLocaleString("es-AR")} - ${priceRange[1].toLocaleString("es-AR")}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Valoración</h3>
              <div className="flex flex-wrap gap-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => toggleRating(rating)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      selectedRatings.includes(rating)
                        ? "bg-red-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700"
                    }`}
                  >
                    {rating}
                    <Star className="h-3 w-3" />
                  </button>
                ))}
              </div>
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

function Star({ className }) {
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
