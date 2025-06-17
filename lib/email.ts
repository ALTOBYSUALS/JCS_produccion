import nodemailer from 'nodemailer';
import { OrderDetails } from '@/components/types';
import { PAYMENT_CONFIG } from './payment-config';

// Configurar transporter para desarrollo
// En producción, usar un servicio como SendGrid, Mailgun, etc.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'test@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password',
  },
});

/**
 * Envía un email de confirmación al cliente con detalles del pedido
 */
export const sendOrderConfirmationEmail = async (order: OrderDetails): Promise<boolean> => {
  if (!order.emailCliente || !order.trackingUrl) {
    console.error("Email o URL de seguimiento no proporcionados");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"JCS El Guardián" <${process.env.EMAIL_FROM || 'info@jcselguardian.com.ar'}>`,
      to: order.emailCliente,
      subject: `Confirmación de pedido #${order.pedidoId}`,
      html: `
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
            <p>Hola <strong>${order.cliente}</strong>,</p>
            <p>Hemos recibido tu pedido #${order.pedidoId}.</p>
            
            <p>Podés seguir el estado de tu pedido en cualquier momento con el siguiente enlace:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${order.trackingUrl}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Ver estado de mi pedido</a>
            </div>
            
            <p style="font-size: 13px; color: #6b7280;">Este enlace es personal. No necesitás crear una cuenta para acceder.</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
            
            <h3 style="margin-top: 0; color: #1f2937;">Resumen de tu pedido:</h3>
            <p><strong>Productos:</strong><br>${order.detalleProductosTexto}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px 0;">Subtotal:</td>
                <td style="text-align: right; padding: 8px 0;">$${order.subtotal.toLocaleString('es-AR')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">Costo de envío:</td>
                <td style="text-align: right; padding: 8px 0;">$${order.costoEnvio.toLocaleString('es-AR')}</td>
              </tr>
              <tr style="font-weight: bold; border-top: 1px solid #e5e7eb;">
                <td style="padding: 8px 0;">Total:</td>
                <td style="text-align: right; padding: 8px 0;">$${order.totalPedido.toLocaleString('es-AR')}</td>
              </tr>
            </table>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 20px;">
              <p style="margin-top: 0; font-weight: bold;">Método de pago: ${order.metodoPago}</p>
              <p style="margin-bottom: 0;">Estado: ${order.estadoPedido}</p>
            </div>
            
            ${order.metodoPago === 'Transferencia Bancaria' ? `
            <div style="background-color: #dbeafe; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <h3 style="margin-top: 0; color: #1e40af; font-size: 18px;">💳 Datos para transferencia:</h3>
              <table style="width: 100%; font-family: monospace; font-size: 14px;">
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">Banco:</td>
                  <td style="padding: 5px 0;">${PAYMENT_CONFIG.transferencia.banco}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">CBU:</td>
                  <td style="padding: 5px 0; background: #fff; padding: 8px; border-radius: 4px;">${PAYMENT_CONFIG.transferencia.cbu}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">Alias:</td>
                  <td style="padding: 5px 0; background: #fff; padding: 8px; border-radius: 4px;">${PAYMENT_CONFIG.transferencia.alias}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">Titular:</td>
                  <td style="padding: 5px 0;">${PAYMENT_CONFIG.transferencia.titular}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">CUIT:</td>
                  <td style="padding: 5px 0;">${PAYMENT_CONFIG.transferencia.cuit}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">Importe:</td>
                  <td style="padding: 5px 0; font-size: 16px; font-weight: bold; color: #dc2626;">$${order.totalPedido.toLocaleString('es-AR')}</td>
                </tr>
              </table>
              <p style="margin-bottom: 0; color: #1e40af; font-weight: bold;">⚠️ Importante: Enviá el comprobante de transferencia por WhatsApp al ${PAYMENT_CONFIG.transferencia.whatsappComprobante}</p>
            </div>
            ` : ''}
            
            ${order.metodoPago === 'Efectivo al retirar' ? `
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
                  <td style="padding: 5px 0; font-size: 16px; font-weight: bold; color: #dc2626;">$${order.totalPedido.toLocaleString('es-AR')}</td>
                </tr>
              </table>
              <p style="margin-bottom: 0; color: #15803d; font-weight: bold;">💡 Presentá este email y tu DNI al retirar el pedido #${order.pedidoId}</p>
            </div>
            ` : ''}
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
      `
    });
    
    console.log(`Email de confirmación enviado a ${order.emailCliente}`);
    return true;
  } catch (error) {
    console.error("Error al enviar email de confirmación:", error);
    return false;
  }
};

/**
 * Envía un email de actualización de estado del pedido 
 */
export const sendOrderStatusUpdateEmail = async (
  order: OrderDetails, 
  previousStatus: string, 
  newStatus: string
): Promise<boolean> => {
  if (!order.emailCliente || !order.trackingUrl) {
    console.error("Email o URL de seguimiento no proporcionados");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"JCS El Guardián" <${process.env.EMAIL_FROM || 'info@jcselguardian.com.ar'}>`,
      to: order.emailCliente,
      subject: `Actualización de tu pedido #${order.pedidoId}`,
      html: `
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
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">📦 Actualización de pedido</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Tu pedido ha sido actualizado</p>
          </div>
          
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Hola <strong>${order.cliente}</strong>,</p>
            <p>Tu pedido #${order.pedidoId} ha sido actualizado a: <strong>${newStatus}</strong></p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #4b5563;"><strong>Estado anterior:</strong> ${previousStatus}</p>
              <p style="margin: 8px 0 0; color: #dc2626; font-weight: bold;"><strong>Nuevo estado:</strong> ${newStatus}</p>
            </div>
            
            <p>Puedes seguir el estado completo de tu pedido con el siguiente enlace:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${order.trackingUrl}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Ver estado de mi pedido</a>
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
      `
    });
    
    console.log(`Email de actualización enviado a ${order.emailCliente}`);
    return true;
  } catch (error) {
    console.error("Error al enviar email de actualización:", error);
    return false;
  }
}; 