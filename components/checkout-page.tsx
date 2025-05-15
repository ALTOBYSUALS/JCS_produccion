"use client"

import { useState, useEffect, FormEvent } from "react"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { CheckoutForm } from "@/components/checkout-form"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react'

interface CheckoutPageProps {
  setView: (view: string) => void;
}

export default function CheckoutPage({ setView }: CheckoutPageProps) {
  const { cartItems, totalPrice } = useCart();
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia" | "mercadopago" | "tarjeta">("tarjeta");
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
    needInvoice: false,
    taxData: {
      documentType: "DNI",
      document: "",
      invoiceType: "B",
      businessName: ""
    }
  });
  
  // Si no hay productos en el carrito, redirigir a la tienda
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center p-8 bg-white rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-6">Agrega productos a tu carrito antes de proceder al pago.</p>
          <Button onClick={() => setView("storefront")}>
            Volver a la tienda
          </Button>
        </div>
      </div>
    );
  }
  
  // Inicializar Mercado Pago
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
    console.log("CheckoutPage - Mercado Pago Public Key:", publicKey);
    
    if (publicKey) {
      try {
        initMercadoPago(publicKey, { locale: 'es-AR' });
        console.log("Mercado Pago inicializado correctamente en CheckoutPage");
      } catch (error) {
        console.error("Error al inicializar Mercado Pago en CheckoutPage:", error);
        
        // Intentar sin opciones como fallback
        try {
          initMercadoPago(publicKey);
          console.log("Mercado Pago inicializado con método fallback");
        } catch (fallbackError) {
          console.error("Fallo total al inicializar Mercado Pago:", fallbackError);
        }
      }
    } else {
      console.error("NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY is not defined in CheckoutPage");
    }
  }, []);

  const handlePaymentMethodChange = (method: "efectivo" | "transferencia" | "mercadopago" | "tarjeta") => {
    console.log("CheckoutPage - Cambiando método de pago a:", method);
    setPaymentMethod(method);
  };
  
  const onCardTokenReceived = (data: any) => {
    console.log("Card token received:", data);
    setCardToken(data.token);
  };
  
  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center text-gray-600 hover:text-gray-900"
          onClick={() => setView("cart")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al carrito
        </Button>
        
        <h1 className="text-2xl font-bold text-center flex-1">Finalizar compra</h1>
        
        <div className="md:hidden">
          <Button 
            variant="outline" 
            className="relative"
            onClick={() => setShowMobileCart(!showMobileCart)}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cartItems.length}
            </span>
          </Button>
        </div>
      </div>
      
      {/* Carrito móvil desplegable */}
      {showMobileCart && (
        <div className="md:hidden bg-white rounded-lg border mb-6 p-4">
          <h3 className="font-semibold mb-3">Resumen del pedido ({cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'})</h3>
          
          <div className="space-y-4 max-h-60 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={`${item.id}-${item.name}`} className="flex items-center border-b pb-2">
                <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                  <img 
                    src={item.imageUrl || "https://placehold.co/100?text=No+Image"} 
                    alt={item.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm line-clamp-1">{item.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">{item.quantity}x ${item.price.toLocaleString('es-AR')}</span>
                    <span className="text-sm font-medium">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-2 border-t">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${totalPrice.toLocaleString('es-AR')}</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full mt-3"
            onClick={() => setShowMobileCart(false)}
          >
            Continuar con el pago
          </Button>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Formulario de checkout */}
        <div className="flex-grow order-2 md:order-1">
          <CheckoutForm 
            paymentMethod={paymentMethod}
            setPaymentMethod={handlePaymentMethodChange}
            onCardTokenReceived={onCardTokenReceived}
            cardToken={cardToken}
            setView={setView}
            formData={formData}
          />
        </div>
        
        {/* Resumen del carrito (escritorio) */}
        <div className="w-full md:w-80 order-1 md:order-2">
          <div className="bg-white rounded-lg border p-4 md:p-6 sticky top-4">
            <h3 className="font-semibold mb-4">Resumen del pedido</h3>
            
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.name}`} className="flex border-b pb-3">
                  <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    <img 
                      src={item.imageUrl || "https://placehold.co/100?text=No+Image"} 
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm line-clamp-2">{item.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">{item.quantity} x ${item.price.toLocaleString('es-AR')}</span>
                      <span className="text-sm font-medium">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Subtotal</span>
                <span className="font-medium">${totalPrice.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Envío</span>
                <span className="font-medium">$2,500</span>
              </div>
              <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                <span>Total</span>
                <span>${(totalPrice + 2500).toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 