# Configuración de Amazon SES para JCS El Guardián

Este documento explica cómo configurar Amazon Simple Email Service (SES) para el envío de correos electrónicos en la aplicación.

## Paso 1: Configuración de Amazon SES

1. **Verifica tus dominios o direcciones de correo electrónico en Amazon SES**:
   - Inicia sesión en la [Consola de AWS](https://console.aws.amazon.com/)
   - Navega a Amazon SES
   - En el panel lateral, selecciona "Identity Management" y luego "Email Addresses" o "Domains"
   - Agrega y verifica el dominio `jcselguardian.com.ar` o al menos una dirección de correo como `info@jcselguardian.com.ar`
   - Sigue las instrucciones para la verificación (por correo electrónico o registros DNS)

2. **Crea credenciales SMTP**:
   - En la consola de SES, ve a "SMTP Settings"
   - Haz clic en "Create My SMTP Credentials"
   - Asigna un nombre a tus credenciales (ej. "jcs-el-guardian-smtp")
   - Guarda el nombre de usuario SMTP (es un ID de acceso de AWS) y la contraseña de forma segura

## Paso 2: Actualiza el archivo .env.local

Agrega o actualiza las siguientes variables en tu archivo `.env.local`:

```
# Amazon SES Configuration
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com  # Ajusta la región según corresponda a la tuya
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=TU_ACCESS_KEY_ID_DE_SES  # AKIAXXXXXXXXXXXXXXXX
EMAIL_PASSWORD=TU_SECRET_ACCESS_KEY_DE_SES  # La clave secreta completa
EMAIL_FROM=info@jcselguardian.com.ar  # El email verificado en SES

# URL Base para enlaces en los emails
NEXT_PUBLIC_BASE_URL=https://jcselguardian.com.ar  # Ajusta según corresponda
```

## Paso 3: Prueba la configuración

1. Realiza una prueba de envío de correo utilizando el siguiente comando desde la terminal:

```bash
npm run dev
```

2. Una vez que el servidor esté en marcha, realiza una orden de prueba o utiliza la API de correo electrónico para verificar que los correos se envíen correctamente.

## Paso 4: Salir del entorno de SES Sandbox (opcional pero recomendado para producción)

Por defecto, Amazon SES coloca las cuentas nuevas en un "sandbox" que sólo permite enviar correos a direcciones verificadas. Para enviar correos a cualquier destinatario:

1. En la consola de SES, ve a "Sending Statistics"
2. Haz clic en "Request Production Access"
3. Completa el formulario con información sobre cómo planeas usar SES
4. Espera la aprobación de AWS (generalmente toma 24-48 horas)

## Solución de problemas comunes

- **Error 535 Authentication failed**: Verifica que EMAIL_USER y EMAIL_PASSWORD sean correctos y correspondan a las credenciales SMTP generadas en SES, no a tu usuario y contraseña de AWS.

- **Error de envío a destinatarios no verificados**: Si estás en modo sandbox, solo puedes enviar a direcciones de correo electrónico verificadas en SES.

- **Correos marcados como spam**: Configura registros SPF, DKIM y DMARC para tu dominio siguiendo las instrucciones en la documentación de SES.

## Recursos adicionales

- [Documentación de Amazon SES](https://docs.aws.amazon.com/ses/)
- [Documentación de Nodemailer](https://nodemailer.com/about/)
- [Guía de mejores prácticas para evitar el spam](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html) 