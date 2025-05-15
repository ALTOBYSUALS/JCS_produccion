"use client"

import React, { useState, useEffect, useContext } from 'react';
import { useCart, CartProvider } from '../contexts/cart-context';
import { useProducts, ProductProvider } from '../contexts/product-context';

// Simple placeholder component that safely uses contexts
export default function AppWrapper() {
  // Use state to track if contexts are available
  const [cartContextAvailable, setCartContextAvailable] = useState(false);
  const [productContextAvailable, setProductContextAvailable] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Check if contexts are available - wrap in try/catch to handle errors safely
    try {
      const cart = useCart();
      if (cart) {
        setCartContextAvailable(true);
      }
    } catch (error) {
      console.error('Error accessing CartContext:', error);
    }
    
    try {
      const products = useProducts();
      if (products) {
        setProductContextAvailable(true);
      }
    } catch (error) {
      console.error('Error accessing ProductContext:', error);
    }
  }, []);
  
  // Show loading state while checking contexts
  if (!isClient) {
    return null;
  }
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">JCS El Guardián</h1>
      <p className="mb-4">Tienda virtual de neumáticos y llantas</p>
      
      <div className="p-4 bg-gray-100 rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">Estado de Contextos:</h2>
        <p>CartContext: {cartContextAvailable ? '✅ Disponible' : '❌ No disponible'}</p>
        <p>ProductContext: {productContextAvailable ? '✅ Disponible' : '❌ No disponible'}</p>
      </div>
      
      {!cartContextAvailable && (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
          <p className="font-semibold">Error: CartContext no está disponible</p>
          <p>Asegúrate de que el componente esté envuelto en un CartProvider.</p>
        </div>
      )}
      
      {!productContextAvailable && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          <p className="font-semibold">Error: ProductContext no está disponible</p>
          <p>Asegúrate de que el componente esté envuelto en un ProductProvider.</p>
        </div>
      )}
    </div>
  );
} 