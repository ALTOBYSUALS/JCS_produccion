# Corrección de la Integración con Mercado Pago

Basado en el análisis del código y las pruebas realizadas, se han identificado los siguientes problemas con la integración de Mercado Pago:

## Problemas Identificados

1. **Token de acceso inválido**: El script de prueba muestra un error 401 (no autorizado) cuando intenta conectarse a la API de Mercado Pago.
   
2. **Posible incompatibilidad en los nombres de las variables**: En tu archivo `.env.local` tienes `MERCADOPAGO_ACCESS_TOKEN` pero el código espera `MERCADO_PAGO_ACCESS_TOKEN` (con guiones bajos).

3. **Selección del método de pago**: En algunos logs aparece `creditCard` como método seleccionado en lugar de `mercadopago`.

## Solución

### 1. Corregir las variables de entorno

Edita tu archivo `.env.local` para asegurarte de que los nombres de las variables coincidan exactamente con lo que el código espera:

```
# Mercado Pago Integration 
MERCADO_PAGO_ACCESS_TOKEN=TEST-827965627573974-051313-f4e940f6e0bc0bd187a2a055c5e931c6-1037695712
MERCADO_PAGO_PUBLIC_KEY=TEST-76e48cc2-8410-4002-b979-35e7f504f2f1
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-76e48cc2-8410-4002-b979-35e7f504f2f1
```

### 2. Renovar el token de acceso

Tu token de acceso actual está retornando un error 401, lo que significa que puede haber expirado o ser inválido. Sigue estos pasos para obtener uno nuevo:

1. Inicia sesión en [Mercado Pago Developer](https://www.mercadopago.com.ar/developers)
2. Ve a "Tus integraciones" o "Aplicaciones"
3. Selecciona tu aplicación "JCS El Guardian Pagos"
4. En la sección de "Credenciales de producción", copia el nuevo Access Token
5. Actualiza el valor en tu archivo `.env.local`

### 3. Reiniciar completamente el servidor

Después de hacer estos cambios, detén completamente el servidor y reinícialo:

```bash
# Detener el servidor (Ctrl+C)
# Cerrar completamente la terminal
# Abrir una nueva terminal

cd /ruta/a/tu/proyecto
npm run dev
```

### 4. Probar la integración

1. Visita http://localhost:3000/mercadopago-test en tu navegador para probar la integración
2. Completa un proceso de compra seleccionando "Mercado Pago" como método de pago

### 5. Verificar el valor seleccionado en el formulario

Si aún tienes problemas, verifica que el componente `checkout-form.tsx` esté seleccionando correctamente "mercadopago" como valor. En particular, revisa estos puntos:

1. El valor por defecto en el formulario debe ser `mercadopago`
2. Los radio buttons deben tener el valor exacto `mercadopago` (no `creditCard`)
3. Al seleccionar el método de pago, deberías ver logs en la consola como "SELECCIÓN: Cambiando a método de pago: mercadopago"

## Verificación Final

Después de realizar estos cambios, deberías poder:

1. Ver en los logs del servidor mensajes como "CHECKOUT: ENTRANDO AL BLOQUE IF DE MERCADO PAGO ✅"
2. Ver solicitudes a `/api/mercadopago` en los logs del servidor o en la pestaña Network del navegador
3. Ser redirigido al sitio de Mercado Pago para completar el pago

Si continúas teniendo problemas, verifica que tus credenciales de prueba estén bien configuradas en tu cuenta de Mercado Pago. 

console.log("CHECKOUT DEBUG: metodoPago =", data.metodoPago);
console.log("CHECKOUT DEBUG: Tipo de data.metodoPago =", typeof data.metodoPago);
console.log("CHECKOUT DEBUG: Comparación ===", data.metodoPago === "mercadopago");
console.log("CHECKOUT DEBUG: Comparación ==", data.metodoPago == "mercadopago"); 

fetch('/api/mercadopago', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{ id: '1', title: 'Test', quantity: 1, unit_price: 100, currency_id: 'ARS' }],
    payer: { email: 'test@test.com', name: 'Test' },
    backUrls: { success: window.location.origin }
  })
}).then(r => r.json()).then(console.log).catch(console.error) 
curl -X GET \
  "https://api.mercadopago.com/users/test_user?access_token=TEST-5771161035830985-051413-ad408f74b7d44dbc4ff4e8289da1e65c-1037695712"