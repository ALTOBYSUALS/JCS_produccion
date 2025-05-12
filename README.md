# Sistema de Pedidos y Facturación con Notion

Este documento describe cómo configurar y utilizar el sistema de pedidos y facturación integrado con Notion para el e-commerce de JCS El Guardián.

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

### 2. Configurar Variables de Entorno

Añade la siguiente variable a tu archivo `.env.local`:

```
# ID de la Base de Datos de Pedidos en Notion
NOTION_DATABASE_ID_ORDERS=tu_id_de_base_de_datos_aquí
```

Reemplaza `tu_id_de_base_de_datos_aquí` con el ID de tu base de datos de pedidos en Notion. Este ID se encuentra en la URL de tu base de datos cuando la abres en Notion.

### 3. Integración con AFIP (Opcional)

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

1. **Creación del Pedido**: Cuando un cliente completa el checkout, los datos se envían a Notion.
2. **Gestión de Pedidos**: Desde el panel de administración, podrás ver todos los pedidos y actualizar su estado.
3. **Facturación**: Al procesar un pedido, podrás emitir la factura correspondiente.

### Consulta de Pedidos

El panel de administración muestra todos los pedidos guardados en Notion, permitiendo:
- Ver detalles del pedido
- Actualizar estado
- Emitir factura (funcionalidad en desarrollo)

## Próximos Pasos

1. **Sistema de Notificaciones**: Enviar emails automáticos al cliente informando sobre el estado de su pedido.
2. **Panel de Cliente**: Desarrollar un área donde los clientes puedan consultar sus pedidos y facturas.
3. **Integración con Sistema de Envíos**: Conectar con servicios de logística para automatizar el proceso de envío.

---

Este sistema está en desarrollo y puede recibir actualizaciones y mejoras. Para consultas o soporte, contacta al equipo de desarrollo. 