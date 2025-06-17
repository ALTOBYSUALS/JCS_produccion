// Configuración centralizada para métodos de pago y datos del local
export const PAYMENT_CONFIG = {
  // Datos del local para efectivo
  local: {
    nombre: "JCS El Guardián",
    direccion: "Av. Principal 123, Buenos Aires",
    referencia: "Frente al Shopping Center, Local 45",
    horarios: {
      semana: "Lunes a Viernes: 9:00 - 18:00",
      sabado: "Sábados: 9:00 - 13:00",
      domingo: "Cerrado"
    },
    telefono: "+54 11 1234-5678",
    whatsapp: "+54 11 1234-5678",
    email: "info@jcselguardian.com.ar"
  },

  // Datos bancarios para transferencias
  transferencia: {
    banco: "Banco Nación",
    cbu: "0110593030000123456789",
    alias: "JCS.GUARDIAN.PAGO",
    titular: "JCS El Guardián",
    cuit: "30-12345678-9",
    whatsappComprobante: "+54 11 1234-5678"
  },

  // Instrucciones específicas para cada método
  instrucciones: {
    efectivo: "🏪 Dirígete a nuestro local para abonar y retirar tu pedido. Llevá tu DNI y el número de pedido.",
    transferencia: "💳 Realizá la transferencia con los datos enviados por email. Enviá el comprobante por WhatsApp para acelerar la confirmación.",
    mercadopago: "🔵 Serás redirigido a MercadoPago para completar el pago de forma segura.",
    tarjeta: "💳 Para pagar con tarjeta, selecciona la opción MercadoPago donde podrás usar cualquier tarjeta de crédito o débito."
  },

  // Mensajes de confirmación detallados
  confirmaciones: {
    efectivo: `🏪 Dirígete a nuestro local en Av. Principal 123 (frente al Shopping Center, Local 45). 
               Horarios: Lun-Vie 9:00-18:00, Sáb 9:00-13:00. 
               Llevá tu DNI y este número de pedido. Tel: +54 11 1234-5678`,
    
    transferencia: `💳 Te hemos enviado por email los datos bancarios completos (CBU, Alias, CUIT). 
                    Revisá tu bandeja de entrada y spam. 
                    Enviá el comprobante por WhatsApp al +54 11 1234-5678 para acelerar la confirmación.`
  }
};

// Helper para generar instrucciones de efectivo
export const getEfectivoInstructions = (pedidoId: string) => {
  const { local } = PAYMENT_CONFIG;
  return `
    📍 ${local.direccion}
    🏢 ${local.referencia}
    ⏰ ${local.horarios.semana}
    ⏰ ${local.horarios.sabado}
    📞 ${local.telefono}
    
    📋 Llevá contigo:
    • Tu DNI
    • Número de pedido: ${pedidoId}
    • Este email como comprobante
  `;
};

// Helper para generar instrucciones de transferencia
export const getTransferenciaInstructions = (total: number) => {
  const { transferencia } = PAYMENT_CONFIG;
  return `
    🏦 ${transferencia.banco}
    💳 CBU: ${transferencia.cbu}
    🏷️ Alias: ${transferencia.alias}
    👤 Titular: ${transferencia.titular}
    🆔 CUIT: ${transferencia.cuit}
    💰 Importe: $${total.toLocaleString('es-AR')}
    
    📱 Enviá el comprobante por WhatsApp: ${transferencia.whatsappComprobante}
  `;
}; 