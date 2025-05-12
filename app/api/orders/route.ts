import { NextResponse } from 'next/server';
import { createOrderInNotion, getAllOrders } from '@/lib/notion';
import { OrderDetails } from '@/components/types';

// Función para obtener pedidos de Notion
const getOrdersFromNotion = async () => {
  // Esta función debería obtener los pedidos desde Notion
  // Por ahora, devolvemos datos de ejemplo
  
  try {
    // Verificar si existe la variable de entorno
    const ordersDatabaseId = process.env.NOTION_DATABASE_ID_ORDERS;
    if (!ordersDatabaseId) {
      throw new Error("NOTION_DATABASE_ID_ORDERS no está definido en las variables de entorno");
    }
    
    // En una implementación real, aquí llamaríamos a la API de Notion
    // Por ahora, devolvemos datos de ejemplo
    return [
      {
        id: "ORD123456",
        fecha: "2023-05-12T15:30:00Z",
        cliente: "Juan Pérez",
        email: "juan@example.com",
        total: 45000,
        estado: "Pendiente de Pago",
        metodoPago: "Transferencia"
      },
      {
        id: "ORD789012",
        fecha: "2023-05-11T10:15:00Z",
        cliente: "María López",
        email: "maria@example.com",
        total: 28500,
        estado: "Pagado",
        metodoPago: "Mercado Pago"
      }
    ];
  } catch (error) {
    console.error("Error al obtener pedidos de Notion:", error);
    throw error;
  }
};

export async function GET() {
  try {
    // Obtener los pedidos usando la función de notion.ts
    const orders = await getAllOrders();
    
    return NextResponse.json(
      { orders },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en la API de pedidos (GET):', error);
    return NextResponse.json(
      { error: 'Error al obtener los pedidos' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Parsear el cuerpo de la solicitud
    const orderData: OrderDetails = await req.json();
    
    // Validar datos básicos requeridos
    if (!orderData.pedidoId || !orderData.cliente || !orderData.emailCliente) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos en el pedido' },
        { status: 400 }
      );
    }
    
    // Crear el pedido en Notion
    const result = await createOrderInNotion(orderData);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Error al crear el pedido en Notion' },
        { status: 500 }
      );
    }
    
    // Devolver respuesta exitosa con los datos del pedido creado
    return NextResponse.json(
      { 
        message: 'Pedido creado correctamente', 
        order: result 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error en la API de pedidos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 