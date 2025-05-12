import { Client } from "@notionhq/client";
import { Product } from "@/components/types"; // Vamos a crear este archivo de tipos a continuación

// Inicializar cliente Notion
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Asegurarnos de que el ID no tenga comillas extras
const databaseId = process.env.NOTION_DATABASE_ID_PRODUCTS ? 
  process.env.NOTION_DATABASE_ID_PRODUCTS.replace(/"/g, '') : undefined;

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