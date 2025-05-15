import { Client } from "@notionhq/client";
import { Product, OrderDetails } from "@/components/types"; // Vamos a crear este archivo de tipos a continuación
import { generateTrackingToken, generateTrackingUrl } from "./utils";

// Inicializar cliente Notion
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Asegurarnos de que el ID no tenga comillas extras
const databaseId = process.env.NOTION_DATABASE_ID_PRODUCTS ? 
  process.env.NOTION_DATABASE_ID_PRODUCTS.replace(/"/g, '') : undefined;

// Base de datos de pedidos
const ordersDatabaseId = process.env.NOTION_DATABASE_ID_ORDERS ? 
  process.env.NOTION_DATABASE_ID_ORDERS.replace(/"/g, '') : undefined;

/**
 * Convierte un objeto de Notion a nuestro modelo de Producto
 */
export const convertNotionPageToProduct = (page: any): Product => {
  const properties = page.properties;
  
  // Extraer propiedades del objeto de Notion
  const id = page.id;
  const name = properties.Name?.title?.[0]?.text?.content || "Sin nombre";
  const idOrigen = properties.ID_Origen?.rich_text?.[0]?.text?.content || "";
  const price = properties.Price?.number || 0;
  
  // Extraer la opción seleccionada o usar un valor predeterminado
  const category = properties.Category?.select?.name || "accesorio";
  const brand = properties.Brand?.select?.name || "Otros";
  
  const description = properties.Description?.rich_text?.[0]?.text?.content || "";
  const rating = properties.Rating?.number || 0;
  const reviewCount = properties.ReviewsCount?.number || 0;
  const activo = properties.Activo?.checkbox !== false;
  
  // Parsear JSON de especificaciones
  let specs = {};
  try {
    const specsJson = properties.Specs_JSON?.rich_text?.[0]?.text?.content || "{}";
    specs = JSON.parse(specsJson);
  } catch (e) {
    console.error("Error parsing product specs:", e);
  }
  
  // Parsear JSON de URLs de imágenes
  let imageUrls: string[] = [];
  try {
    const imageUrlsJson = properties.ImageUrls_JSON?.rich_text?.[0]?.text?.content || "[]";
    imageUrls = JSON.parse(imageUrlsJson);
  } catch (e) {
    console.error("Error parsing product image URLs:", e);
    imageUrls = [];
  }
  
  return {
    id,
    name,
    description,
    price,
    imageUrls,
    category,
    specs,
    rating,
    reviewCount,
    brand,
    active: activo,
    idOrigen: idOrigen,
  };
};

/**
 * Obtiene todos los productos activos desde Notion
 */
export const getActiveProducts = async (): Promise<Product[]> => {
  if (!databaseId) {
    console.error("NOTION_DATABASE_ID_PRODUCTS no está definido");
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId.trim(),
      filter: {
        property: "Activo",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "Name",
          direction: "ascending",
        },
      ],
      page_size: 100, // Máximo de páginas por consulta
    });

    const products = response.results.map(convertNotionPageToProduct);
    
    return products;
  } catch (error) {
    console.error("Error fetching products from Notion:", error);
    return [];
  }
};

/**
 * Obtiene todos los productos desde Notion
 */
export const getAllProducts = async (): Promise<Product[]> => {
  if (!databaseId) {
    console.error("NOTION_DATABASE_ID_PRODUCTS no está definido");
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId.trim(),
      sorts: [
        {
          property: "Name",
          direction: "ascending",
        },
      ],
      page_size: 100, // Máximo de páginas por consulta
    });

    const products = response.results.map(convertNotionPageToProduct);
    
    return products;
  } catch (error) {
    console.error("Error fetching products from Notion:", error);
    return [];
  }
};

/**
 * Actualiza un producto en Notion
 */
export const updateProduct = async (product: Product): Promise<boolean> => {
  if (!product.id) {
    console.error("Product ID is required for update");
    return false;
  }

  try {
    await notion.pages.update({
      page_id: typeof product.id === 'string' ? product.id : String(product.id),
      properties: {
        Name: {
          title: [
            {
              text: {
                content: product.name || "Sin nombre"
              }
            }
          ]
        },
        Price: {
          number: Number(product.price) || 0
        },
        Category: {
          select: {
            name: product.category || "accesorio"
          }
        },
        Brand: {
          select: {
            name: product.brand || "Otros"
          }
        },
        Description: {
          rich_text: [
            {
              text: {
                content: product.description || ""
              }
            }
          ]
        },
        Specs_JSON: {
          rich_text: [
            {
              text: {
                content: JSON.stringify(product.specs || {})
              }
            }
          ]
        },
        Rating: {
          number: Number(product.rating) || 0
        },
        ReviewsCount: {
          number: Number(product.reviewCount) || 0
        },
        ImageUrls_JSON: {
          rich_text: [
            {
              text: {
                content: JSON.stringify(product.imageUrls || [])
              }
            }
          ]
        },
        Activo: {
          checkbox: product.active !== false
        }
      }
    });

    return true;
  } catch (error) {
    console.error("Error updating product in Notion:", error);
    return false;
  }
};

/**
 * Crea un nuevo producto en Notion
 */
export const createProduct = async (product: Omit<Product, 'id'>): Promise<Product | null> => {
  if (!databaseId) {
    console.error("NOTION_DATABASE_ID_PRODUCTS no está definido");
    return null;
  }

  try {
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId.trim(),
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: product.name || "Sin nombre"
              }
            }
          ]
        },
        Price: {
          number: Number(product.price) || 0
        },
        Category: {
          select: {
            name: product.category || "accesorio"
          }
        },
        Brand: {
          select: {
            name: product.brand || "Otros"
          }
        },
        Description: {
          rich_text: [
            {
              text: {
                content: product.description || ""
              }
            }
          ]
        },
        Specs_JSON: {
          rich_text: [
            {
              text: {
                content: JSON.stringify(product.specs || {})
              }
            }
          ]
        },
        Rating: {
          number: Number(product.rating) || 0
        },
        ReviewsCount: {
          number: Number(product.reviewCount) || 0
        },
        ImageUrls_JSON: {
          rich_text: [
            {
              text: {
                content: JSON.stringify(product.imageUrls || [])
              }
            }
          ]
        },
        Activo: {
          checkbox: true
        }
      }
    });

    return convertNotionPageToProduct(response);
  } catch (error) {
    console.error("Error creating product in Notion:", error);
    return null;
  }
};

/**
 * Archiva (elimina lógicamente) un producto en Notion
 */
export const deleteProduct = async (id: string | number): Promise<boolean> => {
  try {
    await notion.pages.update({
      page_id: String(id),
      archived: true,      // ← esto lo quita de la BD
    });
    return true;
  } catch (err) {
    console.error('Error deleting product in Notion:', err);
    return false;
  }
};

/**
 * Obtiene todos los productos de Notion utilizando paginación
 * para superar el límite de 100 registros
 */
export const fetchAllPages = async (includeInactive = false): Promise<Product[]> => {
  if (!databaseId) {
    console.error("NOTION_DATABASE_ID_PRODUCTS no está definido");
    return [];
  }

  let allProducts: Product[] = [];
  let hasMore = true;
  let startCursor: string | undefined = undefined;

  try {
    while (hasMore) {
      // Preparar la consulta base
      const queryParams: any = {
        database_id: databaseId.trim(),
        sorts: [
          {
            property: "Name",
            direction: "ascending",
          },
        ],
        page_size: 100,
      };

      // Agregar cursor si no es la primera página
      if (startCursor) {
        queryParams.start_cursor = startCursor;
      }

      // Aplicar filtro de activos si es necesario
      if (!includeInactive) {
        queryParams.filter = {
          property: "Activo",
          checkbox: {
            equals: true,
          },
        };
      }

      // Ejecutar consulta
      const response = await notion.databases.query(queryParams);
      
      // Convertir y agregar productos a la lista total
      const pageProducts = response.results.map(convertNotionPageToProduct);
      allProducts = [...allProducts, ...pageProducts];
      
      // Verificar si hay más páginas
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
      
      console.log(`Obtenidos ${pageProducts.length} productos. Total: ${allProducts.length}. Hay más: ${hasMore}`);
    }

    return allProducts;
  } catch (error) {
    console.error("Error fetching all products from Notion:", error);
    return allProducts; // Devolvemos los productos que hayamos conseguido obtener
  }
};

/**
 * Crea un nuevo pedido en Notion
 */
export const createOrderInNotion = async (orderDetails: OrderDetails): Promise<any | null> => {
  if (!ordersDatabaseId) {
    console.error("NOTION_DATABASE_ID_ORDERS no está definido");
    return null;
  }

  try {
    console.log("Creando pedido en Notion:", orderDetails.pedidoId);
    
    // Generar token de seguimiento si no existe
    if (!orderDetails.trackingToken) {
      orderDetails.trackingToken = generateTrackingToken();
      orderDetails.trackingUrl = generateTrackingUrl(orderDetails.trackingToken);
    }

    // Formatear la propiedad relacionada para productos
    let relationProperty = {};
    if (orderDetails.productoIds && orderDetails.productoIds.length > 0) {
      relationProperty = {
        ProductosRelacionados: {
          relation: orderDetails.productoIds.map(id => ({
            id: id
          }))
        }
      };
    }

    // Inicializar historial de estado si no existe
    if (!orderDetails.estadoHistorial) {
      orderDetails.estadoHistorial = [{
        estado: orderDetails.estadoPedido,
        fecha: new Date().toISOString(),
        notas: "Pedido creado"
      }];
    }

    // Verificar la estructura de la base de datos primero
    try {
      const databaseInfo = await notion.databases.retrieve({
        database_id: ordersDatabaseId.trim()
      });
      
      console.log("Estructura de la base de datos Notion obtenida:", 
          Object.keys(databaseInfo.properties).join(", "));
      
      // Analizar si existe el campo 'cliente' o 'clientes'
      const hasClientField = "cliente" in databaseInfo.properties;
      const hasClientsField = "clientes" in databaseInfo.properties;
      
      console.log(`Campo 'cliente' existe: ${hasClientField}, Campo 'clientes' existe: ${hasClientsField}`);
      
      // Propiedades que siempre deben existir en la base de datos
      const baseProperties: any = {
        pedidoId: {
          title: [
            {
              text: {
                content: orderDetails.pedidoId
              }
            }
          ]
        },
        fechaPedido: {
          date: {
            start: orderDetails.fechaPedido
          }
        },
        // Para el campo cliente/clientes, usamos el que existe en la BD
        ...(hasClientsField ? {
          clientes: {
            rich_text: [
              {
                text: {
                  content: orderDetails.cliente
                }
              }
            ]
          }
        } : hasClientField ? {
          cliente: {
            rich_text: [
              {
                text: {
                  content: orderDetails.cliente
                }
              }
            ]
          }
        } : {
          // Si ninguno existe, intentamos ambos (uno fallará silenciosamente)
          clientes: {
            rich_text: [
              {
                text: {
                  content: orderDetails.cliente
                }
              }
            ]
          },
          cliente: {
            rich_text: [
              {
                text: {
                  content: orderDetails.cliente
                }
              }
            ]
          }
        }),
        emailCliente: {
          email: orderDetails.emailCliente
        }
      };
      
      // Verificamos si existen los demás campos requeridos
      if ("estadoPedido" in databaseInfo.properties) {
        baseProperties.estadoPedido = {
          select: {
            name: orderDetails.estadoPedido
          }
        };
      }
      
      if ("metodoPago" in databaseInfo.properties) {
        baseProperties.metodoPago = {
          select: {
            name: orderDetails.metodoPago
          }
        };
      }
      
      // Propiedades adicionales que podrían no existir
      const optionalProperties: any = {};
      
      // Solo agregamos propiedades si existen en la base de datos
      const addPropertyIfExists = (notionKey: string, value: any) => {
        if (notionKey in databaseInfo.properties) {
          optionalProperties[notionKey] = value;
        }
      };
      
      // Añadir propiedades solo si existen en la base de datos
      if (orderDetails.telefonoCliente) {
        addPropertyIfExists("telefonoCliente", {
          phone_number: orderDetails.telefonoCliente
        });
      }
      
      if (orderDetails.direccionEnvio) {
        addPropertyIfExists("direccionEnvio", {
          rich_text: [{ text: { content: orderDetails.direccionEnvio } }]
        });
      }
      
      if (orderDetails.ciudadEnvio) {
        addPropertyIfExists("ciudadEnvio", {
          rich_text: [{ text: { content: orderDetails.ciudadEnvio } }]
        });
      }
      
      if (orderDetails.cpEnvio) {
        addPropertyIfExists("cpEnvio", {
          rich_text: [{ text: { content: orderDetails.cpEnvio } }]
        });
      }
      
      if (orderDetails.notasAdicionales) {
        addPropertyIfExists("notasAdicionales", {
          rich_text: [{ text: { content: orderDetails.notasAdicionales } }]
        });
      }
      
      if (typeof orderDetails.subtotal === 'number') {
        addPropertyIfExists("subtotal", {
          number: orderDetails.subtotal
        });
      }
      
      if (typeof orderDetails.costoEnvio === 'number') {
        addPropertyIfExists("costoEnvio", {
          number: orderDetails.costoEnvio
        });
      }
      
      if (orderDetails.detalleProductosTexto) {
        addPropertyIfExists("detalleProductosTexto", {
          rich_text: [{ text: { content: orderDetails.detalleProductosTexto } }]
        });
      }
      
      // Campos de seguimiento
      if (orderDetails.trackingToken) {
        addPropertyIfExists("trackingToken", {
          rich_text: [{ text: { content: orderDetails.trackingToken } }]
        });
      }
      
      if (orderDetails.trackingUrl) {
        addPropertyIfExists("trackingUrl", {
          url: orderDetails.trackingUrl
        });
      }
      
      // Historial de estado como JSON string
      if (orderDetails.estadoHistorial && Array.isArray(orderDetails.estadoHistorial)) {
        addPropertyIfExists("estadoHistorial", {
          rich_text: [{ text: { content: JSON.stringify(orderDetails.estadoHistorial) } }]
        });
      } else if (orderDetails.estadoHistorial) {
         // Si no es array pero existe, loguearlo y enviarlo como texto simple para no romper el flujo
         console.warn("estadoHistorial no es un array, enviando como texto simple:", orderDetails.estadoHistorial);
         addPropertyIfExists("estadoHistorial", {
           rich_text: [{ text: { content: String(orderDetails.estadoHistorial) } }]
         });
      }

      // Datos fiscales (si existen)
      if (orderDetails.datosFiscales) {
        if (orderDetails.datosFiscales.tipoDocumento) {
          addPropertyIfExists("tipoDocumento", {
            select: { name: orderDetails.datosFiscales.tipoDocumento }
          });
        }
        if (orderDetails.datosFiscales.documento) {
          addPropertyIfExists("documentoCliente", {
            rich_text: [{ text: { content: orderDetails.datosFiscales.documento } }]
          });
        }
        if (orderDetails.datosFiscales.tipoFactura) {
          addPropertyIfExists("tipoFactura", {
            select: { name: orderDetails.datosFiscales.tipoFactura }
          });
        }
        if (orderDetails.datosFiscales.razonSocial) {
          addPropertyIfExists("razonSocial", {
            rich_text: [{ text: { content: orderDetails.datosFiscales.razonSocial } }]
          });
        }
      }
      
      const allProperties = { ...baseProperties, ...optionalProperties, ...relationProperty }; 
      
      console.log("Creando página en Notion con las siguientes PROPIEDADES COMPLETAS:", JSON.stringify(allProperties, null, 2));
      
      const response = await notion.pages.create({
        parent: { database_id: ordersDatabaseId.trim() },
        properties: allProperties
      });

      console.log("Pedido creado en Notion:", response.id);
      return response;
    } catch (dbError) {
      console.error("Error detallado al interactuar con la base de datos de Notion:", dbError);
      return null;
    }
  } catch (error) {
    console.error("Error general al crear pedido en Notion:", error);
    return null;
  }
};

/**
 * Convierte un objeto de Notion a nuestro modelo de Pedido
 */
export const convertNotionPageToOrder = (page: any): any => {
  const properties = page.properties;
  
  // Extraer propiedades del objeto de Notion
  const id = page.id;
  const pedidoId = properties.pedidoId?.title?.[0]?.text?.content || "";
  const fechaPedido = properties.fechaPedido?.date?.start || "";
  
  // Cliente y detalles de contacto
  const cliente = properties.clientes?.rich_text?.[0]?.text?.content || "";
  const emailCliente = properties.emailCliente?.email || "";
  const telefonoCliente = properties.telefonoCliente?.phone_number || "";
  
  // Dirección de entrega
  const direccionEnvio = properties.direccionEnvio?.rich_text?.[0]?.text?.content || "";
  const ciudadEnvio = properties.ciudadEnvio?.rich_text?.[0]?.text?.content || "";
  const cpEnvio = properties.cpEnvio?.rich_text?.[0]?.text?.content || "";
  const notasAdicionales = properties.notasAdicionales?.rich_text?.[0]?.text?.content || "";
  
  // Detalles financieros
  const subtotal = properties.subtotal?.number || 0;
  const costoEnvio = properties.costoEnvio?.number || 0;
  const totalPedido = properties.totalPedido?.formula?.number || subtotal + costoEnvio;
  
  // Otros detalles
  const detalleProductosTexto = properties.detalleProductosTexto?.rich_text?.[0]?.text?.content || "";
  const estadoPedido = properties.estadoPedido?.select?.name || "Pendiente de Pago";
  const metodoPago = properties.metodoPago?.select?.name || "";
  
  // Campos de seguimiento
  const trackingToken = properties.trackingToken?.rich_text?.[0]?.text?.content || "";
  const trackingUrl = properties.trackingUrl?.url || "";

  // Historial de estados
  let estadoHistorial = [];
  try {
    const historialJson = properties.estadoHistorial?.rich_text?.[0]?.text?.content || "[]";
    estadoHistorial = JSON.parse(historialJson);
  } catch (error) {
    console.error("Error al parsear historial de estados:", error);
  }

  // Detalles de empresa de envío
  const codigoSeguimiento = properties.codigoSeguimiento?.rich_text?.[0]?.text?.content || "";
  const empresaEnvio = properties.empresaEnvio?.select?.name || "";
  
  // Relaciones (productos relacionados)
  const productosRelacionados = properties.ProductosRelacionados?.relation || [];
  const productoIds = productosRelacionados.map((relation: any) => relation.id);
  
  return {
    id,
    pedidoId,
    fechaPedido,
    cliente,
    emailCliente,
    telefonoCliente,
    direccionEnvio,
    ciudadEnvio,
    cpEnvio,
    notasAdicionales,
    subtotal,
    costoEnvio,
    totalPedido,
    detalleProductosTexto,
    estadoPedido,
    metodoPago,
    productoIds,
    // Campos de seguimiento
    trackingToken,
    trackingUrl,
    estadoHistorial,
    codigoSeguimiento,
    empresaEnvio
  };
};

/**
 * Obtiene todos los pedidos desde Notion
 */
export const getAllOrders = async (): Promise<any[]> => {
  if (!ordersDatabaseId) {
    console.error("NOTION_DATABASE_ID_ORDERS no está definido");
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: ordersDatabaseId.trim(),
      sorts: [
        {
          property: "fechaPedido",
          direction: "descending",
        },
      ],
      page_size: 100,
    });

    const orders = response.results.map(convertNotionPageToOrder);
    
    return orders;
  } catch (error) {
    console.error("Error fetching orders from Notion:", error);
    return [];
  }
};

/**
 * Obtiene un pedido específico por su token de seguimiento
 */
export const getOrderByTrackingToken = async (token: string): Promise<any | null> => {
  if (!ordersDatabaseId) {
    console.error("NOTION_DATABASE_ID_ORDERS no está definido");
    return null;
  }

  if (!token) {
    console.error("Token de seguimiento no proporcionado");
    return null;
  }

  try {
    const response = await notion.databases.query({
      database_id: ordersDatabaseId.trim(),
      filter: {
        property: "trackingToken",
        rich_text: {
          equals: token
        }
      }
    });

    if (response.results.length === 0) {
      console.log("No se encontró un pedido con el token:", token);
      return null;
    }

    return convertNotionPageToOrder(response.results[0]);
  } catch (error) {
    console.error("Error al buscar pedido por token:", error);
    return null;
  }
};

/**
 * Obtiene un pedido específico por su ID de Notion
 */
export const getOrderById = async (id: string): Promise<any | null> => {
  if (!id) {
    console.error("ID de pedido no proporcionado");
    return null;
  }

  try {
    const response = await notion.pages.retrieve({
      page_id: id,
    });

    return convertNotionPageToOrder(response);
  } catch (error) {
    console.error("Error al obtener pedido por ID:", error);
    return null;
  }
};

/**
 * Actualiza el estado de un pedido en Notion y registra el cambio en el historial
 */
export const updateOrderStatus = async (
  orderId: string, 
  newStatus: string, 
  notes?: string
): Promise<any | null> => {
  if (!orderId) {
    console.error("ID de pedido no proporcionado");
    return null;
  }

  try {
    // Primero obtenemos el pedido actual para tener los datos históricos
    const currentOrder = await getOrderById(orderId);
    
    if (!currentOrder) {
      console.error("No se encontró el pedido con ID:", orderId);
      return null;
    }
    
    // Preparar el historial de estados
    let estadoHistorial = currentOrder.estadoHistorial || [];
    
    // Añadir el nuevo estado al historial
    estadoHistorial.push({
      estado: newStatus,
      fecha: new Date().toISOString(),
      notas: notes || undefined
    });
    
    // Actualizar el pedido en Notion
    const response = await notion.pages.update({
      page_id: orderId,
      properties: {
        estadoPedido: {
          select: {
            name: newStatus
          }
        },
        estadoHistorial: {
          rich_text: [
            {
              text: {
                content: JSON.stringify(estadoHistorial)
              }
            }
          ]
        }
      }
    });
    
    // Retornar el pedido actualizado
    return convertNotionPageToOrder(response);
  } catch (error) {
    console.error("Error al actualizar el estado del pedido:", error);
    return null;
  }
}; 