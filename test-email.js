// Script para probar la configuración de Amazon SES
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

// Configurar el transportador SMTP para Amazon SES
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Función principal
async function main() {
  console.log('Probando conexión con Amazon SES...');
  console.log('Usando configuración:');
  console.log(`  - Host: ${process.env.EMAIL_HOST}`);
  console.log(`  - Puerto: ${process.env.EMAIL_PORT}`);
  console.log(`  - Secure: ${process.env.EMAIL_SECURE}`);
  console.log(`  - Usuario: ${process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 8) + '...' : 'no configurado'}`);
  console.log(`  - Contraseña: ${process.env.EMAIL_PASSWORD ? '********' : 'no configurada'}`);
  console.log(`  - Remitente: ${process.env.EMAIL_FROM || 'no configurado'}`);

  // Destinatario de prueba - reemplaza esto con tu email verificado
  const testEmail = process.env.EMAIL_FROM || 'tu-email-verificado@example.com';

  try {
    // Verificar conexión
    await transporter.verify();
    console.log('✅ Conexión con servidor SMTP establecida correctamente!');

    // Enviar correo de prueba
    console.log(`Enviando correo de prueba a ${testEmail}...`);
    const info = await transporter.sendMail({
      from: `"JCS El Guardián Test" <${process.env.EMAIL_FROM}>`,
      to: testEmail,
      subject: "Prueba de configuración de Amazon SES",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Prueba de Email</h1>
          </div>
          
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>¡Hola!</p>
            <p>Si estás viendo este correo, la configuración de Amazon SES en tu aplicación <strong>JCS El Guardián</strong> está funcionando correctamente.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 20px;">
              <p style="margin-top: 0; font-weight: bold;">Detalles de la prueba</p>
              <p style="margin-bottom: 0;">Fecha y hora: ${new Date().toLocaleString()}</p>
            </div>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>Este email es una prueba automática.</p>
            <p>© ${new Date().getFullYear()} JCS El Guardián</p>
          </div>
        </div>
      `
    });

    console.log('✅ Email enviado correctamente!');
    console.log(`ID del mensaje: ${info.messageId}`);
    console.log(`Respuesta del servidor: ${info.response}`);
  } catch (error) {
    console.error('❌ Error al conectar o enviar email:');
    console.error(error);
    
    if (error.message.includes('535 Authentication')) {
      console.log('\n🔍 SUGERENCIA: El error indica un problema de autenticación:');
      console.log('1. Verifica que EMAIL_USER y EMAIL_PASSWORD sean correctos');
      console.log('2. Asegúrate de usar las credenciales SMTP generadas en SES, no tus credenciales de AWS');
      console.log('3. Comprueba que tu cuenta no tenga restricciones de seguridad adicionales');
    }
    
    if (error.message.includes('getaddrinfo')) {
      console.log('\n🔍 SUGERENCIA: Error al resolver el host:');
      console.log('1. Verifica que EMAIL_HOST sea correcto');
      console.log('2. Asegúrate de tener conexión a internet');
      console.log('3. Comprueba si hay un firewall bloqueando la conexión');
    }
  }
}

// Ejecutar el script
main().catch(console.error); 