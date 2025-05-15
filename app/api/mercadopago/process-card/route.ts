import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createOrderInNotion } from '@/lib/notion'; // Asumiendo que tienes una función así o similar
import { sendOrderConfirmationEmail } from '@/lib/email'; // Para enviar confirmación

// Helper para definir el tipo de datos del pedido que esperamos del frontend
// Debería coincidir con la estructura de `orderData` en `checkout-form.tsx`
interface OrderInfo {
  pedidoId: string;
  fechaPedido: string;
  cliente: string;
  emailCliente: string;
  telefonoCliente: string;
  direccionEnvio: string;
  ciudadEnvio: string;
  cpEnvio: string;
  notasAdicionales?: string;
  subtotal: number;
  costoEnvio: number;
  totalPedido: number;
  detalleProductosTexto: string;
  estadoPedido: string; // Este se actualizará según el pago
  metodoPago: string;   // ej. "Tarjeta (Online)"
  metodoPagoOriginal: string; // ej. "tarjeta"
  productoIds: string[];
  datosFiscales?: any; // Ajustar tipo según tu definición
  trackingToken: string;
  trackingUrl: string;
  estadoHistorial: Array<{ estado: string; fecha: string; notas: string }>;
}

interface ProcessCardRequestBody {
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  installments: number;
  orderInfo: OrderInfo;
}

export async function POST(req: Request) {
  try {
    console.log("API: Recibiendo solicitud de procesamiento de tarjeta");
    const data = await req.json();
    console.log("API: Datos recibidos:", JSON.stringify({
      token: data.token ? "[PRESENTE]" : "[AUSENTE]",
      orderId: data.orderId,
      amount: data.amount
    }));
    
    const { token, orderId, customer, amount, description } = data;
    
    if (!token || !orderId || !amount) {
      console.error("API: Faltan datos requeridos:", { 
        token: !!token, 
        orderId: !!orderId, 
        amount: !!amount 
      });
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }
    
    // Configurar cliente de Mercado Pago
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    console.log("API: Access Token presente:", !!accessToken);
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Configuración de Mercado Pago incompleta' }, { status: 500 });
    }
    
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);
    
    // Crear pago
    console.log("API: Intentando crear pago...");
    const result = await payment.create({
      body: {
        token,
        transaction_amount: amount,
        description,
        installments: 1,
        payment_method_id: 'visa', // Se detectará automáticamente del token
        payer: {
          email: customer?.email || 'comprador@example.com',
          identification: {
            type: 'DNI',
            number: '12345678'  // Opcional, podría venir de los datos fiscales
          }
        },
        metadata: {
          order_id: orderId
        },
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`
      }
    });
    
    console.log("API: Pago creado exitosamente:", result.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error al procesar pago con tarjeta:', error);
    // Extraer detalles adicionales si están disponibles
    const errorDetails = error.cause ? JSON.stringify(error.cause) : 'No hay detalles adicionales';
    console.error('Detalles del error:', errorDetails);
    
    return NextResponse.json(
      { 
        error: error.message || 'Error al procesar el pago',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}