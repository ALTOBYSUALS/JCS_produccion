"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ShoppingCart, Info } from "lucide-react"

export default function ProductCardMobile({ product, onProductSelect, addToCart }) {
  const isService = product.price === 0

  const handleViewDetails = () => {
    onProductSelect(product)
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    if (!isService) {
      addToCart(product)
    } else {
      handleViewDetails()
    }
  }

  return (
    <Card
      className="flex flex-col border border-gray-200 hover:shadow-md transition-all duration-300 ease-in-out w-full"
      onClick={handleViewDetails}
    >
      <div className="relative">
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.imageUrl || "/placeholder.svg"}
            alt={`Imagen de ${product.name}`}
            className="w-full h-full object-contain p-2 transition-transform duration-300 ease-in-out"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "https://placehold.co/600x400/cccccc/ffffff?text=Imagen+no+disponible"
            }}
          />
        </div>
        {product.discount && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            {product.discount}
          </div>
        )}
      </div>

      <CardContent className="flex-grow flex flex-col justify-between p-3">
        <div>
          <h3 className="text-sm font-semibold mb-1 line-clamp-2">{product.name}</h3>

          {product.rating > 0 && (
            <div className="flex items-center mb-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= Math.round(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 ml-1">({product.reviewCount || 0})</span>
            </div>
          )}

          {product.shipping && <div className="text-xs text-green-600 font-medium mb-1">{product.shipping}</div>}
        </div>

        <div className="flex justify-between items-center mt-2">
          <div>
            <span className={`text-base font-medium ${isService ? "text-red-600" : "text-gray-900"}`}>
              {isService ? "Consultar" : `$${product.price.toLocaleString("es-AR")}`}
            </span>
            {product.installments && <div className="text-xs text-gray-500">{product.installments}</div>}
          </div>

          <Button
            size="sm"
            variant={isService ? "outline" : "default"}
            onClick={handleAddToCart}
            disabled={isService}
            className="h-8 w-8 p-0 rounded-full"
          >
            {isService ? <Info className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
