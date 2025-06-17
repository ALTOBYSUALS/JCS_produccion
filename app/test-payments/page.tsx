"use client"

import { PAYMENT_CONFIG, getEfectivoInstructions, getTransferenciaInstructions } from '@/lib/payment-config';
import { Button } from '@/components/ui/button';

export default function TestPayments() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">🧪 Test de Instrucciones de Pago</h1>
      
      <div className="grid gap-6">
        {/* Efectivo */}
        <div className="border rounded-lg p-6 bg-green-50">
          <h2 className="text-xl font-bold mb-4 text-green-700">💵 Pago en Efectivo</h2>
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold mb-2">Confirmación en pantalla:</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{PAYMENT_CONFIG.confirmaciones.efectivo}</p>
          </div>
          <div className="bg-white p-4 rounded border mt-4">
            <h3 className="font-semibold mb-2">Instrucciones por email:</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-line">{getEfectivoInstructions("TEST-123")}</pre>
          </div>
          <div className="mt-4 p-3 bg-green-100 rounded">
            <strong>Datos del local:</strong>
            <ul className="mt-2 text-sm">
              <li>📍 {PAYMENT_CONFIG.local.direccion}</li>
              <li>🏢 {PAYMENT_CONFIG.local.referencia}</li>
              <li>⏰ {PAYMENT_CONFIG.local.horarios.semana}</li>
              <li>⏰ {PAYMENT_CONFIG.local.horarios.sabado}</li>
              <li>📞 {PAYMENT_CONFIG.local.telefono}</li>
            </ul>
          </div>
        </div>

        {/* Transferencia */}
        <div className="border rounded-lg p-6 bg-blue-50">
          <h2 className="text-xl font-bold mb-4 text-blue-700">🏦 Transferencia Bancaria</h2>
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold mb-2">Confirmación en pantalla:</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{PAYMENT_CONFIG.confirmaciones.transferencia}</p>
          </div>
          <div className="bg-white p-4 rounded border mt-4">
            <h3 className="font-semibold mb-2">Instrucciones por email:</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-line">{getTransferenciaInstructions(15000)}</pre>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <strong>Datos bancarios:</strong>
            <ul className="mt-2 text-sm font-mono">
              <li>🏦 {PAYMENT_CONFIG.transferencia.banco}</li>
              <li>💳 CBU: {PAYMENT_CONFIG.transferencia.cbu}</li>
              <li>🏷️ Alias: {PAYMENT_CONFIG.transferencia.alias}</li>
              <li>👤 {PAYMENT_CONFIG.transferencia.titular}</li>
              <li>🆔 CUIT: {PAYMENT_CONFIG.transferencia.cuit}</li>
              <li>📱 WhatsApp: {PAYMENT_CONFIG.transferencia.whatsappComprobante}</li>
            </ul>
          </div>
        </div>

        {/* MercadoPago */}
        <div className="border rounded-lg p-6 bg-yellow-50">
          <h2 className="text-xl font-bold mb-4 text-yellow-700">🔵 MercadoPago</h2>
          <div className="bg-white p-4 rounded border">
            <p className="text-sm text-gray-700">{PAYMENT_CONFIG.instrucciones.mercadopago}</p>
            <div className="mt-3 p-2 bg-yellow-100 rounded text-sm">
              ✅ Redirección automática a plataforma externa<br/>
              ✅ Pago seguro con tarjetas y otros métodos<br/>
              ✅ Confirmación automática vía webhook
            </div>
          </div>
        </div>

        {/* Tarjeta */}
        <div className="border rounded-lg p-6 bg-red-50">
          <h2 className="text-xl font-bold mb-4 text-red-700">💳 Tarjeta (Redirige a MP)</h2>
          <div className="bg-white p-4 rounded border">
            <p className="text-sm text-gray-700">{PAYMENT_CONFIG.instrucciones.tarjeta}</p>
            <div className="mt-3 p-2 bg-red-100 rounded text-sm">
              ⚠️ Actualmente muestra alerta para usar MercadoPago
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-4">
          Para modificar estos datos, edita el archivo: <code className="bg-gray-100 px-2 py-1 rounded">lib/payment-config.ts</code>
        </p>
        <Button onClick={() => window.location.href = "/"}>
          Volver a la tienda
        </Button>
      </div>
    </div>
  );
} 