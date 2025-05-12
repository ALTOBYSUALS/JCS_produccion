import { NextResponse } from 'next/server';
import { getActiveProducts, getAllProducts, createProduct, fetchAllPages } from '@/lib/notion';

export async function GET(request: Request) {
  try {
    // Obtener parámetros de URL
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const usePagination = url.searchParams.get('usePagination') !== 'false'; // Por defecto usamos paginación
    
    // Obtener productos de Notion
    let products;
    if (usePagination) {
      // Usar la nueva función de paginación
      products = await fetchAllPages(includeInactive);
    } else {
      // Usar las funciones anteriores (limitadas a 100 productos)
      products = includeInactive 
        ? await getAllProducts() 
        : await getActiveProducts();
    }
    
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Error fetching products', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();           // Omit<Product, 'id'>
    const newProduct = await createProduct(body);
    if (!newProduct) {
      return NextResponse.json({ error: 'Create failed' }, { status: 500 });
    }
    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Invalid request', details: err.message },
      { status: 400 },
    );
  }
} 