import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { getOrderById } from '@/lib/notion';

/**
 * Endpoint para enviar email de confirmación de pedido
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'ID del pedido requerido' },
        { status: 400 }
      );
    }
    
    // Obtener información del pedido
    const order = await getOrderById(orderId);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar que el pedido tenga token de seguimiento
    if (!order.trackingToken || !order.trackingUrl) {
      return NextResponse.json(
        { error: 'El pedido no tiene información de seguimiento' },
        { status: 400 }
      );
    }
    
    // Enviar email de confirmación
    const emailSent = await sendOrderConfirmationEmail(order);
    
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Error al enviar el email de confirmación' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Email de confirmación enviado correctamente' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error al procesar la solicitud de email:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 