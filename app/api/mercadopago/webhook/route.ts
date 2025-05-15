import { NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/notion';
import { sendOrderStatusUpdateEmail } from '@/lib/email';

/**
 * Webhook para recibir notificaciones de Mercado Pago
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Log para depuración
    console.log('Webhook de Mercado Pago recibido:', JSON.stringify(data));
    
    // Verificar el tipo de notificación
    if (data.type !== 'payment' && data.action !== 'payment.created' && data.action !== 'payment.updated') {
      // Ignoramos notificaciones que no son de pagos
      return NextResponse.json({ message: 'Notificación recibida pero ignorada (no es un pago)' });
    }
    
    // Obtener información del pago
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN no está definido');
      return NextResponse.json({ error: 'Error de configuración' }, { status: 500 });
    }
    
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.data.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!paymentResponse.ok) {
      console.error('Error al obtener información del pago:', await paymentResponse.text());
      return NextResponse.json({ error: 'Error al obtener información del pago' }, { status: 500 });
    }
    
    const payment = await paymentResponse.json();
    
    // Obtener la referencia externa que contiene el ID del pedido
    const orderId = payment.external_reference;
    if (!orderId) {
      console.error('Pago sin referencia al pedido');
      return NextResponse.json({ error: 'Pago sin referencia al pedido' }, { status: 400 });
    }
    
    // Obtener el pedido de Notion
    const order = await getOrderById(orderId);
    if (!order) {
      console.error(`Pedido ${orderId} no encontrado`);
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }
    
    // Verificar el estado del pago y actualizar el pedido
    let newStatus;
    let statusNote = '';
    
    switch (payment.status) {
      case 'approved':
        newStatus = 'Pagado';
        statusNote = `Pago aprobado en Mercado Pago. ID: ${payment.id}`;
        break;
      case 'pending':
        newStatus = 'Pendiente de Pago';
        statusNote = `Pago pendiente en Mercado Pago. ID: ${payment.id}`;
        break;
      case 'in_process':
        newStatus = 'Pendiente de Pago';
        statusNote = `Pago en proceso en Mercado Pago. ID: ${payment.id}`;
        break;
      case 'rejected':
        newStatus = 'Pago Rechazado';
        statusNote = `Pago rechazado en Mercado Pago. ID: ${payment.id}. Motivo: ${payment.status_detail}`;
        break;
      default:
        newStatus = 'Pendiente de Pago';
        statusNote = `Estado de pago en Mercado Pago: ${payment.status}. ID: ${payment.id}`;
    }
    
    // Si el estado actual es diferente al nuevo, actualizar
    if (order.estadoPedido !== newStatus) {
      const previousStatus = order.estadoPedido;
      
      // Actualizar estado en Notion
      const updatedOrder = await updateOrderStatus(orderId, newStatus, statusNote);
      
      if (!updatedOrder) {
        console.error(`Error al actualizar el pedido ${orderId}`);
        return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 });
      }
      
      // Enviar email de actualización
      try {
        if (updatedOrder.emailCliente && updatedOrder.trackingUrl) {
          await sendOrderStatusUpdateEmail(updatedOrder, previousStatus, newStatus);
          console.log(`Email de actualización enviado a ${updatedOrder.emailCliente}`);
        }
      } catch (emailError) {
        console.error('Error al enviar email de actualización:', emailError);
        // Continuamos a pesar del error en el email
      }
      
      return NextResponse.json({ 
        message: 'Estado del pedido actualizado', 
        orderId,
        previousStatus,
        newStatus
      });
    }
    
    // Si el estado no cambió
    return NextResponse.json({ 
      message: 'Notificación procesada, sin cambios en el estado', 
      orderId,
      status: order.estadoPedido
    });
    
  } catch (error) {
    console.error('Error al procesar webhook de Mercado Pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 