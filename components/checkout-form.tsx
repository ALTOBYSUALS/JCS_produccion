"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, CheckCircle } from "lucide-react"
import { generateTrackingUrl, generateTrackingToken } from "@/lib/utils"
import { MercadoPagoLoading } from "./mercadopago-loading"
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Define CartItem interface locally
interface CartItem {
  id: string | number;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  quantity: number;
}

// Define ViewName type and SetViewFunction to match app-content.tsx
type ViewName = 'storefront' | 'neumaticos' | 'llantas' | 'accesorios' | 'servicios' | 'contacto' | 'shopByBrand' | 'productDetail' | 'cart' | 'checkout' | 'adminLogin' | 'adminDashboard' |
  'llantas_deportivas' | 'llantas_chapa' | 'llantas_r14' | 'llantas_r15' | 'llantas_r17' |
  'servicio_alineacion' | 'servicio_reparacion' | 'servicio_aceite' | 'servicio_frenos' | 'servicio_suspension' | 'servicio_mecanica';

type SetViewFunction = (view: ViewName, context?: any) => void;

// AGREGAR UN TIPO PARA FORMDATA DEL BRICK
interface CardPaymentFormData {
  token: string;
  payment_method_id: string;
  issuer_id?: string; // Puede ser opcional o no estar presente para todos los casos
  installments: number;
  bin?: string; // Los primeros 6 dígitos de la tarjeta, también opcional
  // Pueden existir otros campos, revisa la documentación de MP si necesitas más
}

// Regex para validación (ejemplos, pueden necesitar ajustes)
// Código Postal Argentino: Acepta NNNN o ANNNNAAA o ANNNN
const cpArRegex = /^(?:\d{4}|[A-Za-z]\d{4}(?:[A-Za-z]{3})?)$/;
// Teléfono Argentino: simple, entre 7 y 15 dígitos, opcionalmente con + al inicio
const telefonoArRegex = /^\+?\d{7,15}$/;

// Schema de validación para el formulario
const checkoutFormSchema = z.object({
  nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Email inválido." }),
  telefono: z.string().regex(telefonoArRegex, { message: "Teléfono inválido." }),
  direccion: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  ciudad: z.string().min(3, { message: "La ciudad debe tener al menos 3 caracteres." }),
  codigoPostal: z.string().regex(cpArRegex, { message: "Código postal inválido." }),
  notas: z.string().optional(),
  metodoPago: z.enum(["efectivo", "transferencia", "mercadopago", "tarjeta"], {
    required_error: "Selecciona un método de pago.",
  }),
  // Datos fiscales opcionales que se vuelven requeridos si se marca la casilla
  necesitaFactura: z.boolean().default(false),
  datosFiscales: z.object({
    tipoDocumento: z.enum(["DNI", "CUIT"]),
    documento: z.string().min(7, { message: "Documento inválido" }),
    tipoFactura: z.enum(["A", "B", "C"]),
    razonSocial: z.string().optional(),
  }).optional(),
});

// Tipo inferido del schema
type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

// Status del proceso de checkout
type CheckoutStatus = "idle" | "validating" | "processing" | "success" | "error";

// Nuevo tipo para la información de pago manual
type ManualPaymentInfo = {
  metodo: 'efectivo' | 'transferencia';
  instrucciones: string;
};

interface CheckoutFormProps {
  onCardTokenReceived?: (data: any, additionalData?: any) => void;
  cardToken?: string | null;
  paymentMethod?: string;
  setPaymentMethod?: (method: "efectivo" | "transferencia" | "mercadopago" | "tarjeta") => void;
  setView?: SetViewFunction;
  cartItems?: CartItem[];
  totalPrice?: number;
  formData?: any;
}

export function CheckoutForm({ 
  onCardTokenReceived, 
  cardToken, 
  paymentMethod, 
  setPaymentMethod,
  setView,
  cartItems: providedCartItems,
  totalPrice: providedTotalPrice,
  formData: providedFormData
}: CheckoutFormProps) {
  const { cartItems: contextCartItems, totalPrice: contextTotalPrice, clearCart } = useCart();
  const actualCartItems = providedCartItems || contextCartItems;
  const actualTotalPrice = providedTotalPrice || contextTotalPrice;
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>("idle");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [manualPaymentInfo, setManualPaymentInfo] = useState<ManualPaymentInfo | null>(null);
  const [envioPrice, setEnvioPrice] = useState(0); // Precio de envío se calculará o será fijo. Por ahora 0, ajustar si es necesario.
  const [mercadoPagoPreferenceId, setMercadoPagoPreferenceId] = useState<string | null>(null); // NUEVO: Para el preferenceId si es necesario para el brick
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("transferencia");
  
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      ciudad: "",
      codigoPostal: "",
      notas: "",
      metodoPago: "transferencia",
      necesitaFactura: false,
      datosFiscales: {
        tipoDocumento: "DNI",
        documento: "",
        tipoFactura: "B",
        razonSocial: ""
      }
    },
    mode: "onChange"
  });
  
  // Agregar logs para ver valores iniciales del formulario
  console.log("CHECKOUT FORM - Valores iniciales del formulario:");
  console.log("- metodoPago default:", form.getValues("metodoPago"));
  console.log("- valores completos:", form.getValues());
  
  // Observar el cambio en necesitaFactura para validación condicional
  const watchNecesitaFactura = form.watch("necesitaFactura");
  
  useEffect(() => {
    // Validación condicional para datos fiscales
    if (watchNecesitaFactura) {
      form.register("datosFiscales.tipoDocumento", { required: "Selecciona tipo de documento" });
      form.register("datosFiscales.documento", { required: "Documento requerido" });
      form.register("datosFiscales.tipoFactura", { required: "Tipo de factura requerido" });
    }
    
    // Log para depuración del valor de metodoPago en el form
    console.log("CHECKOUT FORM - metodoPago en useEffect:", form.getValues("metodoPago"));
    
  }, [watchNecesitaFactura, form]);
  
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
    console.log("Mercado Pago Public Key:", publicKey);
    
    if (publicKey) {
      try {
        initMercadoPago(publicKey, { 
          locale: 'es-AR' 
        });
        console.log("Mercado Pago inicializado correctamente");
      } catch (error) {
        console.error("Error al inicializar Mercado Pago:", error);
      }
    } else {
      console.error("NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY is not defined.");
    }
  }, []);
  
  // Preparar detalles de productos para el pedido
  const getProductDetailsText = () => {
    return actualCartItems.map(item => `${item.quantity}x ${item.name}`).join(", ");
  };
  
  // Calcular total
  const total = actualTotalPrice + envioPrice;
  
  // NUEVO: Función para manejar el submit del CardPayment Brick
  const handleCardPaymentSubmit = async (formDataFromBrick: CardPaymentFormData) => { // Renombré para claridad
    console.log("BRICK SUBMIT - handleCardPaymentSubmit INICIADO. Datos del Brick:", formDataFromBrick); // LOG 1
    
    // Asegúrate que formDataFromBrick y formDataFromBrick.token existan
    if (!formDataFromBrick || !formDataFromBrick.token) {
      console.error("BRICK SUBMIT - No se recibió token del Brick.");
      alert("Error al obtener datos de la tarjeta. Intente nuevamente.");
      setCheckoutStatus("error");
      return;
    }

    setCheckoutStatus("processing");
    const currentFormData = form.getValues(); 
    const trackingToken = generateTrackingToken();
    const trackingUrl = generateTrackingUrl(trackingToken);
    let estadoPedidoInicial = "Pendiente de Pago (Tarjeta)";
    let metodoPagoParaApi = "Tarjeta (Online)";

    const orderData = {
      pedidoId: `JCS-${new Date().getTime().toString().slice(-6)}`,
      fechaPedido: new Date().toISOString(),
      cliente: currentFormData.nombre,
      emailCliente: currentFormData.email,
      telefonoCliente: currentFormData.telefono,
      direccionEnvio: currentFormData.direccion,
      ciudadEnvio: currentFormData.ciudad,
      cpEnvio: currentFormData.codigoPostal,
      notasAdicionales: currentFormData.notas,
      subtotal: actualTotalPrice,
      costoEnvio: envioPrice,
      totalPedido: total, // Asegúrate que 'total' aquí sea el correcto
      detalleProductosTexto: getProductDetailsText(),
      estadoPedido: estadoPedidoInicial,
      metodoPago: metodoPagoParaApi,
      metodoPagoOriginal: "tarjeta",
      productoIds: actualCartItems.map(item => item.id.toString()),
      datosFiscales: currentFormData.necesitaFactura ? {
        documento: currentFormData.datosFiscales?.documento || "",
        tipoDocumento: currentFormData.datosFiscales?.tipoDocumento || "DNI",
        razonSocial: currentFormData.datosFiscales?.razonSocial,
        tipoFactura: currentFormData.datosFiscales?.tipoFactura || "B",
      } : undefined,
      trackingToken,
      trackingUrl,
      estadoHistorial: [{
        estado: estadoPedidoInicial,
        fecha: new Date().toISOString(),
        notas: "Pedido creado, esperando procesamiento de tarjeta por Brick"
      }]
    };

    console.log("BRICK SUBMIT - OrderData preparado:", orderData); // LOG 2
    console.log("BRICK SUBMIT - Datos que se enviarán a /api/mercadopago/process-card:", {
      token: formDataFromBrick.token, // Usar el token del Brick
      paymentMethodId: formDataFromBrick.payment_method_id,
      issuerId: formDataFromBrick.issuer_id,
      installments: formDataFromBrick.installments,
      orderInfo: orderData
    }); // LOG 3

    try {
      const paymentResponse = await fetch("/api/mercadopago/process-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: formDataFromBrick.token, // Usar el token del Brick
          paymentMethodId: formDataFromBrick.payment_method_id,
          issuerId: formDataFromBrick.issuer_id,
          installments: formDataFromBrick.installments,
          orderInfo: orderData
        }),
      });

      console.log("BRICK SUBMIT - Respuesta de /api/mercadopago/process-card:", paymentResponse.status); // LOG 4

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        console.error("BRICK SUBMIT - Error en backend:", errorData); // LOG 5
        throw new Error(errorData.error || "Error al procesar el pago con tarjeta.");
      }

      const paymentResult = await paymentResponse.json();
      console.log("BRICK SUBMIT - Resultado del pago:", paymentResult); // LOG 6

      setOrderDetails({ ...orderData, pedidoId: paymentResult.orderId || orderData.pedidoId, id: paymentResult.orderId });
      setCheckoutStatus("success");
      clearCart();
      // window.scrollTo({ top: 0, behavior: 'smooth' }); // Podrías querer esto después de éxito

    } catch (error) {
      console.error("Error en handleCardPaymentSubmit:", error);
      let errorMessage = "Ocurrió un error al procesar tu pago. Por favor, intenta nuevamente.";
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }
      setCheckoutStatus("error");
      alert(errorMessage);
    } finally {
      // No queremos resetear a "idle" si el pago fue exitoso o si ya está en error.
      // El estado de "success" o "error" debería persistir hasta que el usuario navegue.
       if (checkoutStatus === "processing") { // Si seguía procesando y no cambió a success/error
         setCheckoutStatus("idle");
       }
    }
  };

  // Manejar envío del formulario
  const onSubmit = async (data: CheckoutFormValues) => {
    console.error("CHECKOUT FORM SUBMIT - VALORES INICIALES:");
    console.error("- método de pago:", data.metodoPago);
    console.error("- todos los campos:", data);

    // Si el método de pago es "tarjeta", el CardPayment Brick se encarga.
    // El botón de submit principal está deshabilitado para "tarjeta",
    // por lo que esta función onSubmit no debería ejecutarse si "tarjeta" está seleccionada
    // y el usuario interactúa con el Brick.
    // Si por alguna razón llegara aquí con "tarjeta", no hacemos nada para evitar doble procesamiento.
    if (data.metodoPago === "tarjeta") {
      console.log("onSubmit: Método de pago es 'tarjeta'. El CardPayment Brick maneja esto. No se procesa aquí.");
      // Podrías querer cambiar el checkoutStatus a "processing" si el Brick aún no lo hizo,
      // pero es mejor que el Brick controle su propio estado.
      // setCheckoutStatus("processing"); // Considerar si es necesario
      return; // Importante: salir para no procesar como otros métodos
    }
    
    setCheckoutStatus("processing");
    setManualPaymentInfo(null); // Limpiar info de pago manual anterior
    
    try {
      if (actualCartItems.length === 0) {
        throw new Error("No hay productos en el carrito.");
      }
      
      const trackingToken = generateTrackingToken();
      const trackingUrl = generateTrackingUrl(trackingToken);
      
      let estadoPedidoInicial = "Pendiente de Pago";
      let metodoPagoParaApi = "";

      if (data.metodoPago === "efectivo") {
        estadoPedidoInicial = "Pendiente de Pago (Efectivo)";
        metodoPagoParaApi = "Efectivo al retirar";
      } else if (data.metodoPago === "transferencia") {
        estadoPedidoInicial = "Pendiente de Pago (Transferencia)";
        metodoPagoParaApi = "Transferencia Bancaria";
      } else if (data.metodoPago === "mercadopago") {
        estadoPedidoInicial = "Pendiente de Pago (Mercado Pago)";
        metodoPagoParaApi = "Mercado Pago";
      }

      const orderData = {
        pedidoId: `JCS-${new Date().getTime().toString().slice(-6)}`,
        fechaPedido: new Date().toISOString(),
        cliente: data.nombre,
        emailCliente: data.email,
        telefonoCliente: data.telefono,
        direccionEnvio: data.direccion,
        ciudadEnvio: data.ciudad,
        cpEnvio: data.codigoPostal,
        notasAdicionales: data.notas,
        subtotal: actualTotalPrice,
        costoEnvio: envioPrice,
        totalPedido: total,
        detalleProductosTexto: getProductDetailsText(),
        estadoPedido: estadoPedidoInicial,
        metodoPago: metodoPagoParaApi,
        metodoPagoOriginal: data.metodoPago,
        productoIds: actualCartItems.map(item => item.id.toString()),
        datosFiscales: data.necesitaFactura ? {
          documento: data.datosFiscales?.documento || "",
          tipoDocumento: data.datosFiscales?.tipoDocumento || "DNI",
          razonSocial: data.datosFiscales?.razonSocial,
          tipoFactura: data.datosFiscales?.tipoFactura || "B",
        } : undefined,
        trackingToken,
        trackingUrl,
        estadoHistorial: [{
          estado: estadoPedidoInicial,
          fecha: new Date().toISOString(),
          notas: "Pedido creado"
        }]
      };
      
      console.log("Checkout - Enviando pedido a la API:", orderData.pedidoId, "Método:", data.metodoPago);
      
      let response;
      let attemptOrder = 0;
      const maxOrderAttempts = 2;
      
      while (attemptOrder < maxOrderAttempts && !response) {
        attemptOrder++;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
        } catch (fetchError) {
          console.error(`Error en intento ${attemptOrder}/${maxOrderAttempts} al enviar pedido:`, fetchError);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.error("Timeout al enviar pedido a la API");
          }
          if (attemptOrder >= maxOrderAttempts) {
            throw new Error("No se pudo conectar con el servidor para crear el pedido. Por favor, verifica tu conexión e intenta nuevamente.");
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (!response) throw new Error("No se pudo establecer conexión con el servidor.");
      
      if (!response.ok) {
        let errorMessage = "Error al procesar el pedido";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorMessage;
        } catch (e) { console.error("No se pudo parsear la respuesta de error:", e); }
        throw new Error(errorMessage);
      }
      
      const result = await response.json(); 
      console.log("Pedido creado en backend, ID Notion (si aplica):", result.order?.id, "Pedido ID local:", orderData.pedidoId);

      // --- Lógica específica por método de pago ---
      if (data.metodoPago === "mercadopago") {
        console.log("🟢🟢🟢 ENTRANDO EN FLUJO MERCADOPAGO 🟢🟢🟢");
        
        const mercadoPagoData = {
          items: actualCartItems.map(item => ({
            id: item.id.toString(),
            title: item.name,
            description: "Producto",
            picture_url: item.imageUrl || "https://placehold.co/100",
            quantity: item.quantity,
            unit_price: item.price,
            currency_id: 'ARS'
          })),
          payer: {
            name: data.nombre,
            email: data.email,
            phone: { area_code: "", number: data.telefono },
            address: { street_name: data.direccion, zip_code: data.codigoPostal }
          },
          back_url: {
            success: `${window.location.origin}/confirmacion?status=success&order_id=${orderData.pedidoId}`,
            failure: `${window.location.origin}/confirmacion?status=failure&order_id=${orderData.pedidoId}`,
            pending: `${window.location.origin}/confirmacion?status=pending&order_id=${orderData.pedidoId}`,
          },
          external_reference: orderData.pedidoId,
          notification_url: process.env.NEXT_PUBLIC_SITE_URL
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/mercadopago/webhook`
            : undefined,
        };
        
        console.log("CHECKOUT: Datos para enviar a /api/mercadopago:", JSON.stringify(mercadoPagoData, null, 2));
        
        let mpResult = null;
        let attempts = 0;
        const maxAttemptsMP = 3;
        
        while (attempts < maxAttemptsMP && !mpResult) {
          attempts++;
          try {
            const controller = new AbortController();
            const timeoutMs = 15000 + (attempts * 5000);
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            
            console.log(`CHECKOUT: Intento ${attempts}/${maxAttemptsMP} para /api/mercadopago con timeout de ${timeoutMs}ms`);
            
            const mpResponse = await fetch("/api/mercadopago", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(mercadoPagoData),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log("CHECKOUT: Respuesta de /api/mercadopago recibida, status:", mpResponse.status);
            
            if (!mpResponse.ok) {
              const errorText = await mpResponse.text();
              console.error(`CHECKOUT: Error en mpResponse (Intento ${attempts}/${maxAttemptsMP}):`, mpResponse.status, errorText);
              if (mpResponse.status === 401) {
                 alert("Error de autorización con Mercado Pago. Por favor, contacte al administrador del sitio.");
                 throw new Error("Error 401: Credenciales de Mercado Pago inválidas");
              }
              if (attempts < maxAttemptsMP) {
                await new Promise(resolve => setTimeout(resolve, attempts * 1000));
                continue;
              }
              throw new Error(`Error ${mpResponse.status}: ${errorText}`);
            }
            
            mpResult = await mpResponse.json();
            console.log("CHECKOUT: Respuesta JSON de /api/mercadopago (mpResult):", mpResult);
            
            if (mpResult && mpResult.initPoint) {
              console.log("CHECKOUT: Redirigiendo a Mercado Pago init_point:", mpResult.initPoint);
              localStorage.setItem("mp_pending_order", JSON.stringify({
                orderId: orderData.pedidoId,
                preferenceId: mpResult.preferenceId,
                timestamp: Date.now()
              }));
              window.location.href = mpResult.initPoint;
              return; 
            } else {
              console.error("CHECKOUT: NO SE RECIBIÓ initPoint de /api/mercadopago. Respuesta:", mpResult);
              throw new Error("No se recibió initPoint para Mercado Pago de la API.");
            }
          } catch (fetchError) {
            console.error(`CHECKOUT: Error en fetch de MP (Intento ${attempts}/${maxAttemptsMP}):`, fetchError);
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
              console.error(`CHECKOUT: Timeout de MP excedido`);
              if (attempts < maxAttemptsMP) continue;
            }
            if (attempts >= maxAttemptsMP) throw fetchError;
          }
        }
        throw new Error("No se pudo iniciar el proceso de pago con Mercado Pago después de varios intentos.");

      } else if (data.metodoPago === "efectivo" || data.metodoPago === "transferencia") {
        console.log(`CHECKOUT: Método de pago es ${data.metodoPago}. Mostrando confirmación directa.`);
        
        const confirmedOrderDetails = result.order || { ...orderData, id: result.id };

        setOrderDetails(confirmedOrderDetails);
        setManualPaymentInfo({
          metodo: data.metodoPago,
          instrucciones: data.metodoPago === 'efectivo' 
            ? 'Por favor, dirígete al local para abonar y retirar tu pedido. ¡Gracias!' 
            : 'Te enviaremos los datos bancarios por email para completar la transferencia. Revisa tu correo (incluida la carpeta de spam). ¡Gracias!'
        });
        setCheckoutStatus("success");
        clearCart();
      }
    } catch (error) {
      console.error("Error en el checkout:", error);
      let errorMessage = "Ocurrió un error al procesar tu pedido. Por favor, intenta nuevamente.";
      if (error instanceof Error) {
        if (error.message.includes("No se pudo conectar") || error.message.includes("Failed to fetch")) {
          errorMessage = "No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e intenta nuevamente.";
        } else if (error.message.includes("Error al crear el pedido en Notion") || 
                  error.message.includes("cliente") ||
                  error.message.includes("clientes") ||
                  error.message.includes("base de datos")) {
          errorMessage = "Error en la configuración de la tienda. Por favor contacta al administrador.";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      setCheckoutStatus("error");
      alert(errorMessage);
    } finally {
      if (checkoutStatus !== "success" && !(data.metodoPago === "mercadopago" && window.location.href.includes("mercadopago.com"))) {
         setCheckoutStatus("idle");
      }
    }
  };
  
  useEffect(() => {
    // Para evitar que el metodoPago se resetee
    const metodoPagoWatcher = form.watch("metodoPago", "mercadopago");
    console.log("CAMBIO EN MÉTODO DE PAGO detectado:", metodoPagoWatcher);

    return () => {
      // Cleanup del watcher
    };
  }, [form]);
  
  // Función específica para cambiar el método de pago
  const handlePaymentMethodChange = (method: "efectivo" | "transferencia" | "mercadopago" | "tarjeta") => {
    console.log(`Cambiando método de pago a: ${method}`);
    setSelectedPaymentMethod(method);
    form.setValue("metodoPago", method, { shouldValidate: true });
  };
  
  if (checkoutStatus === "success" && orderDetails) {
    return (
      <div className="rounded-lg border p-6 bg-white">
        <div className="text-center mb-6">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">¡Pedido {manualPaymentInfo ? 'registrado' : 'recibido'}!</h2>
          <p className="text-gray-600 mt-1">
            {manualPaymentInfo 
              ? manualPaymentInfo.instrucciones
              : 'Tu pedido ha sido procesado y te hemos enviado un email de confirmación.'}
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <p className="text-sm text-gray-600 mb-2">Número de pedido: <span className="font-semibold">{orderDetails.pedidoId}</span></p>
          {orderDetails.trackingUrl && (
            <>
              <p className="text-sm text-gray-600">Puedes seguir el estado de tu pedido en cualquier momento con el siguiente enlace:</p>
              <a 
                href={orderDetails.trackingUrl} 
                className="block w-full mt-2 text-center bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver estado de mi pedido
              </a>
            </>
          )}
          {!manualPaymentInfo && orderDetails.metodoPagoOriginal !== 'mercadopago' && (
             <p className="text-xs text-gray-500 mt-2 text-center">También te hemos enviado un correo con la confirmación y el enlace de seguimiento.</p>
          )}
           {manualPaymentInfo && manualPaymentInfo.metodo === 'transferencia' && (
             <p className="text-xs text-gray-500 mt-2 text-center">Recuerda revisar tu email para los datos de la transferencia.</p>
           )}
        </div>
        
        <div className="text-center">
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Volver a la tienda
          </Button>
        </div>
      </div>
    );
  }
  
  if (checkoutStatus === "processing" && 
      (form.getValues("metodoPago") === "mercadopago" || form.getValues("metodoPago") === "tarjeta")) { // MODIFICADO
    return <MercadoPagoLoading />;
  }
  
  return (
    <div className="rounded-lg border p-6 bg-white">
      <h2 className="text-xl font-semibold mb-4">Información de contacto y envío</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Datos personales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo*</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email*</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono*</FormLabel>
                  <FormControl>
                    <Input placeholder="11 1234-5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Dirección */}
          <FormField
            control={form.control}
            name="direccion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección*</FormLabel>
                <FormControl>
                  <Input placeholder="Calle, número, piso, depto." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ciudad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad*</FormLabel>
                  <FormControl>
                    <Input placeholder="Ciudad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="codigoPostal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Postal*</FormLabel>
                  <FormControl>
                    <Input placeholder="CP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="notas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas adicionales</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Indicaciones para la entrega, horarios, etc."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Separator className="my-6" />
          
          {/* Facturación */}
          <div>
            <FormField
              control={form.control}
              name="necesitaFactura"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Necesito factura</FormLabel>
                    <FormDescription className="text-xs">
                      Marca esta opción si necesitas factura A, B o C
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {watchNecesitaFactura && (
              <div className="bg-gray-50 p-4 rounded-md space-y-4 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="datosFiscales.tipoDocumento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de documento*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DNI">DNI</SelectItem>
                            <SelectItem value="CUIT">CUIT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="datosFiscales.documento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de documento*</FormLabel>
                        <FormControl>
                          <Input placeholder="Sin puntos ni guiones" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="datosFiscales.tipoFactura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de factura*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">Factura A</SelectItem>
                          <SelectItem value="B">Factura B</SelectItem>
                          <SelectItem value="C">Factura C</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("datosFiscales.tipoDocumento") === "CUIT" && (
                  <FormField
                    control={form.control}
                    name="datosFiscales.razonSocial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razón Social</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de la empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
          </div>
          
          <Separator className="my-6" />
          
          {/* Método de pago */}
          <div>
            <h3 className="text-lg font-medium mb-3">Método de pago</h3>
            
            <FormField
              control={form.control}
              name="metodoPago"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Método de Pago</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        console.log("RadioGroup value changed to:", value);
                        field.onChange(value);
                        // Forzar actualización del valor
                        setTimeout(() => {
                          console.log("Valor después del timeout:", form.getValues("metodoPago"));
                        }, 100);
                      }}
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      {/* Mercado Pago */}
                      <div 
                        className={`flex items-center space-x-2 border rounded-md p-4 transition-colors cursor-pointer ${field.value === "mercadopago" ? "bg-red-50 border-red-300" : "hover:bg-gray-50"}`}
                        onClick={() => handlePaymentMethodChange("mercadopago")}
                      >
                        <RadioGroupItem value="mercadopago" id="metodoPago-mercadopago" className="h-5 w-5 text-red-600" />
                        <label htmlFor="metodoPago-mercadopago" className="flex flex-1 items-center cursor-pointer">
                          <span className="text-sm font-medium text-gray-900">Mercado Pago (Serás redirigido)</span>
                          <span className="ml-auto">
                            <img src="https://www.mercadopago.com/org-img/MP3/API/logos/mp-logo.svg" alt="Mercado Pago" className="h-6" />
                          </span>
                        </label>
                      </div>
                      
                      {/* Tarjeta de Crédito/Débito (Deshabilitada con Mensaje) */}
                      <div 
                        className={`flex items-center space-x-2 border rounded-md p-4 transition-colors cursor-pointer ${field.value === "tarjeta" ? "bg-red-50 border-red-300" : "hover:bg-gray-50 opacity-50"}`}
                        onClick={() => {
                          console.log("Opción 'Tarjeta' clickeada, se mostrará alerta.");
                          alert("Para abonar con tarjeta de crédito o débito, por favor, selecciona la opción 'Mercado Pago'. Serás redirigido de forma segura.");
                        }}
                      >
                        {/* Usamos un input de radio visualmente similar pero que no cambia el estado del formulario */}
                        <div className="h-5 w-5 border border-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          {field.value === "tarjeta" && (<div className="h-2.5 w-2.5 bg-red-600 rounded-full"></div>)}
                        </div>
                        <label className="flex flex-1 items-center cursor-pointer">
                          <span className="text-sm font-medium text-gray-900">Tarjeta de Crédito/Débito</span> 
                          <span className="text-xs text-gray-500 ml-1">(Usar opción Mercado Pago)</span>
                        </label>
                      </div>
                      
                      {/* Transferencia */}
                      <div 
                        className={`flex items-center space-x-2 border rounded-md p-4 transition-colors cursor-pointer ${field.value === "transferencia" ? "bg-red-50 border-red-300" : "hover:bg-gray-50"}`}
                        onClick={() => handlePaymentMethodChange("transferencia")}
                      >
                        <RadioGroupItem value="transferencia" id="metodoPago-transferencia" className="h-5 w-5 text-red-600" />
                        <label htmlFor="metodoPago-transferencia" className="flex flex-1 items-center cursor-pointer">
                          <span className="text-sm font-medium text-gray-900">Transferencia Bancaria</span>
                        </label>
                      </div>
                      
                      {/* Efectivo */}
                      <div 
                        className={`flex items-center space-x-2 border rounded-md p-4 transition-colors cursor-pointer ${field.value === "efectivo" ? "bg-red-50 border-red-300" : "hover:bg-gray-50"}`}
                        onClick={() => handlePaymentMethodChange("efectivo")}
                      >
                        <RadioGroupItem value="efectivo" id="metodoPago-efectivo" className="h-5 w-5 text-red-600" />
                        <label htmlFor="metodoPago-efectivo" className="flex flex-1 items-center cursor-pointer">
                          <span className="text-sm font-medium text-gray-900">Efectivo al retirar</span>
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* NUEVO: Renderizar el CardPayment Brick si "tarjeta" está seleccionado */}
            {(form.watch("metodoPago") === "tarjeta" || selectedPaymentMethod === "tarjeta") && actualCartItems.length > 0 && (
              <div className="mt-4 border rounded-md p-4 bg-gray-50">
                <h4 className="text-md font-medium mb-3">Completa los datos de tu tarjeta</h4>
                <CardPayment
                  initialization={{
                    amount: total,
                  }}
                  customization={{
                    visual: {
                      style: {
                        theme: 'default'
                      }
                    }
                  }}
                  onSubmit={handleCardPaymentSubmit}
                  onError={(error) => {
                    console.error("Error en CardPayment Brick:", error);
                    alert("Error al cargar el formulario de pago: " + (error.message || "Verifica tu conexión"));
                    setCheckoutStatus("idle");
                  }}
                  onReady={() => { 
                    console.log("CardPayment Brick listo para usar"); 
                    setCheckoutStatus("idle");
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">Si no ves el formulario de pago, intenta recargar la página o usar otro método de pago.</p>
              </div>
            )}
          </div>
          
          <Separator className="my-6" />
          
          {/* Resumen del pedido */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-3">Resumen del pedido</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${actualTotalPrice.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span>${envioPrice.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total</span>
                <span>${total.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>
          
          {/* Botón de envío */}
          <Button 
            type={ (selectedPaymentMethod === "tarjeta" || form.watch("metodoPago") === "tarjeta") ? "button" : "submit" } 
            className="w-full py-6 text-lg bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              if ( (selectedPaymentMethod === "tarjeta" || form.watch("metodoPago") === "tarjeta") ) {
                // No hacer nada si es tarjeta, el Brick se encarga.
                // El formulario del Brick debe ser enviado por el usuario (generalmente tiene su propio botón o se activa al completar)
                console.log("Botón principal clickeado con método TARJETA. El Brick debe manejar el submit.");
              } else {
                // Si no es tarjeta, permitir que el form.handleSubmit(onSubmit) se ejecute (si type es submit)
                // o llamar manualmente si es necesario (aunque type="submit" debería bastar)
                 form.handleSubmit(onSubmit)();
              }
            }}
            // Deshabilitar si está procesando (para otros métodos) o si es tarjeta (ya que el Brick tiene su propio flujo)
            disabled={checkoutStatus === "processing" || (selectedPaymentMethod === "tarjeta" || form.watch("metodoPago") === "tarjeta")}
          >
            {checkoutStatus === "processing" && (selectedPaymentMethod !== "tarjeta" && form.watch("metodoPago") !== "tarjeta") && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {(selectedPaymentMethod === "tarjeta" || form.watch("metodoPago") === "tarjeta") 
              ? "Completa los datos de la tarjeta arriba" 
              : checkoutStatus === "processing" 
                ? "Procesando..." 
                : "Finalizar compra"}
          </Button>
          
          {checkoutStatus === "error" && (
            <p className="text-red-500 text-center mt-2">
              Ocurrió un error al procesar tu pedido. Por favor, intenta nuevamente.
            </p>
          )}
          
          <p className="text-xs text-gray-500 text-center mt-4">
            Al finalizar la compra, aceptas nuestros Términos y Condiciones y Política de Privacidad.
          </p>
        </form>
      </Form>
    </div>
  );
} 