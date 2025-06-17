"use client"

import { PAYMENT_CONFIG } from '@/lib/payment-config';
import { Button } from '@/components/ui/button';

export default function TestEmailDesign() {
  const mockOrder = {
    pedidoId: "VQ37ZMLX",
    cliente: "Hugo Mendoza",
    emailCliente: "test@example.com",
    detalleProductosTexto: "1x 4 Tuercas De Rueda Cruze Tracker Onix Spin S10 Blazer, 6x 4 Tuercas De Rueda Cruze Tracker Onix Spin S10 Blazer",
    subtotal: 190400,
    costoEnvio: 0,
    totalPedido: 190400,
    metodoPago: "Efectivo al retirar",
    estadoPedido: "Pendiente de Pago",
    trackingUrl: "http://localhost:3000/rastreo?token=ABC123"
  };

  // Crear el HTML del email mejorado
  const getEmailHTML = () => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <!-- Header con logo -->
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 20px; text-align: center; position: relative;">
        <!-- Logo -->
        <div style="background-color: white; border-radius: 8px; padding: 10px; margin: 0 auto 20px; width: fit-content; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <svg width="160" height="48" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
            <circle cx="25" cy="30" r="18" fill="#dc2626"/>
            <text x="25" y="36" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">JCS</text>
            <text x="50" y="22" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1f2937">JCS El Guardián</text>
            <text x="50" y="38" font-family="Arial, sans-serif" font-size="10" fill="#6b7280">Neumáticos • Llantas • Servicios</text>
            <rect x="50" y="42" width="120" height="2" fill="#dc2626" rx="1"/>
          </svg>
        </div>
        <!-- Título principal -->
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">🎉 ¡Gracias por tu compra!</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Tu pedido ha sido recibido exitosamente</p>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hola <strong>${mockOrder.cliente}</strong>,</p>
        <p>Hemos recibido tu pedido #${mockOrder.pedidoId}.</p>
        
        <p>Podés seguir el estado de tu pedido en cualquier momento con el siguiente enlace:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${mockOrder.trackingUrl}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Ver estado de mi pedido</a>
        </div>
        
        <p style="font-size: 13px; color: #6b7280;">Este enlace es personal. No necesitás crear una cuenta para acceder.</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
        
        <h3 style="margin-top: 0; color: #1f2937;">Resumen de tu pedido:</h3>
        <p><strong>Productos:</strong><br>${mockOrder.detalleProductosTexto}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px 0;">Subtotal:</td>
            <td style="text-align: right; padding: 8px 0;">$${mockOrder.subtotal.toLocaleString('es-AR')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Costo de envío:</td>
            <td style="text-align: right; padding: 8px 0;">$${mockOrder.costoEnvio.toLocaleString('es-AR')}</td>
          </tr>
          <tr style="font-weight: bold; border-top: 1px solid #e5e7eb;">
            <td style="padding: 8px 0;">Total:</td>
            <td style="text-align: right; padding: 8px 0;">$${mockOrder.totalPedido.toLocaleString('es-AR')}</td>
          </tr>
        </table>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 20px;">
          <p style="margin-top: 0; font-weight: bold;">Método de pago: ${mockOrder.metodoPago}</p>
          <p style="margin-bottom: 0;">Estado: ${mockOrder.estadoPedido}</p>
        </div>
        
        <div style="background-color: #dcfce7; border: 2px solid #16a34a; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h3 style="margin-top: 0; color: #15803d; font-size: 18px;">🏪 Datos para retirar en efectivo:</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Dirección:</td>
              <td style="padding: 5px 0;">${PAYMENT_CONFIG.local.direccion}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Horarios:</td>
              <td style="padding: 5px 0;">${PAYMENT_CONFIG.local.horarios.semana}<br>${PAYMENT_CONFIG.local.horarios.sabado}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Teléfono:</td>
              <td style="padding: 5px 0;">${PAYMENT_CONFIG.local.telefono}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Referencia:</td>
              <td style="padding: 5px 0;">${PAYMENT_CONFIG.local.referencia}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">Total a pagar:</td>
              <td style="padding: 5px 0; font-size: 16px; font-weight: bold; color: #dc2626;">$${mockOrder.totalPedido.toLocaleString('es-AR')}</td>
            </tr>
          </table>
          <p style="margin-bottom: 0; color: #15803d; font-weight: bold;">💡 Presentá este email y tu DNI al retirar el pedido #${mockOrder.pedidoId}</p>
        </div>
      </div>
      
      <!-- Footer mejorado -->
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; text-align: center; border-top: 3px solid #dc2626;">
        <div style="margin-bottom: 15px;">
          <svg width="120" height="36" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.7;">
            <circle cx="25" cy="30" r="18" fill="#dc2626"/>
            <text x="25" y="36" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">JCS</text>
            <text x="50" y="22" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1f2937">JCS El Guardián</text>
            <text x="50" y="38" font-family="Arial, sans-serif" font-size="10" fill="#6b7280">Neumáticos • Llantas • Servicios</text>
          </svg>
        </div>
        <p style="margin: 0 0 10px; font-size: 13px; color: #64748b; font-weight: 500;">📧 Este email fue enviado desde JCS El Guardián</p>
        <p style="margin: 0 0 15px; font-size: 12px; color: #94a3b8;">📍 ${PAYMENT_CONFIG.local.direccion} | 📞 ${PAYMENT_CONFIG.local.telefono}</p>
        <div style="border-top: 1px solid #cbd5e1; padding-top: 15px; margin-top: 15px;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">© ${new Date().getFullYear()} JCS El Guardián. Todos los derechos reservados.</p>
          <p style="margin: 5px 0 0; font-size: 10px; color: #cbd5e1;">Especialistas en neumáticos, llantas y servicios automotrices</p>
        </div>
      </div>
    </div>
  `;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">📧 Previsualización Email Mejorado</h1>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Versión Anterior */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-600">📋 Versión Anterior (sin logo)</h2>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2">Email básico anterior:</div>
            <div className="text-xs space-y-1">
              ✅ Header rojo simple<br/>
              ✅ Información del pedido<br/>
              ✅ Botón de seguimiento<br/>
              ⚠️ Sin logo<br/>
              ⚠️ Diseño básico<br/>
              ⚠️ Footer simple
            </div>
          </div>
        </div>

        {/* Versión Mejorada */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-green-600">✨ Versión Mejorada (con logo)</h2>
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="text-sm text-green-600 mb-2">Nuevas mejoras:</div>
            <div className="text-xs space-y-1">
              ✨ Logo profesional en header<br/>
              ✨ Gradientes modernos<br/>
              ✨ Emojis para mejor UX<br/>
              ✨ Footer con información completa<br/>
              ✨ Diseño más profesional<br/>
              ✨ Información de contacto
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-center">📱 Vista previa del email mejorado:</h2>
        <div className="bg-gray-100 p-6 rounded-lg">
          <div 
            dangerouslySetInnerHTML={{ __html: getEmailHTML() }}
            className="mx-auto"
          />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-xl font-bold">🔧 Mejoras implementadas:</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-bold text-green-600 mb-2">🎨 Diseño Visual</h4>
            <ul className="text-sm space-y-1">
              <li>• Logo SVG embebido</li>
              <li>• Gradientes modernos</li>
              <li>• Sombras y bordes redondeados</li>
              <li>• Emojis para mejor comunicación</li>
              <li>• Colores de marca consistentes</li>
            </ul>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-bold text-blue-600 mb-2">📋 Información</h4>
            <ul className="text-sm space-y-1">
              <li>• Datos del local completos</li>
              <li>• Información de contacto</li>
              <li>• Instrucciones específicas por método</li>
              <li>• Footer profesional</li>
              <li>• Branding consistente</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-4">
          🧪 Para probar el email real, haz una compra de prueba en la tienda
        </p>
        <Button onClick={() => window.location.href = "/"}>
          Volver a la tienda
        </Button>
      </div>
    </div>
  );
} 