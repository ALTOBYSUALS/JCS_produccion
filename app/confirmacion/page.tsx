"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export default function ConfirmacionPage() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const [orderInfo, setOrderInfo] = useState<any>(null)
  
  useEffect(() => {
    // Aquí podrías obtener información adicional del pedido si lo necesitas
    const paymentId = searchParams.get('payment_id')
    const orderId = searchParams.get('external_reference')
    
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => {
          if (data.order) {
            setOrderInfo(data.order)
          }
        })
        .catch(err => console.error("Error al obtener información del pedido:", err))
    }
  }, [searchParams])

  let statusIcon = <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
  let statusTitle = "Pago pendiente"
  let statusDescription = "Tu pago está siendo procesado."
  let statusClass = "bg-yellow-50 border-yellow-200"
  
  if (status === 'success') {
    statusIcon = <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
    statusTitle = "¡Pago completado con éxito!"
    statusDescription = "Tu pedido ha sido confirmado y está siendo procesado."
    statusClass = "bg-green-50 border-green-200"
  } else if (status === 'failure') {
    statusIcon = <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
    statusTitle = "Error en el pago"
    statusDescription = "Hubo un problema con tu pago. Por favor, intenta nuevamente."
    statusClass = "bg-red-50 border-red-200"
  }
  
  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <div className={`rounded-lg border p-8 ${statusClass} text-center`}>
        {statusIcon}
        <h1 className="text-2xl font-bold mb-2">{statusTitle}</h1>
        <p className="text-gray-600 mb-6">{statusDescription}</p>
        
        {orderInfo && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Número de pedido: <span className="font-semibold">{orderInfo.pedidoId}</span></p>
            {orderInfo.trackingUrl && (
              <a 
                href={orderInfo.trackingUrl}
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver estado de mi pedido
              </a>
            )}
          </div>
        )}
        
        <div className="flex justify-center">
          <Button onClick={() => window.location.href = "/"}>
            Volver a la tienda
          </Button>
        </div>
      </div>
    </div>
  )
} 