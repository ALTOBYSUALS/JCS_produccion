import { NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/notion';
import { sendOrderStatusUpdateEmail } from '@/lib/email';

/**
 * Endpoint para actualizar el estado de un pedido y enviar notificación por email
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, newStatus, notes } = body;
    
    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: 'ID de pedido y nuevo estado requeridos' },
        { status: 400 }
      );
    }
    
    // Obtener estado actual del pedido
    const currentOrder = await getOrderById(orderId);
    
    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // Actualizar estado del pedido
    const previousStatus = currentOrder.estadoPedido;
    const updatedOrder = await updateOrderStatus(orderId, newStatus, notes);
    
    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Error al actualizar el estado del pedido' },
        { status: 500 }
      );
    }
    
    // Si el estado cambió, enviar notificación por email
    if (previousStatus !== newStatus && updatedOrder.emailCliente && updatedOrder.trackingUrl) {
      try {
        await sendOrderStatusUpdateEmail(updatedOrder, previousStatus, newStatus);
      } catch (emailError) {
        console.error('Error al enviar notificación de estado por email:', emailError);
        // Continuar a pesar del error en el email
      }
    }
    
    return NextResponse.json(
      { 
        message: 'Estado del pedido actualizado correctamente',
        order: updatedOrder
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error al procesar la solicitud de actualización de estado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 