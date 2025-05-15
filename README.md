# Sistema de Pedidos y Facturación con Notion

Este documento describe cómo configurar y utilizar el sistema de pedidos, facturación y seguimiento integrado con Notion para el e-commerce de JCS El Guardián.

## Configuración del Sistema

### 1. Crear Base de Datos de Pedidos en Notion

1. En tu espacio de trabajo de Notion, crea una nueva base de datos.
2. Configura las siguientes propiedades en la base de datos:

| Nombre Propiedad | Tipo en Notion | Propósito |
|------------------|----------------|-----------|
| pedidoId | Title | ID único del pedido (referencia) |
| fechaPedido | Date | Fecha y hora de creación del pedido |
| cliente | Text | Nombre del cliente |
| emailCliente | Email | Email del cliente |
| telefonoCliente | Phone | Teléfono del cliente |
| direccionEnvio | Text | Dirección completa de envío |
| ciudadEnvio | Text | Ciudad de envío |
| cpEnvio | Text | Código postal |
| notasAdicionales | Text | Notas adicionales del cliente |
| subtotal | Number | Suma de precios de productos (formato moneda) |
| costoEnvio | Number | Costo del envío (formato moneda) |
| totalPedido | Formula | `prop("subtotal") + prop("costoEnvio")` (formato moneda) |
| detalleProductosTexto | Text | Resumen de productos y cantidades |
| estadoPedido | Select | Opciones: "Pendiente de Pago", "Pagado", "Preparando Envío", "Enviado", "Entregado", "Cancelado" |
| metodoPago | Select | Opciones: "Efectivo", "Transferencia", "Tarjeta", "Mercado Pago" |
| ProductosRelacionados | Relation | Vinculación con la DB "productos" de Notion |
| documentoCliente | Text | DNI o CUIT del cliente para facturación |
| tipoDocumento | Select | Opciones: "DNI", "CUIT" |
| razonSocial | Text | Para facturas a empresas |
| tipoFactura | Select | Opciones: "A", "B", "C" |
| CAE | Text | Para guardar el CAE de AFIP cuando se emita la factura |
| fechaVencimientoCAE | Date | Fecha de vencimiento del CAE |
| trackingToken | Text | Token único para identificar el pedido en el sistema de seguimiento |
| trackingUrl | URL | URL completa para seguimiento del pedido |
| estadoHistorial | Text | Historial de cambios de estado en formato JSON |
| codigoSeguimiento | Text | Código de seguimiento de la empresa de transporte (OCA, etc.) |
| empresaEnvio | Select | Opciones: "OCA", "Correo Argentino", "Vía Cargo", etc. |

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```
# Notion API
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID_PRODUCTS=your_products_database_id_here
NOTION_DATABASE_ID_ORDERS=tu_id_de_base_de_datos_pedidos_aquí

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email Configuration
EMAIL_HOST=smtp.tu-proveedor.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-usuario
EMAIL_PASSWORD=tu-contraseña
EMAIL_FROM=info@jcselguardian.com.ar
```

Reemplaza los valores con tus propias credenciales y configuraciones.

### 3. Configuración de Servicio de Email

El sistema utiliza Nodemailer para el envío de emails. Puedes configurarlo con:

#### Para desarrollo y pruebas:
- [Ethereal Mail](https://ethereal.email/): Servicio de prueba que captura los emails sin enviarlos realmente.
- [Mailtrap](https://mailtrap.io/): Servicio similar que permite probar emails en un entorno sandbox.

#### Para producción:
- [SendGrid](https://sendgrid.com/)
- [Mailgun](https://www.mailgun.com/)
- [Amazon SES](https://aws.amazon.com/ses/)
- SMTP propio

Asegúrate de actualizar las variables EMAIL_* en el archivo .env.local según el servicio elegido.

### 4. Integración con AFIP (Opcional)

Para la facturación electrónica con AFIP, tienes varias opciones:

#### Opción 1: Servicios Web de AFIP (WSFE/WSFEX)
Esta es la forma directa, pero requiere desarrollo técnico para:
- Conectarte a los web services de AFIP
- Manejar la autenticación (WSAA)
- Generar los XML de las facturas

#### Opción 2: Proveedores de Facturación Electrónica
Utilizar servicios como:
- Facturante
- Contagram
- NUBEFACT
- Entre otros

Estos servicios ofrecen APIs que facilitan la emisión de facturas y la conexión con AFIP.

## Funcionamiento del Sistema

### Flujo del Pedido

1. **Creación del Pedido**: 
   - El cliente completa el checkout
   - Se genera un token único para seguimiento
   - Los datos se envían a Notion
   - Se envía un email de confirmación con link de seguimiento

2. **Seguimiento del Pedido**:
   - El cliente puede seguir el estado de su pedido mediante el link recibido
   - No necesita crear una cuenta ni recordar contraseñas
   - Recibe notificaciones por email cuando el estado cambia

3. **Gestión de Pedidos**:
   - Desde el panel de administración, podrás ver todos los pedidos
   - Actualizar su estado (lo que envía notificaciones automáticas)
   - Registrar códigos de seguimiento de empresas de transporte

4. **Facturación**:
   - Al procesar un pedido, podrás emitir la factura correspondiente
   - La factura se vincula al pedido en Notion

### Notificaciones por Email

El sistema envía automáticamente estos emails:

1. **Confirmación de Pedido**: Cuando se crea un nuevo pedido
2. **Actualización de Estado**: Cuando el estado del pedido cambia
3. **Factura Disponible**: Cuando se emite la factura (en desarrollo)

### Seguimiento de Pedidos

La página de seguimiento (`/rastreo?token=xxx`) muestra:
- Información básica del pedido (ID, fecha)
- Estado actual
- Historial de estados
- Información de envío (transportista y código de seguimiento)
- Se actualiza automáticamente cada 30 segundos

## Próximos Pasos

1. **Integración con Empresas de Transporte**: API directa con OCA, Correo Argentino, etc. para:
   - Crear envíos automáticamente
   - Obtener etiquetas y guías
   - Sincronizar estados de seguimiento

2. **Panel de Administración Mejorado**: 
   - Gestión avanzada de estados
   - Asignación de códigos de seguimiento
   - Generación de reportes

3. **Integración con Sistema de Facturación**:
   - Emisión automática de facturas electrónicas
   - Descarga de PDF de facturas

---

Este sistema está en desarrollo y puede recibir actualizaciones y mejoras. Para consultas o soporte, contacta al equipo de desarrollo. 