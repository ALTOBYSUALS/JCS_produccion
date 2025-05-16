import { NextResponse } from 'next/server';

const MAX_RETRIES = 3;
const BASE_TIMEOUT = 10000; // 10 segundos

/**
 * Implementa un sistema de reintento con backoff exponencial
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES) {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`API MercadoPago - Intento ${attempt + 1}/${retries}`);
      
      // Incrementar timeout para cada intento
      const timeout = BASE_TIMEOUT * Math.pow(1.5, attempt);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Si es un error de servidor (5xx), podemos reintentar
      if (response.status >= 500 && response.status < 600 && attempt < retries - 1) {
        const errorText = await response.text();
        console.error(`API MercadoPago - Error de servidor (${response.status}): ${errorText}`);
        
        // Esperar un tiempo antes de reintentar (backoff exponencial)
        const backoff = Math.min(Math.pow(2, attempt) * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`API MercadoPago - Error en intento ${attempt + 1}/${retries}:`, lastError.message);
      
      // Si es un error de timeout o de red, reintentamos
      if (error instanceof Error && 
          (error.name === 'AbortError' || 
           error.message.includes('network') || 
           error.message.includes('fetch'))) {
        
        if (attempt < retries - 1) {
          // Esperar un tiempo antes de reintentar (backoff exponencial)
          const backoff = Math.min(Math.pow(2, attempt) * 1000, 10000);
          console.log(`API MercadoPago - Esperando ${backoff}ms antes de reintentar...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
      }
      
      // Si llegamos aquí, es un error que no podemos manejar o hemos agotado los reintentos
      throw lastError;
    }
  }
  
  // Si llegamos aquí, todos los reintentos fallaron
  throw lastError || new Error('Error desconocido en la comunicación con Mercado Pago');
}

/**
 * API endpoint para crear preferencia de pago con Mercado Pago
 */
export async function POST(req: Request) {
  try {
    console.log('API MercadoPago - Iniciando creación de preferencia');
    const data = await req.json();
    
    // Verificar que el cuerpo de la solicitud tenga todos los datos necesarios
    if (!data.items || !data.payer || !data.back_url) {
      console.error('API MercadoPago - Datos insuficientes (back_url faltante o incorrecto):', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: 'Datos insuficientes para crear preferencia de pago' },
        { status: 400 }
      );
    }
    
    // Asegurarse de que tengamos URLs de retorno
    const backUrlDetails = data.back_url;
    if (!backUrlDetails?.success || !backUrlDetails?.failure) {
      console.error('API MercadoPago - URLs de retorno faltantes en back_url:', JSON.stringify(backUrlDetails, null, 2));
      return NextResponse.json(
        { error: 'URLs de retorno (success, failure) son requeridas en back_url' },
        { status: 400 }
      );
    }
    
    // En un entorno de producción, recuperaríamos el access token de las variables de entorno
    console.log('DEBUG: Valor de process.env.MERCADO_PAGO_ACCESS_TOKEN:', process.env.MERCADO_PAGO_ACCESS_TOKEN);
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN no está definido en las variables de entorno');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    // Construir la preferencia de pago para Mercado Pago
    const preferenceData = {
      items: data.items,
      payer: data.payer,
      back_url: {
        success: backUrlDetails.success,
        failure: backUrlDetails.failure,
        ...(backUrlDetails.pending ? { pending: backUrlDetails.pending } : {})
      },
      external_reference: data.externalReference,
      notification_url: process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/api/mercadopago/webhook`
        : undefined,
    };
    
    console.log('API MercadoPago - Preferencia enviada a MP:', JSON.stringify(preferenceData, null, 2));
    
    console.log('API MercadoPago - Enviando solicitud a Mercado Pago');
    
    try {
      // Llamar a la API de Mercado Pago con sistema de reintento
      const response = await fetchWithRetry(
        'https://api.mercadopago.com/checkout/preferences',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'JCSElGuardian/1.0'
          },
          body: JSON.stringify(preferenceData)
        }
      );
      
      if (!response.ok) {
        // Intentar obtener un mensaje de error detallado
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          errorText = await response.text();
        }
        
        console.error('Error en API de Mercado Pago:', response.status, errorText);
        
        // Personalizar el mensaje de error basado en el código HTTP
        let errorMessage = 'Error al crear preferencia de pago';
        if (response.status === 401) {
          errorMessage = 'Error de autenticación con Mercado Pago. Verifique su API key.';
        } else if (response.status === 400) {
          errorMessage = 'Datos inválidos en la solicitud a Mercado Pago.';
        } else if (response.status >= 500) {
          errorMessage = 'Error en los servidores de Mercado Pago. Intente más tarde.';
        }
        
        return NextResponse.json(
          { error: `${errorMessage} (${response.status}): ${errorText}` },
          { status: response.status }
        );
      }
      
      const preference = await response.json();
      console.log('API MercadoPago - Preferencia creada con éxito:', preference.id);
      
      return NextResponse.json({ 
        preferenceId: preference.id,
        initPoint: preference.init_point
      });
      
    } catch (fetchError) {
      // Manejo de errores específicos
      console.error('API MercadoPago - Error de comunicación:', fetchError);
      
      let statusCode = 500;
      let errorMessage = 'Error interno del servidor';
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          statusCode = 504;
          errorMessage = 'Timeout al conectar con Mercado Pago';
        } else if (fetchError.message.includes('network') || fetchError.message.includes('fetch')) {
          statusCode = 503;
          errorMessage = 'No se pudo establecer conexión con Mercado Pago';
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }
    
  } catch (error) {
    console.error('Error al procesar la solicitud de Mercado Pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 