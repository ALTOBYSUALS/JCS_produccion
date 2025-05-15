'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function TestMercadoPago() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const testIntegration = async () => {
    try {
      setStatus('loading');
      setResult(null);
      setErrorMessage(null);
      
      // 1. Probar que el SDK de Mercado Pago esté cargado
      const sdkLoaded = typeof window !== 'undefined' && !!(window as any).MercadoPago;
      console.log("SDK de Mercado Pago cargado:", sdkLoaded);
      
      if (!sdkLoaded) {
        throw new Error("El SDK de Mercado Pago no está cargado. Verifica el script en layout.tsx");
      }
      
      // 2. Probar el endpoint de /api/mercadopago con una preferencia de prueba
      const testPreference = {
        items: [{
          id: "test-item",
          title: "Producto de prueba",
          description: "Prueba de integración con Mercado Pago",
          picture_url: "https://placehold.co/100",
          quantity: 1,
          unit_price: 100,
          currency_id: 'ARS'
        }],
        payer: {
          name: "Usuario de prueba",
          email: "test@example.com",
          phone: { area_code: "", number: "1234567890" },
          address: { street_name: "Calle de prueba 123", zip_code: "1234" }
        },
        back_url: {
          success: `${window.location.origin}/confirmacion?status=success`,
          failure: `${window.location.origin}/confirmacion?status=failure`,
          pending: `${window.location.origin}/confirmacion?status=pending`,
        },
        externalReference: `TEST-${Date.now()}`
      };
      
      console.log("Enviando solicitud de prueba a /api/mercadopago:", testPreference);
      
      const response = await fetch("/api/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPreference)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("Error en la respuesta:", responseData);
        throw new Error(responseData.error || `Error ${response.status} al probar la API de Mercado Pago`);
      }
      
      console.log("Respuesta exitosa de /api/mercadopago:", responseData);
      
      if (!responseData.initPoint) {
        throw new Error("La respuesta no incluye initPoint");
      }
      
      setResult({
        success: true,
        preferenceId: responseData.preferenceId,
        initPoint: responseData.initPoint
      });
      
      setStatus('success');
    } catch (error) {
      console.error("Error al probar la integración:", error);
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
      setStatus('error');
    }
  };
  
  // Detectar si el SDK de Mercado Pago está cargado
  useEffect(() => {
    const sdkLoaded = typeof window !== 'undefined' && !!(window as any).MercadoPago;
    console.log("SDK de Mercado Pago detectado:", sdkLoaded);
  }, []);
  
  return (
    <div className="p-6 border rounded-lg bg-white">
      <h3 className="text-xl font-semibold mb-4">Prueba de integración con Mercado Pago</h3>
      
      <div className="mb-4">
        <Button 
          onClick={testIntegration}
          disabled={status === 'loading'}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {status === 'loading' ? 'Probando...' : 'Probar integración'}
        </Button>
      </div>
      
      {status === 'loading' && (
        <p className="text-blue-600">Probando la integración con Mercado Pago...</p>
      )}
      
      {status === 'success' && result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700 font-semibold">✅ Integración exitosa!</p>
          <div className="mt-2 text-sm">
            <p><span className="font-semibold">Preference ID:</span> {result.preferenceId}</p>
            <p className="mt-1">
              <span className="font-semibold">Init Point:</span> 
              <a href={result.initPoint} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline truncate block">
                {result.initPoint}
              </a>
            </p>
          </div>
          
          <div className="mt-4">
            <Button 
              onClick={() => window.open(result.initPoint, '_blank')}
              className="bg-green-600 hover:bg-green-700"
            >
              Abrir checkout de prueba
            </Button>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 font-semibold">❌ Error en la integración</p>
          {errorMessage && (
            <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
          )}
          <p className="mt-2 text-sm">
            Verifica las variables de entorno MERCADO_PAGO_ACCESS_TOKEN y NEXT_PUBLIC_SITE_URL.
          </p>
        </div>
      )}
    </div>
  );
} 