import { NextResponse } from 'next/server';
import { getOrderByTrackingToken } from '@/lib/notion';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json(
      { error: 'Token de seguimiento requerido' },
      { status: 400 }
    );
  }
  
  try {
    const order = await getOrderByTrackingToken(token);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // Manejo seguro de fechas
    let fechaFormateada = '';
    try {
      // Verificar si la fecha es válida
      const fecha = new Date(order.fechaPedido);
      if (!isNaN(fecha.getTime())) {
        fechaFormateada = fecha.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } else {
        fechaFormateada = 'Fecha no disponible';
      }
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      fechaFormateada = 'Fecha no disponible';
    }
    
    // Devolver solo la información necesaria para el seguimiento
    return NextResponse.json({
      pedidoId: order.pedidoId,
      estadoPedido: order.estadoPedido,
      fechaPedido: order.fechaPedido,
      estadoHistorial: order.estadoHistorial || [],
      detalleEnvio: {
        empresa: order.empresaEnvio || 'No especificada',
        codigo: order.codigoSeguimiento || '',
      },
      fechaCreacion: fechaFormateada
    });
    
  } catch (error) {
    console.error('Error al consultar el estado del pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 