import nodemailer from 'nodemailer';
import { OrderDetails } from '@/components/types';

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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">¡Gracias por tu compra!</h1>
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
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>Este email fue enviado desde JCS El Guardián.</p>
            <p>© ${new Date().getFullYear()} JCS El Guardián. Todos los derechos reservados.</p>
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Actualización de pedido</h1>
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
          
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>Este email fue enviado desde JCS El Guardián.</p>
            <p>© ${new Date().getFullYear()} JCS El Guardián. Todos los derechos reservados.</p>
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