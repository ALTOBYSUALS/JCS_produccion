'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Componente que contiene la lógica y el JSX de la página de rastreo
function RastreoContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!token) {
      setError('Token de seguimiento no proporcionado. Verifique el enlace recibido por correo.');
      setLoading(false);
      return;
    }
    
    const fetchOrderStatus = async () => {
      try {
        const response = await fetch(`/api/tracking?token=${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al obtener el estado del pedido');
        }
        
        const data = await response.json();
        setOrderStatus(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderStatus();
    
    // Polling cada 30 segundos para actualizaciones automáticas
    const intervalId = setInterval(fetchOrderStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, [token]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4"></div>
        <p className="text-gray-600">Cargando estado del pedido...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg font-semibold mb-2 text-red-700">Error al obtener información</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Link href="/" className="text-red-600 underline text-sm hover:text-red-800">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }
  
  if (!orderStatus) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">No se pudo cargar la información del pedido.</p>
      </div>
    );
  }
  
  // Estados posibles del pedido
  const steps = [
    'Pendiente de Pago',
    'Pagado',
    'Preparando Envío',
    'Enviado',
    'Entregado'
  ];
  
  const currentStepIndex = steps.indexOf(orderStatus.estadoPedido);
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">Seguimiento de Pedido #{orderStatus.pedidoId}</h1>
        <p className="text-center text-gray-500 mb-8">
          Fecha: {orderStatus.fechaCreacion ? new Date(orderStatus.fechaCreacion).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Fecha no disponible'}
        </p>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Cabecera */}
          <div className="bg-red-600 text-white p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Estado del pedido</h2>
              <span className="px-3 py-1 bg-white text-red-600 rounded-full text-xs font-bold">{orderStatus.estadoPedido}</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="p-6">
            <div className="mb-10">
              <div className="relative">
                <div className="overflow-hidden h-2 mb-6 text-xs flex bg-gray-200 rounded">
                  <div 
                    style={{ width: `${Math.max(5, (currentStepIndex + 1) * 100 / steps.length)}%` }} 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-600 transition-all duration-500">
                  </div>
                </div>
                <div className="flex justify-between">
                  {steps.map((step, index) => (
                    <div key={index} className={`flex flex-col items-center ${index <= currentStepIndex ? 'text-red-600' : 'text-gray-400'}`}>
                      <div className={`rounded-full h-6 w-6 flex items-center justify-center border-2 ${index <= currentStepIndex ? 'border-red-600 bg-red-600 text-white' : 'border-gray-300'}`}>
                        {index < currentStepIndex ? '✓' : index === currentStepIndex ? '●' : '○'}
                      </div>
                      <span className="text-xs mt-1 text-center">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Estado actual */}
            <div className="my-6 p-4 bg-red-50 border border-red-100 rounded-md">
              <h3 className="font-semibold mb-1">Estado actual:</h3>
              <p className="text-lg font-bold text-red-600">{orderStatus.estadoPedido}</p>
              {orderStatus.detalleEnvio?.codigo && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Empresa de envío:</span> {orderStatus.detalleEnvio.empresa}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Código de seguimiento:</span> {orderStatus.detalleEnvio.codigo}
                  </p>
                </div>
              )}
            </div>
            
            {/* Historial */}
            {orderStatus.estadoHistorial && orderStatus.estadoHistorial.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Historial del pedido:</h3>
                <div className="space-y-3">
                  {orderStatus.estadoHistorial.map((entry: any, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="mr-3 h-full">
                        <div className="h-2 w-2 rounded-full bg-red-600 mt-1"></div>
                      </div>
                      <div>
                        <p className="font-medium">{entry.estado}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.fecha).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {entry.notas && <p className="text-sm mt-1">{entry.notas}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Botón volver a la tienda */}
            <div className="mt-8 text-center">
              <Link href="/" className="inline-block px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors duration-200 text-sm">
                Volver a la tienda
              </Link>
            </div>
          </div>
        </div>
        
        {/* Mensaje de actualización automática */}
        <p className="text-xs text-center text-gray-500 mt-4">
          Esta página se actualiza automáticamente cada 30 segundos.
        </p>
      </div>
    </div>
  );
}

// Componente exportado por defecto que envuelve RastreoContent con Suspense
export default function TrackingPage() {
  return (
    <Suspense fallback={<div>Cargando seguimiento...</div>}>
      <RastreoContent />
    </Suspense>
  );
} 