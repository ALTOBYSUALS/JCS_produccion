// Script para probar la configuración de Mercado Pago
require('dotenv').config({ path: '.env.local' });
const https = require('https');

function httpGet(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, options, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        try {
          const data = JSON.parse(body);
          resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers, 
            ok: res.statusCode >= 200 && res.statusCode < 300,
            data
          });
        } catch (e) {
          resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers, 
            ok: res.statusCode >= 200 && res.statusCode < 300,
            body
          });
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.end();
  });
}

async function testMercadoPagoIntegration() {
  console.log('Probando integración con Mercado Pago...');
  
  // Verificar si las variables de entorno están configuradas
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;
  
  console.log('\nVerificando variables de entorno:');
  console.log(`MERCADO_PAGO_ACCESS_TOKEN: ${accessToken ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`MERCADO_PAGO_PUBLIC_KEY: ${publicKey ? '✅ Configurado' : '❌ No configurado'}`);
  
  if (!accessToken) {
    console.error('\n❌ ERROR: MERCADO_PAGO_ACCESS_TOKEN no está configurado en .env.local');
    console.log('Por favor, agrega la variable en el archivo .env.local con tu token de acceso de Mercado Pago.');
    return;
  }
  
  console.log('\nProbando conexión a la API de Mercado Pago...');
  
  try {
    // Intentar obtener información básica de la cuenta para validar el token
    const response = await httpGet('https://api.mercadopago.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.ok) {
      console.log('\n✅ Conexión exitosa a Mercado Pago!');
      console.log('Información de la cuenta:');
      console.log(`- ID: ${response.data.id}`);
      console.log(`- Nombre: ${response.data.first_name} ${response.data.last_name}`);
      console.log(`- Email: ${response.data.email}`);
      console.log(`- Estado: ${response.data.status}`);
    } else {
      console.error(`\n❌ Error al conectar con Mercado Pago: ${response.statusCode}`);
      console.error(`Respuesta: ${response.body || JSON.stringify(response.data)}`);
      
      if (response.statusCode === 401) {
        console.error('\nEl token de acceso parece ser inválido o ha expirado.');
        console.log('Verifica que hayas copiado correctamente el MERCADO_PAGO_ACCESS_TOKEN en tu archivo .env.local');
      }
    }
  } catch (error) {
    console.error('\n❌ Error al conectar con Mercado Pago:');
    console.error(error.message);
  }
  
  // Verificar configuración de webhook
  console.log('\nVerificando URL de notificaciones:');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  console.log(`NEXT_PUBLIC_SITE_URL: ${siteUrl ? '✅ Configurado' : '❌ No configurado'}`);
  
  if (siteUrl) {
    const webhookUrl = `${siteUrl}/api/mercadopago/webhook`;
    console.log(`URL de webhook: ${webhookUrl}`);
  } else {
    console.error('❌ ERROR: NEXT_PUBLIC_SITE_URL no está configurado en .env.local');
    console.log('Esta variable es necesaria para recibir notificaciones de Mercado Pago.');
  }
}

testMercadoPagoIntegration().catch(console.error); 