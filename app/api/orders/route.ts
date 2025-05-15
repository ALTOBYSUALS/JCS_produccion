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
    
    console.log(`API Orders - Creando pedido: ${orderData.pedidoId} (Cliente: ${orderData.cliente})`);
    console.log(`API Orders - Datos del pedido: ${JSON.stringify({
      ...orderData,
      // Omitir datos sensibles o extensos
      notasAdicionales: orderData.notasAdicionales ? 'presente' : 'no presente',
      estadoHistorial: orderData.estadoHistorial ? `${orderData.estadoHistorial.length} registros` : 'no presente'
    })}`);
    
    // Crear el pedido en Notion
    try {
      const result = await createOrderInNotion(orderData);
      
      if (!result) {
        console.error('API Orders - Error al crear pedido en Notion: resultado nulo');
        return NextResponse.json(
          { error: 'Error al crear el pedido en Notion: no se pudo crear la entrada' },
          { status: 500 }
        );
      }
      
      console.log(`API Orders - Pedido creado exitosamente en Notion: ${result.id}`);
      
      // Devolver respuesta exitosa con los datos del pedido creado
      return NextResponse.json(
        { 
          message: 'Pedido creado correctamente', 
          order: result 
        },
        { status: 201 }
      );
    } catch (notionError) {
      console.error('API Orders - Error específico al crear en Notion:', notionError);
      
      // Proporcionar un mensaje de error más descriptivo
      let errorMessage = 'Error al crear el pedido en Notion';
      if (notionError instanceof Error) {
        errorMessage += `: ${notionError.message}`;
        
        // Detectar errores específicos de campos faltantes
        if (notionError.message.includes('cliente') || notionError.message.includes('clientes')) {
          errorMessage = 'Error al crear el pedido en Notion: campo cliente/clientes faltante o inválido';
          console.error('API Orders - Error: problema con campo cliente/clientes. Verificar la estructura de la base de datos.');
        } else if (notionError.message.includes('property') || notionError.message.includes('properties')) {
          errorMessage = 'Error al crear el pedido en Notion: uno o más campos no existen en la base de datos';
          console.error('API Orders - Error: campos no compatibles. Verificar la estructura de la base de datos.');
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('API Orders - Error general al procesar pedido:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el pedido' },
      { status: 500 }
    );
  }
} 