// Este script sube los productos desde app/data/products.ts a Notion
require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');
const path = require('path');

// Asegúrate de que estos valores existan en tu archivo .env.local
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID_PRODUCTS;

if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
  console.error('Error: NOTION_API_KEY y NOTION_DATABASE_ID_PRODUCTS deben estar definidos en .env.local');
  process.exit(1);
}

// Inicializar el cliente de Notion
const notion = new Client({ auth: NOTION_API_KEY });

// Función para convertir un producto al formato de Notion
function convertProductToNotionProperties(product) {
  return {
    Name: {
      title: [
        {
          text: {
            content: product.name || "Sin nombre"
          }
        }
      ]
    },
    ID_Origen: {
      rich_text: [
        {
          text: {
            content: String(product.id) || ""
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
        name: getProductBrand(product) || "Otros"
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
  };
}

// Función adaptada de la aplicación para extraer la marca
function getProductBrand(p) {
  if (!p || !p.name || p.category !== 'neumatico') return 'Otros';
  
  const name = p.name.toLowerCase();
  const brands = [
    "michelin", "continental", "bfgoodrich", "general tire", "cooper", 
    "falken", "pirelli", "bridgestone", "firemax", "haida", "dunlop", 
    "goodyear", "rebok", "chuanshi", "westlake", "minell", "sunset", 
    "linglong", "xbri", "wanda", "gallant", "lanvigator", "three-a", 
    "sunny", "trazano", "aplus", "nexen", "cachland", "hifly", "yokohama", 
    "aptany", "kapsen", "doublecoin", "alenza"
  ];
  
  for (const brand of brands) {
    if (name.includes(brand)) {
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }
  
  const firstWord = p.name.split(' ')[0];
  if (
    firstWord.toLowerCase() !== 'neumático' && 
    firstWord.toLowerCase() !== 'neumaticos' && 
    firstWord.toLowerCase() !== 'cubierta'
  ) {
    return firstWord;
  }
  
  return 'Otros';
}

// Función principal para ejecutar la importación - Ahora asincrónica
async function uploadProductsToNotion() {
  console.log(`Iniciando carga a Notion DB: ${NOTION_DATABASE_ID}...`);
  
  try {
    // Carga dinámica del módulo usando import()
    // Intentamos primero con .js (compilado) y si falla probamos con .ts
    let initialProducts;
    try {
      const productsModule = await import('../app/data/products.js');
      initialProducts = productsModule.initialProducts;
    } catch (importError) {
      console.log("No se pudo importar como .js, intentando con .ts...");
      try {
        const productsModule = await import('../app/data/products.ts');
        initialProducts = productsModule.initialProducts;
      } catch (tsImportError) {
        throw new Error(`No se pudo importar los productos: ${tsImportError.message}`);
      }
    }
    
    if (!Array.isArray(initialProducts) || initialProducts.length === 0) {
      console.error('Error: initialProducts no es un array o está vacío');
      process.exit(1);
    }
    
    console.log(`Se encontraron ${initialProducts.length} productos para importar.`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Procesar cada producto
    for (let i = 0; i < initialProducts.length; i++) {
      const product = initialProducts[i];
      
      if (!product || !product.id || !product.name) {
        console.warn(`[${i+1}/${initialProducts.length}] Omitido: Producto inválido`);
        errorCount++;
        continue;
      }
      
      try {
        const properties = convertProductToNotionProperties(product);
        
        // Crear una página (registro) en la base de datos de Notion
        await notion.pages.create({
          parent: { database_id: NOTION_DATABASE_ID },
          properties
        });
        
        successCount++;
        process.stdout.write(`\rProgreso: ${i+1}/${initialProducts.length} | Éxitos: ${successCount} | Errores: ${errorCount}`);
      } catch (error) {
        errorCount++;
        console.error(`\n[${i+1}/${initialProducts.length}] Error al importar el producto ${product.name || product.id}: ${error.message}`);
        errors.push({ product: product.name || product.id, error: error.message });
      }
      
      // Pequeña pausa para evitar rate limits de la API
      // Hacemos pausa cada 2 productos
      if ((i + 1) % 2 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    }
    
    console.log(`\n\nImportación completada: ${successCount} productos importados, ${errorCount} errores.`);
    
    if (errors.length > 0) {
      console.log("\nResumen de errores:");
      errors.forEach((err, index) => {
        console.log(`${index + 1}. Producto: ${err.product} - Error: ${err.error}`);
      });
    }
    
  } catch (error) {
    console.error('Error en el proceso de importación:', error);
  }
}

// Ejecutar la función principal
uploadProductsToNotion().catch(console.error);

