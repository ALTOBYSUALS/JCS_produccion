import React from 'react';

export function MercadoPagoLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-red-600 border-solid border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-2xl font-bold mb-2 text-red-700" style={{ fontFamily: "var(--font-uncial-antiqua)" }}>
        Cargando Mercado Pago
      </h2>
      <p className="text-gray-600 text-center max-w-md">
        Estamos preparando tu pago, por favor espera unos segundos.
      </p>
      <div className="mt-8 flex items-center space-x-2">
        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse delay-150"></div>
        <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse delay-300"></div>
      </div>
    </div>
  );
} 