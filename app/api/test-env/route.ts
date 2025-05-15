import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Leer todas las variables de entorno relacionadas con Mercado Pago
    const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'no definido';
    const mpPublicKey = process.env.MERCADO_PAGO_PUBLIC_KEY || 'no definido';
    const nextPublicMpPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || 'no definido';
    
    // Ocultar parte del token por seguridad
    const safeAccessToken = mpAccessToken !== 'no definido' 
      ? `${mpAccessToken.substring(0, 10)}...${mpAccessToken.substring(mpAccessToken.length - 10)}`
      : 'no definido';
    
    const safePublicKey = mpPublicKey !== 'no definido'
      ? `${mpPublicKey.substring(0, 10)}...${mpPublicKey.substring(mpPublicKey.length - 10)}`
      : 'no definido';
    
    // Comprobar si las variables existen y mostrar resultados
    console.log('DEBUG ENV TEST - MERCADO_PAGO_ACCESS_TOKEN:', safeAccessToken);
    console.log('DEBUG ENV TEST - MERCADO_PAGO_PUBLIC_KEY:', safePublicKey);
    console.log('DEBUG ENV TEST - NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY:', nextPublicMpPublicKey);
    
    return NextResponse.json({
      status: 'ok',
      env_vars: {
        MERCADO_PAGO_ACCESS_TOKEN: safeAccessToken,
        MERCADO_PAGO_PUBLIC_KEY: safePublicKey,
        NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: nextPublicMpPublicKey,
      },
      message: 'Revisa la consola del servidor para ver los logs completos'
    });
  } catch (error) {
    console.error('Error al verificar variables de entorno:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Error al verificar variables de entorno' 
    }, { status: 500 });
  }
} 