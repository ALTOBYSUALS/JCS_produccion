"use client"
// @ts-nocheck - Mantener temporalmente mientras se refactoriza

// --- IMPORTACIÓN CORREGIDA ---
import React, { useState, useEffect, createContext, useContext, useRef, useMemo, ComponentType, ReactNode, FC, ChangeEvent, MouseEvent, SyntheticEvent, FormEvent, ForwardedRef } from "react" // Añadir tipos necesarios
import DigitalTicker from '@/components/DigitalTicker';
// IMPORTAR TIPOS DEL NUEVO ARCHIVO
import { 
  Product as ImportedProduct, 
  CartItem as ImportedCartItem,
  ViewName as ImportedViewName,
  SetViewContext as ImportedSetViewContext,
  SetViewFunction as ImportedSetViewFunction,
  ProductContextType as ImportedProductContextType,
  CartContextType as ImportedCartContextType,
  ProductSpec as ImportedProductSpec 
} from '@/components/types';
// IMPORTAR HOOKS
import { useProducts as useProductsApi } from '@/lib/hooks';
// Añadir esta importación:
import { NextResponse } from 'next/server';
import { createProduct, updateProduct, deleteProduct } from '@/lib/notion';

// --- ELIMINAR INTERFACES DUPLICADAS Y DEJAR SOLO LOS COMENTARIOS ---
// --- INTERFACES PRINCIPALES ---
// ProductSpec - Movido a types.ts
// Product - Movido a types.ts
// CartItem - Movido a types.ts
// ViewName - Movido a types.ts
// SetViewContext - Movido a types.ts
// SetViewFunction - Movido a types.ts
// ProductContextType - Movido a types.ts
// CartContextType - Movido a types.ts

// --- IMPORTACIONES ---
// Placeholders si no existen los archivos
interface ProductSpec {
  ancho?: string | number;
  perfil?: string | number;
  rodado?: string | number; // Consistent naming? (diametro used elsewhere)
  [key: string]: string | number | undefined; // Allow other string/number specs
}

interface Product {
  id: string | number;
  name: string;
  description?: string;
  price: number; // Should be number
  imageUrls: string[]; // Use an array of strings
  category: string; // Consider using a union type: 'neumatico' | 'llanta' | ...
  specs: ProductSpec;
  rating?: number;
  reviewCount?: number;
}

interface CartItem {
    id: string | number;
    name: string;
    price: number;
    imageUrl: string;
    category: string;
    quantity: number;
}

// Tipos para View y Contexto de setView
type ViewName = 'storefront' | 'neumaticos' | 'llantas' | 'accesorios' | 'servicios' | 'contacto' | 'shopByBrand' | 'productDetail' | 'cart' | 'checkout' | 'adminLogin' | 'adminDashboard' |
                'llantas_deportivas' | 'llantas_chapa' | 'llantas_r14' | 'llantas_r15' | 'llantas_r17' |
                'servicio_alineacion' | 'servicio_reparacion' | 'servicio_aceite' | 'servicio_frenos' | 'servicio_suspension' | 'servicio_mecanica';

interface SetViewContext {
    product?: Product;
    filters?: Record<string, string | number>;
    brand?: string;
    keepFilters?: boolean;
}

type SetViewFunction = (view: ViewName, context?: SetViewContext) => void;


// --- IMPORTACIONES ---
// Placeholders si no existen los archivos
const TestimonialsSection = () => ( <div className="container mx-auto my-12 p-6 bg-gray-100 rounded-lg text-center"><h2 className="text-2xl font-semibold mb-4">Testimonios</h2><div className="grid md:grid-cols-3 gap-6"><div className="bg-white p-4 rounded shadow"><p className="italic">"Placeholder Testimonio 1..."</p></div><div className="bg-white p-4 rounded shadow"><p className="italic">"Placeholder Testimonio 2..."</p></div><div className="bg-white p-4 rounded shadow"><p className="italic">"Placeholder Testimonio 3..."</p></div></div></div> )
// ACTUALIZANDO fetchProductsFromCSV para usar API
const fetchProductsFromCSV = async () => { 
  try {
    // Intentar obtener productos desde la API
    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error(`Error fetching products: ${response.status}`);
    }
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error("Error loading products from API:", error);
    return []; // Retornar array vacío en caso de error
  }
};

// --- Mock Data & Categories ---
// !!!!! YA NO NECESITAS EL ARRAY initialProducts AQUÍ !!!!!

const categories = [
  { value: "neumatico", label: "Neumático" },
  { value: "llanta", label: "Llanta" },
  { value: "accesorio", label: "Accesorio" },
  { value: "servicio", label: "Servicio" },
];

// --- FIN DEL BLOQUE PARA COPIAR Y PEGAR ---

// --- Helper para extraer Marca ---
// Ajustado para recibir Product o un objeto parcial con name y category
const getProductBrand = (p: { name: string; category: string } | Product | null | undefined): string | null => { if (!p || !p.name || p.category !== 'neumatico') return null; const n = p.name.toLowerCase(); const b = ["michelin", "continental", "bfgoodrich", "general tire", "cooper", "falken","pirelli", "bridgestone", "firemax", "haida", "dunlop", "goodyear","rebok", "chuanshi", "westlake", "minell", "sunset", "linglong", "xbri","wanda", "gallant", "lanvigator", "three-a", "sunny", "trazano", "aplus","nexen", "cachland", "hifly", "yokohama", "aptany", "kapsen", "doublecoin", "alenza"]; for (const br of b) { if (n.includes(br)) return br.charAt(0).toUpperCase() + br.slice(1); } const fw = p.name.split(' ')[0]; if (fw.toLowerCase() !== 'neumático' && fw.toLowerCase() !== 'neumaticos' && fw.toLowerCase() !== 'cubierta') return fw; return 'Otros'; };

// --- DATOS DE MARCAS (Dinámico) ---
// Tipar prods como Product[]
const generateBrandsData = (prods: Product[]) => {
  const bm = new Map();
  const pre = {
    "Pirelli": { logoUrl: "https://placehold.co/150x50/ffffff/DA291C?text=PIRELLI", topTireName: "Pirelli P400 Evo", topTireRating: 4.0, topTireReviews: 8, tireImageUrl: "https://placehold.co/600x600/e0e0e0/333?text=Neumático+Pirelli" },
    "Goodyear": { logoUrl: "https://placehold.co/150x50/ffffff/FFCC00?text=GOODYEAR", topTireName: "Goodyear Eagle Sport 2", topTireRating: 4.8, topTireReviews: 199, tireImageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_954631-MLA74953399993_032024-E.webp" },
    "Bridgestone": { logoUrl: "https://placehold.co/150x50/ffffff/E4002B?text=BRIDGESTONE", topTireName: "Bridgestone Dueler H/T 684", topTireRating: 4.7, topTireReviews: 42, tireImageUrl: "https://http2.mlstatic.com/D_Q_NP_2X_903652-MLA40672388178_022020-E.webp" },
  };
  // Asegurarse que prods sea un array antes de iterar
  if (!Array.isArray(prods)) {
      console.error("generateBrandsData recibió algo que no es un array:", prods);
      return [];
  }
  prods.forEach(p => {
    if (p && p.category === 'neumatico') { // Añadida verificación de nulidad para p
      const bn = getProductBrand(p);
      if (bn && bn !== 'Otros') {
        if (!bm.has(bn)) {
          const prd = pre[bn as keyof typeof pre];
          bm.set(bn, {
            name: bn,
            logoUrl: prd?.logoUrl || `https://placehold.co/150x50/ffffff/cccccc?text=${encodeURIComponent(bn)}`,
            topTireName: prd?.topTireName || p.name,
            topTireRating: prd?.topTireRating || (p.rating ?? 0), // Usar ?? 0
            topTireReviews: prd?.topTireReviews || (p.reviewCount ?? 0), // Usar ?? 0
            tireImageUrl: prd?.tireImageUrl || p.imageUrls?.[0] || "https://placehold.co/400x400/cccccc/ffffff?text=Tire", // USA imageUrls[0]
            viewAllLink: "neumaticos",
          });
        } else {
          const cb = bm.get(bn);
          // ** CORRECCIÓN DE LINTER **
          const currentRating = p.rating ?? 0;
          const currentReviewCount = p.reviewCount ?? 0;
          if ((currentRating > cb.topTireRating) || (currentRating === cb.topTireRating && currentReviewCount > cb.topTireReviews)) {
            cb.topTireName = p.name;
            cb.topTireRating = currentRating;
            cb.topTireReviews = currentReviewCount;
            cb.tireImageUrl = p.imageUrls?.[0] || "https://placehold.co/400x400/cccccc/ffffff?text=Tire"; // USA imageUrls[0]
          }
        }
      }
    }
  });
  return Array.from(bm.values()).sort((a, b) => a.name.localeCompare(b.name));
};
// Se llama generateBrandsData DESPUÉS de definir initialProducts
// Asegurarse que initialProducts se alinee con Product[] si es posible
const brandsData = generateBrandsData([]);  // Will be populated later from context

// --- Contextos (Product y Cart) ---
// Definir el tipo de contexto para Productos
interface ProductContextType {
  products: Product[]; // Usar Product[]
  addProduct: (product: Omit<Product, 'id'>) => void; // Producto sin ID generado
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number | string) => void;
  loadProducts: () => Promise<void>; // Nueva función para recargar productos desde la API
  loading: boolean; // Nuevo estado para indicar si se están cargando productos
}

// Definir el tipo de contexto para Carrito
interface CartContextType {
   cartItems: CartItem[];
   addToCart: (product: Product) => void;
   removeFromCart: (id: string | number) => void;
   updateQuantity: (id: string | number, quantity: number) => void;
   clearCart: () => void;
   totalItems: number;
   totalPrice: number;
}

// Crear contextos con el tipo correcto, inicializados a null
const ProductContext = createContext<ProductContextType | null>(null);
const CartContext = createContext<CartContextType | null>(null);


// Tipar props del ProductProvider
interface ProductProviderProps {
    children: ReactNode;
}

const ProductProvider: FC<ProductProviderProps> = ({ children }) => {
  // Usar el hook para cargar productos desde la API
  const { products: apiProducts, loading, error, loadProducts } = useProductsApi();
  const [products, setProducts] = useState<Product[]>([]);

  // Inicializar productos desde la API
  useEffect(() => {
    if (apiProducts.length > 0) {
      setProducts(apiProducts);
      // Guardar también en localStorage para acceso offline
    if (typeof window !== "undefined") {
      try {
          localStorage.setItem("products", JSON.stringify(apiProducts));
        } catch (e) { 
          console.error("Err save products:", e); 
        }
      }
    } else if (!loading && typeof window !== "undefined") {
      // Si no hay productos de la API y terminó de cargar, intentar cargar desde localStorage
      try {
        const storedProducts = localStorage.getItem("products");
        if (storedProducts) {
          const parsedProducts = JSON.parse(storedProducts);
          if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
            setProducts(parsedProducts);
          }
        }
      } catch (e) {
        console.error("Error loading products from localStorage:", e);
      }
    }
  }, [apiProducts, loading]);

  // Tipar parámetro p como Omit<Product, 'id'>
  const addProduct = async (p: Omit<Product, 'id'>) => {
    try {
      // Aquí iría lógica para crear producto en Notion a través de API
      // Por ahora sólo actualizamos el estado local
      const newProduct: Product = {
        ...p,
        id: Date.now() + Math.random().toString(),
        price: Number(p.price) || 0,
        category: p.category || "accesorio",
        imageUrls: p.imageUrls || [`https://placehold.co/600x400/cccccc/333?text=${encodeURIComponent(p.name || "Producto")}`],
        specs: p.specs || {},
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
      };
      
      setProducts(prev => [...prev, newProduct]);

      // Intentamos persistir en localStorage
      if (typeof window !== "undefined") {
        try {
          const currentProducts = JSON.parse(localStorage.getItem("products") || "[]");
          localStorage.setItem("products", JSON.stringify([...currentProducts, newProduct]));
        } catch (e) {
          console.error("Error saving product to localStorage:", e);
        }
      }

      // En una implementación real, aquí se llamaría a la API para crear el producto
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      if (res.ok) await loadProducts();
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  // Tipar up como Product
  const updateProduct = async (up: Product) => {
    try {
      // Actualizar localmente
      setProducts(prev => 
        Array.isArray(prev) 
          ? prev.map((p: Product) => (p.id === up.id ? { ...p, ...up, price: Number(up.price) || 0 } : p)) 
          : []
      );

      // Intentamos persistir en localStorage
    if (typeof window !== "undefined") {
        try {
          const currentProducts = JSON.parse(localStorage.getItem("products") || "[]");
          const updatedProducts = currentProducts.map((p: Product) => (p.id === up.id ? { ...p, ...up, price: Number(up.price) || 0 } : p));
          localStorage.setItem("products", JSON.stringify(updatedProducts));
        } catch (e) {
          console.error("Error updating product in localStorage:", e);
        }
      }

      // En una implementación real, aquí se llamaría a la API para actualizar el producto
      await fetch(`/api/products/${up.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(up),
      });
      await loadProducts();
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  // Tipar id como string | number
  const deleteProduct = async (id: string | number) => {
    try {
      // Eliminar localmente
      setProducts(prev => 
        Array.isArray(prev) ? prev.filter((p: Product) => p.id !== id) : []
      );

      // Intentamos persistir en localStorage
      if (typeof window !== "undefined") {
        try {
          const currentProducts = JSON.parse(localStorage.getItem("products") || "[]");
          const filteredProducts = currentProducts.filter((p: Product) => p.id !== id);
          localStorage.setItem("products", JSON.stringify(filteredProducts));
        } catch (e) {
          console.error("Error deleting product from localStorage:", e);
        }
      }

      // En una implementación real, aquí se llamaría a la API para eliminar el producto
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      await loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  // Crear el valor del contexto con el tipo correcto
  const value: ProductContextType = { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    loadProducts, // Nueva función para recargar productos desde la API
    loading // Nuevo estado para indicar si se están cargando productos
  };

  return (<ProductContext.Provider value={value}>{children}</ProductContext.Provider>)
};
// Hook useProducts devuelve ProductContextType
const useProducts = (): ProductContextType => { const ctx = useContext(ProductContext); if (!ctx) throw new Error("useProducts must be used within a ProductProvider"); return ctx; };

// Tipar props del CartProvider
interface CartProviderProps {
  children: ReactNode;
  onCartUpdate?: () => void; // Make optional if it's not always provided
}

const CartProvider: FC<CartProviderProps> = ({ children, onCartUpdate }) => {
  // Estado tipado como CartItem[]
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
          const s = localStorage.getItem("cartItems");
          const p = s ? JSON.parse(s) : [];
          // Validar que lo recuperado sea un array y que los items tengan la estructura esperada
          return Array.isArray(p) ? p.filter(item => item && typeof item === 'object' && item.id && item.name && typeof item.price === 'number').map(item => ({...item, quantity: Number(item.quantity) || 1})) : [];
        } catch (e) { console.error("Err load cart:", e); return []; }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try { localStorage.setItem("cartItems", JSON.stringify(cartItems)); } catch (e) { console.error("Err save cart:", e); }
    }
  }, [cartItems]);

  // Tipar p como Product
  const addToCart = (p: Product) => {
    if (!p || typeof p.price !== "number" || p.price < 0) { console.warn("Invalid product add:", p); return; } // Precio no puede ser negativo
    let added = false;
    setCartItems((prev) => {
      const currentCart = Array.isArray(prev) ? prev : [];
      const existingItemIndex = currentCart.findIndex((i) => i.id === p.id);

      if (existingItemIndex > -1) {
        // Update quantity
        added = true;
        const updatedCart = [...currentCart];
        updatedCart[existingItemIndex] = {
            ...updatedCart[existingItemIndex],
            quantity: (updatedCart[existingItemIndex].quantity || 0) + 1
        };
        return updatedCart;
      } else {
        // Add new item
        added = true;
        const newItem: CartItem = { // Crear CartItem
            id: p.id,
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrls?.[0] ?? `https://placehold.co/64x64/cccccc/ffffff?text=N/A`, // Primera imagen o placeholder
            category: p.category,
            quantity: 1
        };
        return [...currentCart, newItem];
      }
    });
    if (added && onCartUpdate) onCartUpdate();
  };

  // Tipar id como string | number
  const removeFromCart = (id: string | number) => setCartItems((prev) => Array.isArray(prev) ? prev.filter((i) => i.id !== id) : []);
  // Tipar id y q (quantity)
  const updateQuantity = (id: string | number, quantity: number) => { const newQuantity = Math.max(1, quantity); setCartItems((prev) => Array.isArray(prev) ? prev.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i)) : []) };
  const clearCart = () => { setCartItems([]); if (typeof window !== "undefined") { try { localStorage.removeItem("cartItems") } catch(e) { console.error("Err remove cart:", e); } } };

  const safeItems = Array.isArray(cartItems) ? cartItems : [];
  const totalItems = safeItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalPrice = safeItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);

  // Crear el valor del contexto con el tipo correcto
  const value: CartContextType = { cartItems: safeItems, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice };

  return (<CartContext.Provider value={value}>{children}</CartContext.Provider>)
};
// Hook useCart devuelve CartContextType
const useCart = (): CartContextType => { const ctx = useContext(CartContext); if (!ctx) throw new Error("useCart must be used within a CartProvider"); return ctx; };


// --- SVG Icons ---
// Tipar props de iconos si reciben props adicionales
type SvgProps = React.SVGProps<SVGSVGElement>;
const CartIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);
const UserIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>);
const TrashIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const PhoneIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>);
const WhatsAppIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.273-.099-.471-.148-.67.149-.198.297-.768.967-.941 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.67-.05-.942-.05s-.57.05-.817.05c-.247 0-.644.074-.99.422-.347.347-1.329 1.295-1.329 3.16.0 1.864 1.354 3.666 1.549 3.915.196.249 2.69 4.108 6.527 5.769 1.035.378 2.001.486 2.775.486.903 0 1.764-.13 2.568-.438.868-.332 1.471-.74 1.899-1.354.428-.614.428-1.164.304-1.354z" /></svg>);
const LocationIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>);
const ArrowUpIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>);
const ShieldCheckIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>);
const TruckIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5H9m9-4.5H9m9 4.5V10.5a2.25 2.25 0 00-2.25-2.25H5.625a2.25 2.25 0 00-2.25 2.25v7.5m17.25-4.5H12" /></svg>);
const StoreIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A.75.75 0 0114.25 12h4.5a.75.75 0 01.75.75v7.5m-15-7.5h15m-15 0a.75.75 0 01-.75-.75V10.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75H3m12 0a.75.75 0 01-.75-.75V10.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75H15m-6 0a.75.75 0 01-.75-.75V10.5a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75H9m6 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m3 0H9m6 0a2.25 2.25 0 012.25 2.25v.75a2.25 2.25 0 01-2.25-2.25H9a2.25 2.25 0 01-2.25-2.25v-.75a2.25 2.25 0 012.25-2.25h6z" /></svg>);
const ClockIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
// Otros iconos simples no necesitan tipo FC si no usan props
const SearchIcon=()=>(<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);const ArrowLeftIcon=()=>(<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);const ChevronLeftIcon=()=>(<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>);const ChevronRightIcon=()=>(<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>);const XMarkIcon=()=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);const PlusIcon=()=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);const PencilIcon=()=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>);
interface StarIconProps { filled?: boolean; className?: string; }
const StarIcon: FC<StarIconProps>=({filled=false,className=""})=>(<svg className={`inline-block w-5 h-5 ${filled?"text-yellow-400 fill-current":"text-gray-300"} ${className}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>);
const CogIcon=()=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15.036-7.126L4.97 4.97M19.03 19.03l-1.06-1.06M4.97 19.03l1.06-1.06M19.03 4.97l-1.06 1.06M12 2.25v1.5m0 16.5v1.5m-7.126-1.5L4.97 19.03m14.06-14.06l-1.06 1.06M12 6.75a5.25 5.25 0 110 10.5 5.25 5.25 0 010-10.5zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);const TireIcon=()=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 15.91a6 6 0 11-7.82 0 6 6 0 017.82 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 17.25v-.001M12 6.75v.001m0 3.75v.001m0 3.75v.001M17.25 12h-.001M6.75 12h.001m3.75 0h.001m3.75 0h.001" /></svg>);const Bars3Icon=()=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);


// --- UI Components ---
// Definir tipos para props de Card, CardHeader, CardContent, CardFooter
interface CardProps { children: ReactNode; className?: string; }
const Card: FC<CardProps>=({children,className=""})=>(<div className={`bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm ${className}`}>{children}</div>);
const CardHeader: FC<CardProps>=({children,className=""})=>(<div className={`p-4 border-b border-gray-200 ${className}`}>{children}</div>);
const CardContent: FC<CardProps>=({children,className=""})=>(<div className={`p-4 ${className}`}>{children}</div>);
const CardFooter: FC<CardProps>=({children,className=""})=>(<div className={`p-4 border-t border-gray-200 bg-gray-50 ${className}`}>{children}</div>);

// Definir tipos para Button
const sz = { default: "px-4 py-2", sm: "px-3 py-1.5 text-xs", lg: "px-6 py-3 text-base", icon: "h-10 w-10" } as const; // Use 'as const'
const vr = { default: "bg-red-600 text-white hover:bg-red-700", destructive: "bg-red-700 text-white hover:bg-red-800", outline: "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-800", secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300", ghost: "hover:bg-gray-100 hover:text-gray-900", link: "text-black underline-offset-4 hover:underline", navLink: "text-gray-700 hover:text-red-600" } as const; // Use 'as const'
type ButtonSize = keyof typeof sz;
type ButtonVariant = keyof typeof vr;
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>; // Hacer onClick opcional o manejarlo
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    as?: 'button' | 'a';
    disabled?: boolean;
    title?: string;
    // type='button' está implícito en ButtonHTMLAttributes
}
const Button: FC<ButtonProps> = ({
    children,
    onClick, // Ahora puede ser undefined
    variant = "default",
    size = "default",
    className = "",
    type = "button", // Default HTML button type
    as: Tag = "button", // Default to button tag
    disabled = false,
    title = ""
}) => {
    const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
    const sizeClass = sz[size]; // Acceso seguro gracias a keyof y as const
    const variantClass = vr[variant]; // Acceso seguro

    return (
        <Tag
            type={Tag === "button" ? type : undefined} // Solo botones tienen 'type'
            onClick={onClick}
            className={`${base} ${sizeClass} ${variantClass} ${className}`}
            disabled={disabled}
            title={title}
            // Añadir href si es un link, por ejemplo
            {...(Tag === 'a' ? { href: onClick ? '#' : undefined } : {})} // Ejemplo: añadir href si hay onClick
        >
            {children}
        </Tag>
    );
};
// Tipar Input, Select, Textarea usando forwardRef correctamente
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // No se necesitan props personalizadas por ahora
}
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className = "", type = "text", ...props }, ref) => (
   <input ref={ref} type={type} className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
));
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
   children: ReactNode; // Select necesita children (options)
}
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ children, className = "", value, onChange, ...props }, ref) => (
   <select ref={ref} value={value} onChange={onChange} className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 appearance-none bg-no-repeat bg-right bg-[url('data:image/svg+xml,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20viewBox%3d%220%200%2016%2016%22%3e%3cpath%20fill%3d%22none%22%20stroke%3d%22%239ca3af%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%20stroke-width%3d%222%22%20d%3d%22m2%205%206%206%206-6%22%2f%3e%3c%2fsvg%3e')] pr-8 ${className}`} {...props}>
      {children}
   </select>
));
Select.displayName = "Select";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = "", ...props }, ref) => (
   <textarea ref={ref} className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}/>
));
Textarea.displayName = "Textarea";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    children: ReactNode;
    htmlFor?: string;
    className?: string;
}
const Label: FC<LabelProps>=({children,htmlFor,className=""})=>(<label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1.5 ${className}`}>{children}</label>);


// --- Application Specific Components ---

// Tipar props de MegaMenu
interface MegaMenuItem { label: string; view?: ViewName; } // Añadir ViewName
interface MegaMenuColumn { title?: string; links: MegaMenuItem[]; }
interface MegaMenuProps {
    items: MegaMenuColumn[];
    setView: SetViewFunction;
    closeMenu: () => void;
}
function MegaMenu({ items, setView, closeMenu }: MegaMenuProps) { const handleItemClick = (view?: ViewName) => { if (view) { setView(view); closeMenu(); } }; if (!Array.isArray(items) || items.length === 0) return null; const gridCols = `grid-cols-${Math.min(items.length, 4)}`; return (<div className={`absolute left-0 top-full w-auto min-w-[600px] max-w-4xl mt-0 rounded-b-lg shadow-2xl z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 transition-all duration-300 ease-in-out`}><div className={`grid ${gridCols} gap-x-8 gap-y-6 p-6`}>{items.map((column, colIndex) => (<div key={colIndex}>{column.title && <h5 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-1">{column.title}</h5>}{Array.isArray(column.links) && (<ul className="space-y-1">{column.links.map((link, linkIndex) => (<li key={linkIndex}><button onClick={() => handleItemClick(link.view)} className="block w-full text-left py-1 px-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!link.view}>{link.label || "Link inválido"}</button></li>))}</ul>)}</div>))}</div></div>) }


// --- HeroSearch Component ---
interface CustomHeroSearchProps {
    onSearch: (filters: Record<string, string>) => void; // Ajustar tipo de filters si es necesario
}
function CustomHeroSearch({ onSearch }: CustomHeroSearchProps) { const [activeTab, setActiveTab] = useState<'neumaticos' | 'llantas'>("neumaticos"); const [ancho, setAncho] = useState(""); const [perfil, setPerfil] = useState(""); const [diametro, setDiametro] = useState(""); const anchos = ["165", "175", "185", "195", "205", "215", "225", "235", "245", "255", "265", "33"]; const perfiles = ["12.5", "35", "40", "45", "50", "55", "60", "65", "70", "75"]; const diametros = ["12", "13", "14", "15", "16", "17", "18", "19", "20"];
// Tipar evento ChangeEvent<HTMLSelectElement>
// ** CORRECCIÓN DE LINTER **
const handleSearchClick = () => { const filters: Record<string, string> = { category: activeTab }; if (ancho) filters.ancho = ancho; if (perfil) filters.perfil = perfil; if (diametro) filters.diametro = diametro; if (activeTab === 'llantas') { delete filters.perfil; } onSearch(filters); }; return (<div className="mt-8 p-5 md:p-6 max-w-xl mx-auto bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-xl border border-gray-700/50"><div className="flex border-b border-gray-600/50 mb-5"><button onClick={() => setActiveTab("neumaticos")} className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200 ${activeTab === "neumaticos" ? "text-white border-b-2 border-red-500" : "text-gray-400 hover:text-gray-200"}`}><TireIcon /> NEUMÁTICOS</button><button onClick={() => setActiveTab("llantas")} className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200 ${activeTab === "llantas" ? "text-white border-b-2 border-red-500" : "text-gray-400 hover:text-gray-200"}`}><CogIcon /> LLANTAS</button></div><div key={activeTab} className="animate-fadeIn space-y-4">{activeTab === "neumaticos" && (<><div className="flex items-center gap-2 text-red-500 mb-1"><SearchIcon /><h3 className="text-md font-semibold text-gray-200">Buscar Neumático por Medida</h3></div><Select value={ancho} onChange={(e: ChangeEvent<HTMLSelectElement>) => setAncho(e.target.value)} className="bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500"><option value="">Seleccionar Ancho</option>{anchos.sort((a, b) => parseInt(a) - parseInt(b)).map((a) => ( <option key={a} value={a}>{a}</option> ))}</Select><Select value={perfil} onChange={(e: ChangeEvent<HTMLSelectElement>) => setPerfil(e.target.value)} className="bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500"><option value="">Seleccionar Perfil</option>{perfiles.sort((a, b) => parseFloat(a) - parseFloat(b)).map((p) => ( <option key={p} value={p}>{p}</option> ))}</Select><Select value={diametro} onChange={(e: ChangeEvent<HTMLSelectElement>) => setDiametro(e.target.value)} className="bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500"><option value="">Seleccionar Diámetro (Rodado)</option>{diametros.sort((a, b) => parseInt(a) - parseInt(b)).map((d) => ( <option key={d} value={d}>R{d}</option> ))}</Select></>)}{activeTab === "llantas" && (<><div className="flex items-center gap-2 text-red-500 mb-1"><SearchIcon /><h3 className="text-md font-semibold text-gray-200">Buscar Llanta por Medida</h3></div><Select value={diametro} onChange={(e: ChangeEvent<HTMLSelectElement>) => setDiametro(e.target.value)} className="bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500"><option value="">Seleccionar Rodado</option>{diametros.sort((a, b) => parseInt(a) - parseInt(b)).map((d) => ( <option key={d} value={d}>R{d}</option> ))}</Select><Select value={ancho} onChange={(e: ChangeEvent<HTMLSelectElement>) => setAncho(e.target.value)} className="bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500"><option value="">Seleccionar Ancho (Opcional)</option>{['5.5"', '6"', '6.5"', '7"', '7.5"', '8"'].map((a) => (<option key={a} value={a.replace('"', "")}>{a}</option>))}</Select><Select className="bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500" value=""><option value="">Centro / Distribución (Opcional)</option><option value="4x100">4x100</option><option value="4x108">4x108</option><option value="5x100">5x100</option><option value="5x114">5x114.3</option></Select></>)}<Button onClick={handleSearchClick} className="w-full flex items-center justify-center gap-2 mt-2"><SearchIcon /> VER RESULTADOS</Button></div></div>) }


// --- ProductCardMobile Component ---
interface ProductCardMobileProps {
    product?: Product; // Producto puede ser opcional si isService es verdad
    onProductSelect: (product: Product) => void;
}
const ProductCardMobile: FC<ProductCardMobileProps> = ({ product, onProductSelect }) => {
  const { addToCart } = useCart();
  const isService = !product || typeof product.price !== "number" || product.price <= 0; // Ajuste para precio 0
  // ** CORRECCIÓN AQUÍ **
  const imageUrl = product?.imageUrls?.[0] || "https://placehold.co/300x300/cccccc/ffffff?text=N/A"; // Usa imageUrls[0]

  // Tipar evento onError
  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.target as HTMLImageElement;
      img.onerror = null; // Evitar bucle infinito
      img.src = "https://placehold.co/300x300/cccccc/ffffff?text=Error";
  };

  return (
    <div onClick={() => product && onProductSelect(product)} className="border rounded shadow-sm overflow-hidden bg-white flex flex-col cursor-pointer">
      <div className="aspect-square w-full overflow-hidden">
        <img
          src={imageUrl} // Usa la variable definida
          alt={product?.name || 'Producto sin nombre'} // Alt text más seguro
          className="w-full h-full object-cover"
          loading="lazy"
          onError={handleImageError} // Usar handler tipado
        />
      </div>
      <div className="p-2 flex flex-col flex-grow justify-between">
        <h4 className="text-xs font-semibold line-clamp-2 h-8 mb-1" title={product?.name}>{product?.name || 'Nombre no disponible'}</h4>
        <div>
          <p className={`text-sm font-bold mb-1 ${isService ? "text-red-600" : "text-gray-900"}`}>
            {isService ? "Consultar" : `$${product?.price?.toLocaleString("es-AR") ?? 'N/A'}`}
          </p>
          <Button
            size="sm"
            variant={isService ? "outline" : "default"}
            className="w-full text-[10px] py-1"
            onClick={(e: MouseEvent<HTMLButtonElement>) => { // Tipar evento
              e.stopPropagation();
              if (!isService && product) {
                addToCart(product); // addToCart ahora espera Product
              } else if (product) {
                onProductSelect(product);
              }
            }}
          >
            {isService ? "Info" : "Agregar"}
          </Button>
        </div>
      </div>
    </div>
  );
}


// --- ProductGridMobile Component ---
interface ProductGridMobileProps {
    products: Product[];
    categoryLabel: string;
    onProductSelect: (product: Product) => void;
    setView: SetViewFunction;
    addToCart: (product: Product) => void; // Pasar addToCart tipado
}
const ProductGridMobile: FC<ProductGridMobileProps> = ({ products = [], categoryLabel, onProductSelect, setView, addToCart }) => ( <div className="p-2"><div className="flex justify-between items-center mb-3"><Button onClick={() => setView("storefront")} variant="ghost" size="sm" className="text-gray-600 pl-0"><ArrowLeftIcon /> Volver</Button><h2 className="font-bold text-lg text-center flex-grow">{categoryLabel}</h2><div className="w-10"></div></div>{categoryLabel === "Neumáticos" && !categoryLabel.includes("Resultados") && !(brandsData && brandsData.some(b => categoryLabel.includes(b.name))) && ( <div className="text-center mb-4"><Button variant="outline" size="sm" onClick={() => setView('shopByBrand')}>Ver por Marca</Button></div> )}{products.length === 0 ? ( <p className="text-center text-gray-500 py-8">No se encontraron productos.</p> ) : ( <div className="grid grid-cols-2 gap-3">{products.map((p) => ( <ProductCardMobile key={p?.id || Math.random()} product={p} onProductSelect={onProductSelect} /> ))}</div> )}</div> ) // Removido addToCart de props pasadas a ProductCardMobile


// --- Mobile Navigation ---
interface MobileNavigationProps {
    setView: SetViewFunction;
    totalItems: number;
    toggleCart: () => void;
}
function MobileNavigation({ setView, totalItems, toggleCart }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // << Añadir este estado
  
  // Efecto para activar después de hidratación
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const nav = [{ label: "Neumáticos", view: "neumaticos" as ViewName }, { label: "Llantas", view: "llantas" as ViewName }, { label: "Accesorios", view: "accesorios" as ViewName }, { label: "Servicios", view: "servicios" as ViewName }, { label: "Contacto", view: "contacto" as ViewName }];
  const click = (v: ViewName) => { setView(v); setIsOpen(false); };
  return (
    <div className="lg:hidden sticky top-[36px] z-40">
      <div className="p-3 bg-white/90 backdrop-blur-md shadow-md flex justify-between items-center border-b border-gray-200">
        <div className="cursor-pointer" onClick={() => click("storefront")}>
          <img src="https://res.cloudinary.com/dt5pkdr0k/image/upload/v1745035390/image_1_yd8doa.png" alt="Logo" className="h-7 w-auto" />
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-md hover:bg-gray-100" title="Buscar (Próx.)">
            <SearchIcon />
          </button>
          <button onClick={toggleCart} className="relative p-2 rounded-md hover:bg-gray-100" title="Carrito">
            <CartIcon className="w-6 h-6" />
            {isMounted && totalItems > 0 && ( // << Condicionar este elemento
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-gray-100" title="Menú">
            <Bars3Icon />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t z-30 animate-fadeIn">
          <nav className="flex flex-col px-4 py-2">
            {nav.map((item) => (
              <button key={item.view} onClick={() => click(item.view)} className="text-left py-2.5 text-gray-700 hover:text-red-600 border-b last:border-b-0">
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}


// --- Header Component ---
interface HeaderProps {
    setView: SetViewFunction;
    toggleCart: () => void;
}
function Header({ setView, toggleCart }: HeaderProps) {
  const { totalItems } = useCart();
  const [openMenu, setOpenMenu] = useState<ViewName | null>(null); // Tipar estado con ViewName | null
  const menuTimerRef = useRef<NodeJS.Timeout | null>(null); // Tipar ref del timer
  const [isMounted, setIsMounted] = useState(false);
  
  // Sólo mostrar badge después de la hidratación
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems: { label: string; view: ViewName; megaMenu?: MegaMenuColumn[] | null }[] = [
    { label: "Neumáticos", view: "neumaticos", megaMenu: null },
    { label: "Llantas", view: "llantas", megaMenu: [
      { title: "Tipos", links: [
        { label: "Ver Todas", view: "llantas" },
        { label: "Deportivas", view: "llantas_deportivas" },
        { label: "Chapa", view: "llantas_chapa" },
      ]},
      { title: "Rodado", links: [
        { label: 'R14"', view: "llantas_r14" },
        { label: 'R15"', view: "llantas_r15" },
        { label: 'R17"', view: "llantas_r17" },
      ]},
    ]},
    { label: "Accesorios", view: "accesorios", megaMenu: null },
    { label: "Servicios", view: "servicios", megaMenu: [
      { title: "Principales", links: [
        { label: "Ver Todos", view: "servicios" },
        { label: "Alineación", view: "servicio_alineacion" },
        { label: "Reparación Llantas", view: "servicio_reparacion" },
        { label: "Cambio Aceite", view: "servicio_aceite" },
      ]},
      { title: "Otros", links: [
        { label: "Frenos", view: "servicio_frenos" },
        { label: "Suspensión", view: "servicio_suspension" },
        { label: "Mecánica Ligera", view: "servicio_mecanica" },
      ]},
    ]},
    { label: "Contacto", view: "contacto", megaMenu: null },
    { label: "Marcas", view: "shopByBrand", megaMenu: null },
  ];

  const handleMouseEnter = (view: ViewName) => { // Tipar parámetro view
    if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    setOpenMenu(view);
  };

  const handleMouseLeave = (isLeavingMenu = false) => {
    if (menuTimerRef.current) clearTimeout(menuTimerRef.current); // Limpiar timer anterior si existe
    menuTimerRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, isLeavingMenu ? 300 : 150);
  };

  const handleMenuInteraction = (action = "enter") => {
    if (action === "enter") {
      if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    } else {
      handleMouseLeave(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* <<< REEMPLAZAR ESTE DIV >>> */}
      <DigitalTicker />
      
      {/* Barra de navegación principal */}
      <div className="container mx-auto px-4 lg:px-6">
        <nav className="h-16 md:h-20 hidden lg:flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex-shrink-0 cursor-pointer" 
            onClick={() => setView("storefront")}
          >
            <img 
              src="https://res.cloudinary.com/dt5pkdr0k/image/upload/v1745035390/image_1_yd8doa.png" 
              alt="Logo JCS El Guardián" 
              className="h-9 w-auto" 
            />
          </div>
          
          {/* Enlaces de navegación */}
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <div 
                key={item.view} 
                className="relative"
                onMouseEnter={() => item.megaMenu && handleMouseEnter(item.view)} 
                onMouseLeave={() => item.megaMenu && handleMouseLeave()}
              >
                <button
                  onClick={() => { setView(item.view); setOpenMenu(null); }}
                  className="text-sm font-medium tracking-wide text-gray-700 hover:text-red-600 transition-colors py-2 uppercase"
                >
                  {item.label}
                  {item.megaMenu && (
                    <span className="ml-1 inline-block">▾</span>
                  )}
                </button>
                
                {/* Indicador de elemento activo */}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                
                {/* Mega Menú */}
                {item.megaMenu && openMenu === item.view && (
                  <div 
                    onMouseEnter={() => handleMenuInteraction("enter")} 
                    onMouseLeave={() => handleMenuInteraction("leave")} 
                    className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md border border-gray-100 z-20 overflow-hidden min-w-[600px]"
                  >
                    <MegaMenu 
                      items={item.megaMenu} 
                      setView={setView} 
                      closeMenu={() => setOpenMenu(null)} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Botones de acción */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleCart}
              className="p-2 rounded-md hover:bg-gray-100 transition-all relative"
              title="Carrito"
            >
              <CartIcon className="w-6 h-6 text-gray-700" />
              {isMounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
            </button>

            {/* <<< Botón Admin eliminado >>> */}

          </div>
        </nav>
      </div>
      
      {/* Navegación móvil */}
      <MobileNavigation setView={setView} totalItems={totalItems} toggleCart={toggleCart} />
    </header>
  );
}

// --- BrandCard Component ---
interface BrandData { // Definir tipo para los datos de marca
    name: string;
    logoUrl?: string;
    topTireName?: string;
    topTireRating?: number;
    topTireReviews?: number;
    tireImageUrl?: string;
    viewAllLink?: ViewName;
}
interface BrandCardProps {
    brand: BrandData;
    setView: SetViewFunction;
}
function BrandCard({ brand, setView }: BrandCardProps) {
    const handleViewBrandClick = () => { setView("neumaticos", { brand: brand.name }); };
    const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.target as HTMLImageElement;
        img.onerror = null;
        img.src = "https://placehold.co/400x400/cccccc/ffffff?text=Error";
    };
    return (<div className="bg-white rounded-lg shadow-md overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-xl flex flex-col md:flex-row items-center"><div className="p-5 md:p-6 flex-1"><img src={brand.logoUrl || `https://placehold.co/150x50/ffffff/cccccc?text=${brand.name}`} alt={`${brand.name} Logo`} className="h-8 md:h-10 mb-4 object-contain self-start" loading="lazy" /><button onClick={handleViewBrandClick} className="text-sm text-blue-600 hover:text-blue-800 hover:underline mb-2 block">Ver neumáticos {brand.name}</button><p className="text-xs text-gray-500 mb-1">Destacado:</p><p className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2">{brand.topTireName}</p>{brand.topTireRating && brand.topTireRating > 0 && (<div className="flex items-center text-sm"><div className="flex mr-2">{[1, 2, 3, 4, 5].map((star) => (<StarIcon key={star} filled={star <= Math.round(brand.topTireRating || 0)} className="w-4 h-4" />))}</div><span className="font-semibold mr-1">{(brand.topTireRating || 0).toFixed(1)}</span>{brand.topTireReviews && brand.topTireReviews > 0 && <span className="text-gray-500">({brand.topTireReviews})</span>}</div>)}</div><div className="w-full md:w-1/3 flex-shrink-0 aspect-square md:aspect-auto md:h-full overflow-hidden"><img src={brand.tireImageUrl || "https://placehold.co/400x400/cccccc/ffffff?text=Tire"} alt={`Neumático ${brand.name}`} className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105" loading="lazy" onError={handleImageError} /></div></div>) }


// --- ShopByBrandPage Component ---
interface ShopByBrandPageProps {
    setView: SetViewFunction;
}
function ShopByBrandPage({ setView }: ShopByBrandPageProps) { return (<div className="bg-gradient-to-b from-gray-50 to-gray-100 py-10 md:py-16"><div className="container mx-auto px-4 lg:px-6"><h1 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-gray-800">Comprar Neumáticos por Marca</h1><div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">{brandsData.map((brand: BrandData) => (<BrandCard key={brand.name} brand={brand} setView={setView} />))}</div><div className="text-center mt-12"><Button variant="outline" onClick={() => setView("neumaticos")}>Ver Todos los Neumáticos</Button></div></div></div>) }

// --- Footer Component ---
// Tipar eventos onClick de ejemplo
function Footer() { const wN = "54911XXXXXXXX"; const pN = "+11XXXXXXXX"; const preventDefault = (e: MouseEvent) => e.preventDefault(); return (<footer className="bg-black text-gray-300 pt-8 md:pt-12 pb-20 md:pb-8 mt-8 md:mt-16"><div className="container mx-auto px-4 lg:px-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8"><div><h5 className="font-semibold mb-3 uppercase text-sm text-white">Servicios</h5><ul className="space-y-2 text-xs"><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Alineación y Balanceo</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Reparación Llantas</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Frenos</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Suspensión</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Mecánica Ligera</a></li></ul></div><div><h5 className="font-semibold mb-3 uppercase text-sm text-white">Productos</h5><ul className="space-y-2 text-xs"><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Neumáticos Nuevos</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Llantas Aleación</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Llantas Chapa</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Accesorios</a></li></ul></div><div className="mt-6 md:mt-0"><h5 className="font-semibold mb-3 uppercase text-sm text-white">La Empresa</h5><ul className="space-y-2 text-xs"><li><a href="#" className="hover:text-white hover:underline block py-1">Quiénes Somos</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Nuestra Historia</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Sucursal San Justo</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Trabajá con Nosotros</a></li></ul></div><div className="mt-6 md:mt-0"><h5 className="font-semibold mb-3 uppercase text-sm text-white">Contacto</h5><ul className="space-y-2 text-xs"><li className="py-1"><a href={`tel:${pN}`} className="flex items-center hover:text-white"><PhoneIcon className="h-4 w-4 mr-2 shrink-0" />{pN.replace("+", "")}</a></li><li className="py-1"><a href="mailto:info@jcselguardian.com.ar" className="flex items-center hover:text-white break-all"><UserIcon className="h-4 w-4 mr-2 shrink-0" />info@jcselguardian.com.ar</a></li><li className="py-1"><a href="https://maps.google.com/?q=San+Justo,Buenos+Aires" target="_blank" className="flex items-center hover:text-white" rel="noreferrer"><LocationIcon className="h-4 w-4 mr-2 shrink-0" />Calle Falsa 123, San Justo</a></li><li className="py-1"><div className="flex space-x-3 mt-3"><a href="https://www.instagram.com/jcselguardian.oficial/" target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full flex items-center justify-center w-7 h-7" title="Instagram"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c-4.013 0-4.505.014-6.09.088C4.63.158 3.86.324 3.186.594c-.7.278-1.306.678-1.888 1.26C.716 2.44.316 3.046.038 3.746c-.27.674-.436 1.444-.508 3.03C- .55 1.807 2 2.3 2 6.314v11.372c0 4.013.014 4.505.088 6.09.074 1.586.238 2.356.508 3.03.278.7.678 1.306 1.26 1.888.582.582 1.188.982 1.888 1.26.674.27 1.444.436 3.03.508C7.807 21.986 8.3 22 12.315 22h.001c4.013 0 4.505-.014 6.09-.088 1.586-.074 2.356-.238 3.03-.508.7-.278 1.306-.678 1.888-1.26.582-.582.982-1.188 1.26-1.888.27-.674.436-1.444.508-3.03.074-1.585.088-2.077.088-6.09V6.314c0-4.013-.014-4.505-.088-6.09-.074-1.586-.238-2.356-.508-3.03-.278-.7-.678-1.306-1.26-1.888C21.56.316 20.954-.084 20.254 0c-.674-.27-1.444-.436-3.03-.508C16.82.014 16.328 0 12.315 0h-.001zm0 2.163c3.927 0 4.38.016 5.917.086 1.428.066 2.06.236 2.49.414.512.206.896.49 1.297.89.398.402.684.784.89 1.298.178.43.348 1.062.414 2.49.07 1.537.086 1.99.086 5.917s-.016 4.38-.086 5.917c-.066 1.428-.236 2.06-.414 2.49-.206.512-.49.896-.89 1.297-.402.398-.784.684-1.298.89-.43.178-1.062.348-2.49.414-1.537.07-1.99.086-5.917.086s-4.38-.016-5.917-.086c-1.428-.066-2.06-.236-2.49-.414-.512-.206-.896-.49-1.297-.89-.398-.402-.684-.784-.89-1.298-.178-.43-.348-1.062-.414-2.49-.07-1.537-.086-1.99-.086-5.917s.016-4.38.086-5.917c.066-1.428.236-2.06.414-2.49.206-.512.49-.896.89-1.297.402-.398.784-.684 1.298-.89.43-.178 1.062.348 2.49-.414C7.935 2.179 8.388 2.163 12.315 2.163zm0 12.315c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6zm0-10c-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4-1.791-4-4-4zm6.406-4.303c-.776 0-1.406.63-1.406 1.406s.63 1.406 1.406 1.406 1.406-.63 1.406-1.406-.63-1.406-1.406-1.406z" clipRule="evenodd" /></svg></a></div></li></ul></div></div><div className="border-t border-gray-700 pt-6 text-center text-xs text-gray-500"><p>© {new Date().getFullYear()} JCS El Guardián. Todos los derechos reservados.</p><div className="flex justify-center space-x-4 mt-4"><a href="#" className="hover:text-white">Términos</a><span>|</span><a href="#" className="hover:text-white">Privacidad</a></div></div></div><div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 py-2 px-4 flex justify-around items-center md:hidden z-40"><a href={`tel:${pN}`} className="flex flex-col items-center text-gray-400 hover:text-white px-1"><PhoneIcon className="h-5 w-5" /><span className="text-[10px] mt-1">Llamar</span></a><a href={`https://wa.me/${wN}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-gray-400 hover:text-white px-1"><WhatsAppIcon className="h-5 w-5" /><span className="text-[10px] mt-1">WhatsApp</span></a><a href="https://maps.google.com/?q=San+Justo,Buenos+Aires" target="_blank" className="flex flex-col items-center text-gray-400 hover:text-white px-1" rel="noreferrer"><LocationIcon className="h-5 w-5" /><span className="text-[10px] mt-1">Ubicación</span></a><button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} className="flex flex-col items-center text-gray-400 hover:text-white px-1"><ArrowUpIcon className="h-5 w-5" /><span className="text-[10px] mt-1">Subir</span></button></div></footer>) }


// --- Hero Section Component ---
interface HeroSectionProps {
    handleSearch: (filters: Record<string, string>) => void;
}
function HeroSection({ handleSearch }: HeroSectionProps) { 
  return (
    <div className="bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white mb-12 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-center bg-cover z-0" 
        style={{ backgroundImage: "url('https://res.cloudinary.com/dt5pkdr0k/image/upload/v1745032889/image_fx_55_ymeuvt.png')", opacity: 0.15 }}
      >
      </div>
      <div className="container mx-auto px-4 lg:px-6 py-16 md:py-24 text-center relative z-10">
        {/* <<< Apply font-heading CLASS with adjusted styles for Bebas Neue >>> */}
        <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4 drop-shadow-lg uppercase">
          JCS EL GUARDIÁN
        </h1>
        {/* <<< Subtitle remains font-sans >>> */}
        <p className="text-lg md:text-xl text-gray-200 font-sans mb-8 max-w-3xl mx-auto drop-shadow">
          Las mejores marcas en Neumáticos y Llantas. Servicios de Calidad y Confianza.
        </p>
        <CustomHeroSearch onSearch={handleSearch} />
      </div>
    </div>
  )
}


// --- Product Card Component ---
// --- Product Card Component (CON CARRUSEL INTEGRADO) ---
interface ProductCardProps {
    product: Product; // Producto es requerido aquí
    onProductSelect: (product: Product) => void;
}
function ProductCard({ product, onProductSelect }: ProductCardProps) {
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Estado local

  if (!product) return null; // Ya no debería ocurrir si product es requerido

  const isService = typeof product.price !== "number" || product.price <= 0;

  const imageUrls = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
    ? product.imageUrls
    : ["https://placehold.co/600x600/cccccc/ffffff?text=N/A"];

  const totalImages = imageUrls.length;
  const currentImageUrl = imageUrls[currentImageIndex];

  const nextImage = (e: MouseEvent<HTMLButtonElement>) => { // Tipar evento
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % totalImages);
  };

  const prevImage = (e: MouseEvent<HTMLButtonElement>) => { // Tipar evento
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + totalImages) % totalImages);
  };

  const handleViewDetails = () => {
    if (product) onProductSelect(product);
  };

  const handleMainButtonClick = (e: MouseEvent<HTMLButtonElement>) => { // Tipar evento
    e.stopPropagation();
    if (!isService && product) {
      addToCart(product);
    } else {
      handleViewDetails();
    }
  };

  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.target as HTMLImageElement;
      img.onerror = null;
      img.src = "https://placehold.co/600x600/cccccc/ffffff?text=Error";
  };

  const formattedPrice = !isService ? `$${product.price.toLocaleString("es-AR")}` : "Consultar";

  return (
    <Card className="flex flex-col group border border-gray-200/80 hover:shadow-xl transition-shadow duration-300 ease-in-out w-full max-w-[260px] flex-shrink-0 rounded-lg overflow-hidden">
      <div
        className="aspect-square w-full overflow-hidden bg-gray-100 relative group cursor-pointer"
        onClick={handleViewDetails}
      >
        <img
          key={currentImageUrl}
          src={currentImageUrl}
          alt={`Imagen ${currentImageIndex + 1} de ${product.name || "Producto"}`}
          className="w-full h-full object-cover transition-opacity duration-200 ease-in-out"
          loading="lazy"
          onError={handleImageError}
        />

        {totalImages > 1 && (
          <>
            <Button
              variant="ghost" size="icon" onClick={prevImage}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 focus:opacity-100 p-1"
              title="Anterior"
            > <ChevronLeftIcon /> </Button>
            <Button
               variant="ghost" size="icon" onClick={nextImage}
               className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 focus:opacity-100 p-1"
               title="Siguiente"
             > <ChevronRightIcon /> </Button>
             <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
               {imageUrls.map((_, index) => (
                 <button key={index} onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setCurrentImageIndex(index); }} // Tipar evento
                   className={`block w-1.5 h-1.5 rounded-full transition-all duration-150 ${ index === currentImageIndex ? 'bg-white scale-110' : 'bg-white/60 hover:bg-white/80' }`}
                   aria-label={`Ir a imagen ${index + 1}`}
                 />
               ))}
             </div>
          </>
        )}
      </div>

      <CardContent className="flex-grow flex flex-col justify-between p-3 bg-white">
        <div>
          <h3 className="text-sm font-semibold mb-1 line-clamp-2 cursor-pointer group-hover:text-red-600 transition-colors duration-200 h-10" onClick={handleViewDetails} title={product.name}>
            {product.name || 'Nombre no disponible'}
          </h3>
           {product.rating !== undefined && product.rating > 0 && ( // Verificar undefined
             <div className="flex items-center mb-1">
               {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < Math.round(product.rating || 0)} className="w-3.5 h-3.5" />)}
               <span className="text-xs text-gray-500 ml-1">({product.reviewCount || 0})</span>
             </div>
           )}
        </div>
        <div className="flex justify-between items-center mt-2">
          <div><span className={`text-base font-medium ${isService ? "text-red-600" : "text-gray-900"}`}>{formattedPrice}</span></div>
          <Button size="sm" variant={isService ? "outline" : "default"} onClick={handleMainButtonClick}>
            {isService ? "Info" : "Agregar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} // <-- Fin de la función ProductCard


// --- Image Carousel Component ---
interface CarouselItem {
    imageUrl?: string;
    title?: string;
    subtitle?: string;
    buttonText?: string;
    onClick?: () => void;
}
interface ImageCarouselProps {
    items: CarouselItem[];
}
function ImageCarousel({ items }: ImageCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null); // Tipar ref
    const scroll = (direction: 'left' | 'right') => { if (scrollRef.current) { const scrollAmount = scrollRef.current.offsetWidth; scrollRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" }); } };
    const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.target as HTMLImageElement;
        img.onerror = null;
        // Considerar poner un placeholder genérico o quitar la imagen
        img.style.backgroundColor = "#e0e0e0"; // Placeholder visual
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='; // Transparent pixel
    };
    if (!Array.isArray(items) || items.length === 0) return null; return (<div className="relative group"><div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">{items.map((item, i) => (<div key={i} className="w-full shrink-0 snap-center h-[40vh] md:h-[60vh] relative bg-gray-200"><img src={item.imageUrl || "/placeholder.svg"} alt={item.title || `Banner ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" onError={handleImageError} /><div className="absolute inset-0 bg-black/40"></div><div className="absolute inset-0 flex flex-col justify-end p-4 md:p-10 lg:p-16 text-white z-10">{item.title && <h2 className="text-xl md:text-4xl font-bold mb-1 md:mb-2">{item.title}</h2>}{item.subtitle && <p className="text-sm md:text-lg mb-2 md:mb-4 max-w-xl">{item.subtitle}</p>}{item.buttonText && (<Button variant="default" size="default" className="self-start mt-2 md:mt-0" onClick={item.onClick || (() => {})}>{item.buttonText}</Button>)}</div></div>))}</div>{items.length > 1 && (<><button onClick={() => scroll("left")} aria-label="Anterior" className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 md:p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60"><ChevronLeftIcon /></button><button onClick={() => scroll("right")} aria-label="Siguiente" className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 md:p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60"><ChevronRightIcon /></button></>)}</div>) }


// --- Storefront Component ---
interface StorefrontProps {
    setView: SetViewFunction;
    handleSearch: (filters: Record<string, string>) => void;
}
function Storefront({ setView, handleSearch }: StorefrontProps) { const { products } = useProducts(); const scrollContainerRef = useRef<HTMLDivElement>(null); const handleProductSelect = (product: Product) => { setView("productDetail", { product: product }); }; const scroll = (offset: number) => { if (scrollContainerRef.current) scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" }); }; const carouselItems: CarouselItem[] = [{ imageUrl: "https://res.cloudinary.com/dt5pkdr0k/image/upload/v1745032889/image_fx_55_ymeuvt.png", title: "¡Oferta Llantas!", subtitle: "Renová tus llantas.", buttonText: "Ver Llantas", onClick: () => setView("llantas"), }, { imageUrl: "https://placehold.co/1920x700/495057/ffffff?text=Servicio+Frenos", title: "Servicio de Frenos", subtitle: "Control y reparación.", buttonText: "Pedir Turno", onClick: () => setView("contacto"), },]; const [isMobile, setIsMobile] = useState(false); useEffect(() => { const check = () => setIsMobile(window.innerWidth < 768); check(); window.addEventListener("resize", check); return () => window.removeEventListener("resize", check); }, []); const displayProducts = Array.isArray(products) ? products : []; const limitedProducts = displayProducts.slice(0, 8); const tireProducts = displayProducts.filter(p => p.category === "neumatico"); const { addToCart } = useCart(); // Obtener addToCart para ProductGridMobile
return (<><HeroSection handleSearch={handleSearch} /><div id="productos-servicios" className="container mx-auto px-2 md:px-4 lg:px-6 py-6 md:py-12 scroll-mt-20"><div className="flex justify-between items-center mb-4 md:mb-6 px-2 md:px-0"><h2 className="text-lg md:text-2xl font-semibold">Productos y Servicios</h2>{!isMobile && displayProducts.length > 4 && (<div className="hidden sm:flex space-x-2"><Button variant="outline" size="icon" onClick={() => scroll(-300)} title="Scroll Izquierda"><ChevronLeftIcon /></Button><Button variant="outline" size="icon" onClick={() => scroll(300)} title="Scroll Derecha"><ChevronRightIcon /></Button></div>)}</div>{displayProducts.length === 0 ? (<p className="text-center text-gray-500 py-8">Cargando o no hay productos...</p>) : isMobile ? (<div className="grid grid-cols-2 gap-3 px-1">{limitedProducts.map((p) => (<ProductCardMobile key={p.id || Math.random()} product={p} onProductSelect={handleProductSelect}/>))}{tireProducts.length > 0 && (<div className="col-span-2 text-center mt-4"><Button variant="outline" size="sm" onClick={() => setView("neumaticos")}>Ver más</Button></div>)}</div>) : (<div ref={scrollContainerRef} className="flex overflow-x-auto space-x-4 pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 -mx-4 px-4">{displayProducts.map((p) => (<ProductCard key={p.id || Math.random()} product={p} onProductSelect={handleProductSelect} />))}</div>)}</div><div className="py-6 md:py-12"><ImageCarousel items={carouselItems} /></div>{typeof TestimonialsSection === "function" ? (<TestimonialsSection />) : (<div className="text-center py-8 text-gray-500">(Testimonials)</div>)}</>) }


// --- Product Detail Page (CON CARRUSEL DE IMAGEN) ---
interface ProductDetailProps {
    product: Product | null; // Puede ser null inicialmente
    setView: SetViewFunction;
}
function ProductDetail({ product, setView }: ProductDetailProps) {
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<"details" | "specs" | "reviews">("details");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!product) {
      console.warn("ProductDetail mounted without product.");
    } else {
      setActiveTab("details");
      setCurrentImageIndex(0); // Reset image index when product changes
    }
  }, [product]);

  if (!product) return <div className="container mx-auto p-12 text-center">Producto no encontrado o cargando...</div>;

  const isService = typeof product.price !== "number" || product.price <= 0;
  const handleAddToCartClick = () => { if (!isService) addToCart(product); else setView("contacto"); };

  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.target as HTMLImageElement;
      img.onerror = null;
      img.src = "https://placehold.co/800x800/cccccc/ffffff?text=Error";
  };

  // *** CORRECCIÓN AQUÍ: Asegura que imageUrls sea un array válido ***
  const imageUrls = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
    ? product.imageUrls
    : ["https://placehold.co/800x800/cccccc/ffffff?text=N/A"]; // Default placeholder if no images

  const currentImageUrl = imageUrls[currentImageIndex];

  const nextImage = () => setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
  const prevImage = () => setCurrentImageIndex((prevIndex) => (prevIndex - 1 + imageUrls.length) % imageUrls.length);

  const renderTabContent = () => {
    switch (activeTab) {
      case "details": return (<div className="text-sm text-gray-600 leading-relaxed prose max-w-none">{product.description || "Descripción no disponible."}</div>);
      case "specs": return (<ul className="text-sm text-gray-600 space-y-2">{product.specs && Object.entries(product.specs).length > 0 ? (Object.entries(product.specs).map(([key, value]) => (<li key={key} className="flex justify-between border-b pb-1 last:border-b-0"><span className="font-medium capitalize text-gray-500">{key.replace(/([A-Z])/g, " $1").trim()}:</span><span className="text-gray-800 text-right">{String(value ?? 'N/A')}</span></li>))) : (<li>Especificaciones no disponibles.</li>)}</ul>);
      case "reviews": return (<div className="text-sm text-gray-600"><p className="mb-4 font-medium">Opiniones ({product.reviewCount || 0}):</p>{(product.reviewCount || 0) > 0 ? (<>{/* Static Review Example */}<div className="border-t pt-4 mt-4"><div className="flex items-center mb-1">{[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < 4} />)}</div><p className="font-semibold text-xs text-gray-800">Juan P.- <span className="text-gray-500 font-normal">Hace 2 días</span></p><p className="mt-1">"Muy buen producto."</p></div><div className="border-t pt-4 mt-4"><div className="flex items-center mb-1">{[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < 5} />)}</div><p className="font-semibold text-xs text-gray-800">María G.- <span className="text-gray-500 font-normal">Hace 1 semana</span></p><p className="mt-1">"Servicio rápido."</p></div></>) : (<p className="text-gray-500 italic">Aún no hay reseñas.</p>)}<Button variant="outline" size="sm" className="mt-6 w-full" disabled onClick={() => {}}>Escribir reseña (Próx.)</Button></div>); // Añadir onClick vacío para satisfacer Button
      default: return null;
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 md:py-12">
      <Button variant="outline" size="sm" onClick={() => window.history.length > 1 ? window.history.back() : setView("storefront")} className="mb-6 inline-flex items-center gap-2"><ArrowLeftIcon /> Volver</Button>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
        {/* Columna Izquierda - Imagen y Thumbnails */}
        <div className="md:col-span-7 lg:col-span-7">
          <div className="sticky top-24">
            {/* Imagen Principal con Carrusel */}
            <Card className="mb-4 shadow-sm relative group aspect-square flex items-center justify-center overflow-hidden bg-gray-100">
              <img
                key={currentImageUrl} // Forçar re-render na mudança para animar
                src={currentImageUrl}
                alt={`Imagen ${currentImageIndex + 1} de ${product.name || 'Producto'}`}
                className="max-w-full max-h-full object-contain transition-opacity duration-300 ease-in-out animate-fadeIn"
                onError={handleImageError}
              />
              {imageUrls.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" onClick={prevImage} aria-label="Anterior" className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50">
                    <ChevronLeftIcon />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={nextImage} aria-label="Siguiente" className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50">
                    <ChevronRightIcon />
                  </Button>
                  {/* Indicadores de Puntos */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                    {imageUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                        aria-label={`Ir a imagen ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* Thumbnails */}
            {imageUrls.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-16 h-16 flex-shrink-0 rounded border-2 p-0.5 overflow-hidden transition-all ${index === currentImageIndex ? 'border-red-500 ring-1 ring-red-500 ring-offset-1' : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e: SyntheticEvent<HTMLImageElement, Event>) => { const img = e.target as HTMLImageElement; img.onerror = null; img.src='https://placehold.co/64x64/eee/ccc?text=Err';}} // Tipar evento
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha - Detalles y Acciones */}
        {/* ... (resto del JSX sin cambios estructurales pero ahora usa product tipado) ... */}
        <div className="md:col-span-5 lg:col-span-5 flex flex-col">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm mb-5">
             <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-2 self-start">{categories.find((c) => c.value === product.category)?.label || "Producto"}</span>
             <h1 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">{product.name || 'Nombre no disponible'}</h1>
              {product.rating !== undefined && product.rating > 0 && (<div className="flex items-center mb-3 text-sm"><div className="flex">{[1, 2, 3, 4, 5].map((star) => (<StarIcon key={star} filled={star <= Math.round(product.rating || 0)} />))}</div><button className="text-gray-500 ml-2 hover:underline cursor-pointer text-sm" onClick={() => setActiveTab("reviews")}>({product.reviewCount || 0} opiniones)</button></div>)}
             <div className="mb-4"><span className={`text-2xl md:text-3xl font-bold ${isService ? "text-red-600" : "text-black"}`}>{isService ? "Consultar Precio" : `$${product.price?.toLocaleString("es-AR") ?? 'N/A'}`}</span></div>
             <Button size="lg" variant={isService ? "outline" : "default"} className="w-full mb-3" onClick={handleAddToCartClick} disabled={!isService && (!product || typeof product.price !== 'number')}> {isService ? "Solicitar Consulta" : "Agregar al Carrito"} </Button>
              {/* ** CORRECCIÓN DE LINTER ** */}
              <div className="text-xs text-gray-500 space-y-1 border-t pt-3"><p className="flex items-center gap-1.5"><UserIcon className="w-4 h-4" /> Vendido por: <span className="font-medium text-gray-700">JCS El Guardián</span><ShieldCheckIcon className="w-4 h-4 text-green-600 ml-1" /></p><p className="flex items-center gap-1.5"><StoreIcon className="w-4 h-4" /> Retiro <span className="font-medium text-green-600">Gratis</span> en San Justo</p><p className="flex items-center gap-1.5"><TruckIcon className="w-4 h-4" /> Envío a coordinar</p></div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex-grow">
             <div className="border-b border-gray-200 mb-4"><nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide" aria-label="Tabs"><button onClick={() => setActiveTab("details")} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === "details" ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>Detalles</button>{product.specs && Object.keys(product.specs).length > 0 && (<button onClick={() => setActiveTab("specs")} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === "specs" ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>Especificaciones</button>)}<button onClick={() => setActiveTab("reviews")} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === "reviews" ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>Reseñas ({product.reviewCount || 0})</button></nav></div>
             <div className="mt-4">{renderTabContent()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}


// --- Category Page Component ---
type FilterType = "deportiva" | "chapa" | "r14" | "r15" | "r17" | "alineacion" | "reparacion" | "aceite" | null;
interface CategoryPageProps {
    category: string; // 'neumatico', 'llanta', etc.
    categoryLabel: string;
    setView: SetViewFunction;
    currentFilters?: Record<string, string | number>; // Filtros de HeroSearch
    filterType?: FilterType; // Filtros de MegaMenu
    initialBrandFilter?: string | null; // Filtro de marca inicial
    // Añadir product y handleSearch para compatibilidad con renderMainLayout
    product?: Product | null; // Ignorado aquí pero requerido por renderMainLayout
    handleSearch?: (filters: Record<string, string>) => void; // Ignorado aquí
}
function CategoryPage({
  category,
  categoryLabel,
  setView,
  currentFilters = {},
  filterType = null,
  initialBrandFilter = null,
}: CategoryPageProps) {
  const { products } = useProducts();
  const [selectedBrand, setSelectedBrand] = useState(initialBrandFilter || "");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");

  // Calcular marcas disponibles
  const availableBrands = useMemo(() => {
      const safeProducts = Array.isArray(products) ? products : [];
      if (!safeProducts || !category) return [];
      let categoryProducts = safeProducts.filter(p => p && p.category === category);
      // Aplica filtros de HeroSearch ANTES de sacar las marcas
      if (currentFilters.ancho) { categoryProducts = categoryProducts.filter((p) => p && String(p.specs?.ancho) === String(currentFilters.ancho)); }
      if (currentFilters.perfil) { categoryProducts = categoryProducts.filter((p) => p && String(p.specs?.perfil) === String(currentFilters.perfil)); }
      if (currentFilters.diametro) { categoryProducts = categoryProducts.filter((p) => p && String(p.specs?.rodado) === String(currentFilters.diametro)); }
      const brands = new Set(categoryProducts.map(p => getProductBrand(p)).filter((b): b is string => b !== null && b !== 'Otros')); // Filtrar null y 'Otros' y asegurar string
      return Array.from(brands).sort();
  }, [products, category, currentFilters]);

  // Lógica de filtrado combinada
  const filteredProducts: Product[] = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    if (!safeProducts) return [];
    let results = safeProducts.filter((p) => p && p.category === category);

    // 1. Filtros de HeroSearch
    if (category === 'neumatico' || category === 'llanta') {
        if (currentFilters.ancho) { results = results.filter((p) => p && String(p.specs?.ancho) === String(currentFilters.ancho)); }
        if (currentFilters.perfil && category === 'neumatico') { results = results.filter((p) => p && String(p.specs?.perfil) === String(currentFilters.perfil)); }
        if (currentFilters.diametro) { results = results.filter((p) => p && String(p.specs?.rodado) === String(currentFilters.diametro)); }
    }

    // 2. Filtro de subtipo (MegaMenu)
    if (filterType) {
        switch (filterType) {
            case "deportiva": results = results.filter((p) => p && p.name?.toLowerCase().includes("deportiva")); break;
            case "chapa": results = results.filter((p) => p && p.name?.toLowerCase().includes("chapa")); break;
            case "r14": case "r15": case "r17": const rodadoNum = filterType.substring(1); results = results.filter((p) => p && String(p.specs?.rodado) === rodadoNum); break;
            case "alineacion": results = results.filter(p => p && p.name?.toLowerCase().includes("alineaci")); break;
            case "reparacion": results = results.filter(p => p && p.name?.toLowerCase().includes("reparaci")); break;
            case "aceite": results = results.filter(p => p && p.name?.toLowerCase().includes("aceite")); break;
        }
    }

    // 3. Filtro de marca
    const activeBrandFilter = selectedBrand || initialBrandFilter;
    if (activeBrandFilter) {
        results = results.filter(p => { if(!p) return false; const productBrand = getProductBrand(p); return productBrand?.toLowerCase() === activeBrandFilter.toLowerCase(); });
    }

    // 4. Filtro de precio
    if (selectedPriceRange) {
        const [minStr, maxStr] = selectedPriceRange.split('-');
        const minPrice = parseInt(minStr);
        const maxPrice = maxStr ? parseInt(maxStr) : Infinity;
        results = results.filter(p => { if (!p || typeof p.price !== 'number' || p.price <= 0) return false; return p.price >= minPrice && p.price <= maxPrice; });
    }

    return results;
  }, [products, category, currentFilters, filterType, selectedBrand, selectedPriceRange, initialBrandFilter]);

  const handleProductSelect = (product: Product) => { setView("productDetail", { product: product }); };
  const handleBrandChange = (e: ChangeEvent<HTMLSelectElement>) => { setSelectedBrand(e.target.value); };
  const handlePriceChange = (e: ChangeEvent<HTMLSelectElement>) => { setSelectedPriceRange(e.target.value); };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { const c = () => setIsMobile(window.innerWidth < 768); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);

  const hasActiveSearchFilters = currentFilters.ancho || currentFilters.perfil || currentFilters.diametro;
  const activeBrandFilter = selectedBrand || initialBrandFilter;
  let pageTitle = categoryLabel;
  if (activeBrandFilter) { pageTitle = `${categoryLabel} ${activeBrandFilter}`; }
  else if (hasActiveSearchFilters) { pageTitle = `Resultados ${categoryLabel}`; }
  else if (filterType) {
    if (filterType === 'deportiva') pageTitle = 'Llantas Deportivas';
    else if (filterType === 'chapa') pageTitle = 'Llantas de Chapa';
    else if (filterType.startsWith('r')) pageTitle = `Llantas Rodado ${filterType.substring(1)}"`;
  }

  const priceRanges = [ { value: "0-100000", label: "Hasta $100.000" }, { value: "100001-200000", label: "$100.001 - $200.000" }, { value: "200001-300000", label: "$200.001 - $300.000" }, { value: "300001-500000", label: "$300.001 - $500.000" }, { value: "500001", label: "Más de $500.000" }, ];
  const { addToCart } = useCart(); // Necesario para ProductGridMobile

  return (
    <div className="container mx-auto px-0 md:px-4 lg:px-6 py-4 md:py-12">
      {isMobile ? (
        <ProductGridMobile products={filteredProducts} onProductSelect={handleProductSelect} categoryLabel={pageTitle} setView={setView} addToCart={addToCart}/>
      ) : (
        <>
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">
            {pageTitle}
            {hasActiveSearchFilters && !activeBrandFilter && (
              <span className="block text-sm font-normal text-gray-500 mt-1">
                (Filtros: {Object.entries(currentFilters).filter(([key, val]) => key !== 'category' && val).map(([key, val]) => `${key=='diametro'?'R':''}${val}`).join('/')})
              </span>
            )}
          </h1>
          <div className="mb-6 md:mb-8 px-4 md:px-0">
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 md:p-4 rounded-md border shadow-sm">
              <span className="text-sm font-medium text-gray-700 shrink-0 hidden md:block">Filtrar por:</span>
              {category === 'neumatico' && availableBrands.length > 0 && (
                  <div className="w-full md:w-auto md:flex-1">
                      <Label htmlFor="brand-filter" className="sr-only md:hidden">Marca</Label>
                      <Select id="brand-filter" value={selectedBrand} onChange={handleBrandChange} className="text-sm h-9 w-full">
                          <option value="">Todas las Marcas ({availableBrands.length})</option>
                          {availableBrands.map(brand => ( <option key={brand} value={brand}>{brand}</option> ))}
                      </Select>
                  </div>
              )}
              {category !== 'servicio' && (
                <div className="w-full md:w-auto md:flex-1">
                    <Label htmlFor="price-filter" className="sr-only md:hidden">Precio</Label>
                    <Select id="price-filter" value={selectedPriceRange} onChange={handlePriceChange} className="text-sm h-9 w-full">
                        <option value="">Todos los Precios</option>
                        {priceRanges.map(range => ( <option key={range.value} value={range.value}>{range.label}</option> ))}
                    </Select>
                </div>
              )}
               {category === 'neumatico' && (
                  <Button variant="ghost" size="sm" onClick={() => setView('shopByBrand')} className="ml-auto h-9 text-xs hidden md:inline-flex">
                      Ver Todas las Marcas
                  </Button>
              )}
               {(selectedBrand || selectedPriceRange || hasActiveSearchFilters || filterType) && (
                 <Button variant="link" size="sm" onClick={() => { setSelectedBrand(''); setSelectedPriceRange(''); setView(category as ViewName, { filters: { category: category } }) }} className="text-xs h-9">
                     Limpiar Filtros
                 </Button>
                )}
            </div>
          </div>
          {filteredProducts.length === 0 ? (
             <p className="text-center text-gray-500 py-8">No se encontraron productos con los filtros seleccionados.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 justify-items-center">
              {filteredProducts.map((product) => (<ProductCard key={product.id || Math.random()} product={product} onProductSelect={handleProductSelect} />))}
            </div>
          )}
          <div className="text-center mt-10 md:mt-12">
            <Button variant="outline" onClick={() => setView("storefront")}>
              {activeBrandFilter || selectedPriceRange || hasActiveSearchFilters || filterType ? "Ver Todos los Productos" : "Volver al Inicio"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}


// --- Contacto Page Component ---
function ContactoPage() { const pN = "(011) 1234-5678"; const em = "info@jcselguardian.com.ar"; const ad = "Av. Pres. Dr. Arturo Umberto Illia 2869, B1754 San Justo, Provincia de Buenos Aires"; const sc = "L-V 8-18hs, Sáb 8-13hs."; const mq = "JCS+El+Guardián+San+Justo"; const key = "YOUR_GOOGLE_MAPS_API_KEY"; // <-- REEMPLAZA CON TU API KEY REAL
 return (<div className="container mx-auto px-4 lg:px-6 py-10 md:py-16"><h1 className="text-3xl font-bold mb-8 text-center">Contacto</h1><div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12"><div className="bg-white p-6 rounded-lg shadow border border-gray-200"><h2 className="text-xl font-semibold mb-4 text-gray-800">Información de Contacto</h2><p className="text-gray-600 mb-5 text-sm">Ponte en contacto con nosotros.</p><ul className="space-y-3 text-gray-700 text-sm"><li className="flex items-start"><PhoneIcon className="w-4 h-4 mr-2 mt-0.5 text-red-600 shrink-0" /><a href={`tel:${pN.replace(/\D/g, "")}`} className="hover:text-red-700"><strong>Tel:</strong> {pN}</a></li><li className="flex items-start"><UserIcon className="w-4 h-4 mr-2 mt-0.5 text-red-600 shrink-0" /><a href={`mailto:${em}`} className="hover:text-red-700 break-all"><strong>Email:</strong> {em}</a></li><li className="flex items-start"><LocationIcon className="w-4 h-4 mr-2 mt-0.5 text-red-600 shrink-0" /><a href={`https://maps.google.com/?q=${encodeURIComponent(ad)}`} target="_blank" rel="noreferrer" className="hover:text-red-700"><strong>Dirección:</strong> {ad}</a></li><li className="flex items-start"><ClockIcon className="w-4 h-4 mr-2 mt-0.5 text-red-600 shrink-0" /><span><strong>Horario:</strong> {sc}</span></li></ul><div className="mt-6 pt-4 border-t"><h3 className="text-sm font-semibold text-gray-600 mb-2">Síguenos:</h3><div className="flex space-x-3"><a href="https://www.instagram.com/jcselguardian.oficial/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-600" title="Instagram"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c-4.013 0-4.505.014-6.09.088C4.63.158 3.86.324 3.186.594c-.7.278-1.306.678-1.888 1.26C.716 2.44.316 3.046.038 3.746c-.27.674-.436 1.444-.508 3.03C- .55 1.807 2 2.3 2 6.314v11.372c0 4.013.014 4.505.088 6.09.074 1.586.238 2.356.508 3.03.278.7.678 1.306 1.26 1.888.582.582 1.188.982 1.888 1.26.674.27 1.444.436 3.03.508C7.807 21.986 8.3 22 12.315 22h.001c4.013 0 4.505-.014 6.09-.088 1.586-.074 2.356-.238 3.03-.508.7-.278 1.306-.678 1.888-1.26.582-.582.982-1.188 1.26-1.888.27-.674.436-1.444.508-3.03.074-1.585.088-2.077.088-6.09V6.314c0-4.013-.014-4.505-.088-6.09-.074-1.586-.238-2.356-.508-3.03-.278-.7-.678-1.306-1.26-1.888C21.56.316 20.954-.084 20.254 0c-.674-.27-1.444-.436-3.03-.508C16.82.014 16.328 0 12.315 0h-.001zm0 2.163c3.927 0 4.38.016 5.917.086 1.428.066 2.06.236 2.49.414.512.206.896.49 1.297.89.398.402.684.784.89 1.298.178.43.348 1.062.414 2.49.07 1.537.086 1.99.086 5.917s-.016 4.38-.086 5.917c-.066 1.428-.236 2.06-.414 2.49-.206.512-.49.896-.89 1.297-.402.398-.784.684-1.298.89-.43.178-1.062.348-2.49.414-1.537.07-1.99.086-5.917.086s-4.38-.016-5.917-.086c-1.428-.066-2.06-.236-2.49-.414-.512-.206-.896-.49-1.297-.89-.398-.402-.684-.784-.89-1.298-.178-.43-.348-1.062-.414-2.49-.07-1.537-.086-1.99-.086-5.917s.016-4.38.086-5.917c.066-1.428.236-2.06.414-2.49.206-.512.49-.896.89-1.297.402-.398.784-.684 1.298-.89.43-.178 1.062.348 2.49-.414C7.935 2.179 8.388 2.163 12.315 2.163zm0 12.315c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6zm0-10c-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4-1.791-4-4-4zm6.406-4.303c-.776 0-1.406.63-1.406 1.406s.63 1.406 1.406 1.406 1.406-.63 1.406-1.406-.63-1.406-1.406-1.406z" clipRule="evenodd" /></svg></a></div></div></div><div className="bg-white p-6 rounded-lg shadow border border-gray-200"><h2 className="text-xl font-semibold mb-4 text-gray-800">Envíanos un Mensaje</h2><form onSubmit={(e: FormEvent<HTMLFormElement>) => {e.preventDefault(); alert('Formulario enviado (simulación).');}}><div className="space-y-4"><div><Label htmlFor="contact-name">Nombre</Label><Input id="contact-name" type="text" placeholder="Tu nombre" required /></div><div><Label htmlFor="contact-email">Email</Label><Input id="contact-email" type="email" placeholder="tu@email.com" required /></div><div><Label htmlFor="contact-subject">Asunto</Label><Input id="contact-subject" type="text" placeholder="Consulta sobre..." /></div><div><Label htmlFor="contact-message">Mensaje</Label><Textarea id="contact-message" placeholder="Escribe tu consulta..." rows={4} required /></div><div className="text-right pt-2"><Button type="submit" onClick={() => {}}>Enviar Mensaje</Button></div></div></form></div></div><div className="mt-12 md:mt-16"><h2 className="text-xl font-semibold mb-4 text-center text-gray-800">Nuestra Ubicación</h2><div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden shadow border">{key !== "YOUR_GOOGLE_MAPS_API_KEY" && key ? (<iframe src={`https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(ad)}`} width="100%" height="100%" style={{ border: 0 }} allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Ubicación"></iframe>) : (<div className="flex items-center justify-center h-full text-gray-500">Mapa no disponible (Configura API Key)</div>)}</div></div></div>) }


// --- Cart Page Component ---
interface CartPageProps {
    setView: SetViewFunction;
}
function CartPage({ setView }: CartPageProps) { const { cartItems, removeFromCart, updateQuantity, clearCart, totalPrice, totalItems } = useCart(); const validCartItems = Array.isArray(cartItems) ? cartItems : [];
const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src="https://placehold.co/64x64/cccccc/ffffff?text=Err";
};
return (<div className="container mx-auto px-4 lg:px-6 py-8 md:py-12"><h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Carrito</h1>{validCartItems.length === 0 ? (<div className="text-center py-10 bg-gray-50 rounded-lg border"><CartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />... (resto JSX)...</div>) : (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"><div className="lg:col-span-2 space-y-4">{validCartItems.map((item: CartItem) => (<div key={item.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg shadow-sm bg-white"><div className="flex items-center gap-4 flex-grow w-full sm:w-auto"><img src={item.imageUrl || "https://placehold.co/64x64/cccccc/ffffff?text=N/A"} alt={item.name} className="w-16 h-16 object-contain rounded border p-1 shrink-0" onError={handleImageError} /><div className="flex-grow"><h3 className="font-semibold text-sm sm:text-base line-clamp-2">{item.name}</h3><p className="text-gray-600 text-sm mt-1">${item.price?.toLocaleString("es-AR") || "N/A"}</p></div></div><div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 mt-3 sm:mt-0 w-full sm:w-auto"><div className="flex items-center border rounded"><button onClick={()=>updateQuantity(item.id,(item.quantity||1)-1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50" disabled={(item.quantity||1)<=1} title="Disminuir">-</button><span className="px-3 py-1 text-sm font-medium w-8 text-center">{item.quantity||1}</span><button onClick={()=>updateQuantity(item.id,(item.quantity||1)+1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100" title="Aumentar">+</button></div><Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 p-1.5" onClick={()=>removeFromCart(item.id)} title="Eliminar"><TrashIcon className="w-4 h-4" /></Button></div></div>))}{validCartItems.length > 0 && <div className="text-right mt-4"><Button variant="outline" size="sm" onClick={clearCart}>Vaciar Carrito</Button></div>}</div><div className="lg:col-span-1 bg-gray-50 p-5 md:p-6 rounded-lg shadow-sm border self-start sticky top-24">... (resto JSX)...</div></div>)}</div>) }


// --- Checkout Page Component ---
interface CheckoutPageProps {
    setView: SetViewFunction;
}
function CheckoutPage({ setView }: CheckoutPageProps) {
  const { cartItems, totalPrice, clearCart } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("creditCard");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: ""
  });
  const [saveInfo, setSaveInfo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const validCartItems = Array.isArray(cartItems) ? cartItems : [];
  
  // Redireccionar si carrito vacío
  useEffect(() => {
    if (validCartItems.length === 0 && !orderPlaced) {
      const timer = setTimeout(() => setView('cart'), 50);
      return () => clearTimeout(timer);
    }
  }, [validCartItems, orderPlaced, setView]);
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log("Orden confirmada:", { 
      items: validCartItems, 
      total: totalPrice, 
      paymentMethod, 
      customerInfo: formData,
      saveInfo
    });
    
    setOrderPlaced(true);
    clearCart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsProcessing(false);
  };

  if (orderPlaced) {
    return (
      <div className="container mx-auto px-4 lg:px-6 py-12 md:py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">¡Pedido Confirmado!</h1>
          <p className="text-gray-600 mb-6">Hemos recibido tu pedido correctamente. Nos pondremos en contacto para coordinar la entrega.</p>
          <p className="text-sm text-gray-500 mb-8">Referencia: #{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
          <Button variant="default" onClick={() => setView("storefront")} className="bg-red-600 hover:bg-red-700 px-8">
            Volver a la Tienda
          </Button>
        </div>
      </div>
    );
  }

  if (validCartItems.length === 0) {
    return <div className="container mx-auto p-12 text-center">Redirigiendo...</div>;
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
        {/* Panel derecho - Resumen del pedido */}
        <div className="lg:col-span-1 order-last lg:order-first bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-xl shadow-lg self-start sticky top-24 text-white">
          <h2 className="text-xl font-semibold mb-5 flex items-center">
            <span className="bg-white/20 p-2 rounded-lg mr-3">
              <CartIcon className="w-5 h-5" />
            </span>
            Resumen del Pedido
          </h2>
          
          <div className="max-h-60 overflow-y-auto pr-2 space-y-3 mb-5">
            {validCartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-white/10">
                <div className="bg-white rounded-md p-1 w-10 h-10 flex-shrink-0">
                  <img 
                    src={item.imageUrl || "https://placehold.co/40x40"} 
                    alt={item.name} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <div className="flex justify-between text-xs text-white/80">
                    <span>{item.quantity}x ${item.price.toLocaleString("es-AR")}</span>
                    <span>${(item.price * (item.quantity || 1)).toLocaleString("es-AR")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-2 py-4 border-t border-b border-white/10 mb-4">
            <div className="flex justify-between">
              <span className="text-white/80">Subtotal</span>
              <span>${totalPrice.toLocaleString("es-AR")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/80">Envío</span>
              <span>A coordinar</span>
            </div>
          </div>
          
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${totalPrice.toLocaleString("es-AR")}</span>
          </div>
          
          <div className="mt-6 pt-5 border-t border-white/10 text-xs text-white/70">
            <div className="flex items-start gap-2">
              <ShieldCheckIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Compra segura garantizada. Todos tus datos están protegidos.</span>
            </div>
          </div>
        </div>
        
        {/* Panel izquierdo - Formulario */}
        <div className="lg:col-span-2">
          <form onSubmit={handleConfirmOrder} className="space-y-8">
            {/* Datos personales */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-5">Datos de Contacto</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="Tu nombre y apellido" 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="tu@email.com" 
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="(011) 1234-5678" 
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            {/* Dirección */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-5">Dirección de Entrega</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input 
                    id="address" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange} 
                    placeholder="Calle, número, piso, depto." 
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input 
                      id="city" 
                      name="city" 
                      value={formData.city} 
                      onChange={handleInputChange} 
                      placeholder="Ciudad" 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input 
                      id="postalCode" 
                      name="postalCode" 
                      value={formData.postalCode} 
                      onChange={handleInputChange} 
                      placeholder="C.P." 
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notas adicionales</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleInputChange} 
                    placeholder="Instrucciones especiales para la entrega" 
                    rows={3} 
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            {/* Métodos de pago */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-5">Método de Pago</h3>
              
              <div className="space-y-3">
                <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'efectivo' ? 'bg-red-50 border-red-400' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="efectivo" 
                      checked={paymentMethod === 'efectivo'} 
                      onChange={() => setPaymentMethod('efectivo')} 
                      className="w-4 h-4 text-red-600" 
                    />
                    <span className="ml-3 font-medium">Efectivo al retirar</span>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-gray-600">
                    $
                  </div>
                </label>
                
                <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'transferencia' ? 'bg-red-50 border-red-400' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="transferencia" 
                      checked={paymentMethod === 'transferencia'} 
                      onChange={() => setPaymentMethod('transferencia')} 
                      className="w-4 h-4 text-red-600" 
                    />
                    <span className="ml-3 font-medium">Transferencia bancaria</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="p-1.5 bg-blue-500 text-white rounded-md text-xs">Transfer</span>
                  </div>
                </label>
                
                <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'creditCard' ? 'bg-red-50 border-red-400' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="creditCard" 
                      checked={paymentMethod === 'creditCard'} 
                      onChange={() => setPaymentMethod('creditCard')} 
                      className="w-4 h-4 text-red-600" 
                    />
                    <span className="ml-3 font-medium">Tarjeta de crédito/débito</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-8 h-5 bg-gray-200 rounded"></div>
                    <div className="w-8 h-5 bg-red-500 rounded"></div>
                    <div className="w-8 h-5 bg-blue-500 rounded"></div>
                  </div>
                </label>
                
                <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'mercadopago' ? 'bg-red-50 border-red-400' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="mercadopago" 
                      checked={paymentMethod === 'mercadopago'} 
                      onChange={() => setPaymentMethod('mercadopago')} 
                      className="w-4 h-4 text-red-600" 
                    />
                    <span className="ml-3 font-medium">Mercado Pago</span>
                  </div>
                  <div className="w-8 h-8 bg-blue-500 rounded-md"></div>
                </label>
              </div>
              
              <div className="mt-5 flex items-center">
                <input 
                  type="checkbox" 
                  id="saveInfo" 
                  checked={saveInfo} 
                  onChange={() => setSaveInfo(!saveInfo)} 
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
                />
                <label htmlFor="saveInfo" className="ml-2 block text-sm text-gray-600">
                  Guardar información para futuras compras
                </label>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setView("cart")}
                size="lg"
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Volver al Carrito
              </Button>
              <Button 
                type="submit" 
                variant="default" 
                size="lg"
                disabled={isProcessing}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 transition-all order-1 sm:order-2 min-w-[200px]"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <span>Confirmar Pedido</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


// --- Side Cart Component ---
interface SideCartProps {
    isOpen: boolean;
    onClose: () => void;
    setView: SetViewFunction;
}
function SideCart({ isOpen, onClose, setView }: SideCartProps) {
  const { cartItems, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const validCartItems = Array.isArray(cartItems) ? cartItems : [];
  const navigate = (view: ViewName) => { setView(view); onClose(); };
  const [isMounted, setIsMounted] = useState(false); // <<< AÑADIR ESTADO
  
  // <<< AÑADIR USEEFFECT >>>
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = "https://placehold.co/56x56/cccccc/ffffff?text=Err";
  };
  
  return (
    <>
      {/* Capa oscura de fondo */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} 
        onClick={onClose} 
        aria-hidden="true"
      ></div>
      
      {/* Panel del carrito */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-xs sm:max-w-sm bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="slide-over-title"
      >
        {/* Encabezado */}
        <div className="px-4 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 id="slide-over-title" className="text-lg font-semibold text-gray-900">
            {/* <<< CONDICIONAR EL RENDERIZADO >>> */}
            Carrito ({isMounted ? totalItems : 0})
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <XMarkIcon />
          </button>
        </div>
        
        {/* Contenido del carrito */}
        <div className="flex-grow overflow-y-auto py-4 px-4">
          {/* <<< AÑADIR CONDICIONAL isMounted AQUÍ >>> */}
          {!isMounted ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              {/* Puedes poner un spinner o un placeholder simple aquí si quieres */}
              <p className="text-sm italic">Cargando...</p>
            </div>
          ) : validCartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <CartIcon className="w-12 h-12 mb-3" />
              <p className="text-sm">El carrito está vacío</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate("storefront")} 
                variant="outline" 
                size="sm"
              >
                Ir a la Tienda
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {validCartItems.map((item) => (
                <div key={item.id} className="flex gap-3 py-3 border-b">
                  <div className="h-14 w-14 flex-shrink-0 border rounded bg-gray-50">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="h-full w-full object-contain p-1" 
                      onError={handleImageError}
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm font-medium line-clamp-2">{item.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-sm font-semibold">
                        ${item.price.toLocaleString("es-AR")}
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)} 
                          className="w-6 h-6 flex items-center justify-center rounded-full border text-gray-500 hover:bg-gray-100"
                          disabled={(item.quantity || 1) <= 1}
                        >
                          -
                        </button>
                        <span className="mx-2 text-sm">{item.quantity || 1}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)} 
                          className="w-6 h-6 flex items-center justify-center rounded-full border text-gray-500 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pie - Total y botones */}
        {/* <<< AÑADIR isMounted AQUÍ TAMBIÉN >>> */}
        {isMounted && validCartItems.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex justify-between mb-3">
              <span className="font-semibold">Total</span>
              <span className="font-bold">${totalPrice.toLocaleString("es-AR")}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate("cart")}
              >
                Ver Carrito
              </Button>
              <Button 
                variant="default" 
                onClick={() => navigate("checkout")}
              >
                Finalizar
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}


// --- Admin Components ---
interface AdminLoginProps {
    setView: SetViewFunction;
    setIsAdmin: (isAdmin: boolean) => void;
}
function AdminLogin({ setView, setIsAdmin }: AdminLoginProps) { const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const login = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); if (pw === "admin123") { setIsAdmin(true); try { localStorage.setItem("isAdminLoggedIn", "true"); } catch (error) { console.error(error); } setView("adminDashboard"); setErr(""); } else { setErr("Contraseña incorrecta."); setIsAdmin(false); try { localStorage.setItem("isAdminLoggedIn", "false"); } catch (error) { console.error(error); } } }; return (<div className="flex justify-center items-center min-h-screen bg-gray-100">... (Formulario JSX - usar Inputs/Buttons tipados) ...</div>) }

interface AdminDashboardProps {
    setView: SetViewFunction;
    setIsAdmin: (isAdmin: boolean) => void;
}
// ** CORRECCIÓN ESTRUCTURAL Y DE TIPOS **
const AdminDashboard: FC<AdminDashboardProps> = ({ setView, setIsAdmin }) => {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  // Tipar estado del formulario parcialmente, idealmente usar una interfaz
  const [formData, setFormData] = useState({
    name: "", description: "", price: "",
    imageUrls: "[]", // Mantener como string para Textarea
    category: "accesorio", specs: "{}", rating: "0", reviewCount: "0",
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); // Tipar producto en edición
  const [showForm, setShowForm] = useState(false);
  const [specError, setSpecError] = useState('');
  const [imageUrlsError, setImageUrlsError] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || "",
        description: editingProduct.description || "",
        price: editingProduct.price !== undefined ? String(editingProduct.price) : "",
        imageUrls: JSON.stringify(editingProduct.imageUrls || [], null, 2), // Convertir a string JSON
        category: editingProduct.category || "accesorio",
        specs: JSON.stringify(editingProduct.specs || {}, null, 2), // Convertir a string JSON
        rating: String(editingProduct.rating || 0),
        reviewCount: String(editingProduct.reviewCount || 0),
      });
      setShowForm(true);
      setSpecError('');
      setImageUrlsError('');
    } else {
      handleCancel(); // Usar handleCancel para resetear
    }
  }, [editingProduct]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { // Tipar evento
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'specs') setSpecError('');
    if (name === 'imageUrls') setImageUrlsError('');
  };

  // ** CORRECCIÓN DE TIPOS EN HANDLERS **
  const handleEdit = (product: Product) => { setEditingProduct(product); };
  const handleDelete = (id: string | number) => { if (window.confirm("¿Eliminar producto?")) deleteProduct(id); };
  const handleCancel = () => { setEditingProduct(null); setShowForm(false); setFormData({ name: "", description: "", price: "", imageUrls: "[]", category: "accesorio", specs: "{}", rating: "0", reviewCount: "0" }); setSpecError(''); setImageUrlsError(''); };
  const handleLogout = () => { setIsAdmin(false); try { localStorage.setItem("isAdminLoggedIn", "false"); } catch (e) { console.error(e); } setView("storefront"); };

 const handleSubmit = (e: FormEvent<HTMLFormElement>) => { // Tipar evento
    e.preventDefault();
    let parsedSpecs: ProductSpec = {}; // Usar interfaz
    let parsedImageUrls: string[] = []; // Array de strings

    // Validate Specs JSON
    try {
      const specsInput = formData.specs.trim();
      if (specsInput) { // Only parse if not empty
          parsedSpecs = JSON.parse(specsInput);
      if (typeof parsedSpecs !== 'object' || parsedSpecs === null || Array.isArray(parsedSpecs)) {
            throw new Error("Specs debe ser un objeto JSON válido. Ejemplo: {\"ancho\": \"195\"}");
      }
      }
      setSpecError(''); // Clear previous error
    } catch (error: any) {
      console.error("Error parsing specs JSON:", error);
      setSpecError(`Error en JSON de Specs: ${error.message}`);
      return; // Stop submission
    }

    // Validate ImageUrls JSON
    try {
       const imageUrlsInput = formData.imageUrls.trim();
       if (imageUrlsInput) { // Only parse if not empty
           parsedImageUrls = JSON.parse(imageUrlsInput);
      if (!Array.isArray(parsedImageUrls)) {
             throw new Error("ImageUrls debe ser un array JSON. Ejemplo: [\"url1.jpg\"]");
           }
           if (!parsedImageUrls.every(item => typeof item === 'string' && item.trim() !== '')) {
             throw new Error("Todos los elementos en ImageUrls deben ser URLs (strings no vacíos).");
           }
       }
       // Optional: Require at least one image if it's not a service
       const price = Number.parseFloat(formData.price) || 0;
       if (price > 0 && parsedImageUrls.length === 0) {
           throw new Error("Se requiere al menos una URL de imagen para productos con precio.");
       }
       setImageUrlsError(''); // Clear previous error
    } catch (error: any) {
      console.error("Error parsing imageUrls JSON:", error);
      setImageUrlsError(`Error en JSON de URLs: ${error.message}`);
      return; // Stop submission
    }

    // Crear Omit<Product, 'id'> para evitar pasar el ID al añadir
    const productData: Omit<Product, 'id'> = {
      name: formData.name,
      description: formData.description,
      price: Number.parseFloat(formData.price) || 0,
        imageUrls: parsedImageUrls, // Usar array parseado
      category: formData.category,
        specs: parsedSpecs, // Usar objeto parseado
      rating: Number.parseFloat(formData.rating) || 0,
      reviewCount: Number.parseInt(formData.reviewCount) || 0,
    };

    // Update or Add
    if (editingProduct) {
        // Asegurarse de que updateProduct recibe un Product completo (con id)
      updateProduct({ ...productData, id: editingProduct.id });
    } else {
        addProduct(productData); // addProduct espera Omit<Product, 'id'>
    }

    // Reset form state
    handleCancel();
  };
  // --- REMOVED MISPLACED CODE BLOCK ---

  const handleAdminImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'https://placehold.co/40x40/ccc/333?text=Err';
  };


  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Panel Admin</h1>
          <Button variant="destructive" size="sm" onClick={handleLogout}>Cerrar Sesión</Button>
        </div>
        {!showForm && (
          <Button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="mb-6 flex items-center gap-1">
            <PlusIcon /> Añadir Producto
          </Button>
        )}
        {showForm && (
          <Card className="mb-8 shadow-md">
            <CardHeader><h2 className="text-xl font-semibold">{editingProduct ? "Editar" : "Añadir"} Producto</h2></CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="name">Nombre</Label><Input id="name" name="name" value={formData.name} onChange={handleInputChange} required /></div>
                  <div><Label htmlFor="price">Precio (ARS)</Label><Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="0 para consulta" step="0.01" /></div>
                </div>
                <div><Label htmlFor="description">Descripción</Label><Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* ** CORRECCIÓN AQUÍ: Input para imageUrls como JSON ** */}
                   <div>
                       <Label htmlFor="imageUrls">URLs Imagen (JSON Array)</Label>
                       <Textarea id="imageUrls" name="imageUrls" value={formData.imageUrls} onChange={handleInputChange} placeholder='["url1.jpg", "url2.png"]' rows={3} className={imageUrlsError ? 'border-red-500' : ''} />
                       {imageUrlsError && <p className="text-red-600 text-xs mt-1">{imageUrlsError}</p>}
                       <p className="text-xs text-gray-500 mt-1">Una o más URLs en formato JSON array de strings.</p>
                   </div>
                   <div><Label htmlFor="category">Categoría</Label><Select id="category" name="category" value={formData.category} onChange={handleInputChange} required>{categories.map((c)=><option key={c.value} value={c.value}>{c.label}</option>)}</Select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specs">Specs (JSON)</Label>
                    <Textarea id="specs" name="specs" value={formData.specs} onChange={handleInputChange} placeholder='{"clave": "valor", "otraClave": 123}' rows={4} className={specError?'border-red-500':''} />
                    {specError && <p className="text-red-600 text-xs mt-1">{specError}</p>}
                    <p className="text-xs text-gray-500 mt-1">Objeto JSON.</p>
                  </div>
                  <div className="space-y-4">
                    <div><Label htmlFor="rating">Rating (0-5)</Label><Input id="rating" name="rating" type="number" value={formData.rating} onChange={handleInputChange} step="0.1" min="0" max="5" /></div>
                    <div><Label htmlFor="reviewCount">Cant. Reseñas</Label><Input id="reviewCount" name="reviewCount" type="number" value={formData.reviewCount} step="1" min="0" /></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
                <Button type="submit">{editingProduct ? "Actualizar" : "Guardar"}</Button>
              </CardFooter>
            </form>
          </Card>
        )}
        {safeProducts.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-4">Productos Existentes ({safeProducts.length})</h2>
            <div className="bg-white shadow rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Img</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Cat.</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {safeProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                        {/* ** CORRECCIÓN AQUÍ: Usar imageUrls[0] ** */}
                        <img 
                           src={p.imageUrls?.[0] || `https://placehold.co/40x40/cccccc/333?text=N/A`} 
                           alt="" 
                           className="h-10 w-10 rounded object-contain bg-gray-100" 
                           loading="lazy" 
                           onError={handleAdminImageError} // Use extracted handler
                         />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{p.name || 'Sin Nombre'}</div>
                        <div className="text-xs text-gray-500 md:hidden">{categories.find(c=>c.value===p.category)?.label||p.category}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{categories.find(c=>c.value===p.category)?.label||p.category}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{p.price>0?`$${p.price?.toLocaleString("es-AR")}`:'Consulta'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button variant="ghost" size="sm" onClick={()=>handleEdit(p)} className="text-blue-600 hover:text-blue-800 p-1 h-auto" title="Editar"><PencilIcon /></Button>
                        <Button variant="ghost" size="sm" onClick={()=>handleDelete(p.id)} className="text-red-600 hover:text-red-800 p-1 h-auto" title="Eliminar"><TrashIcon className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; // <-- Ensure component definition ends here


// ===============================================
//      COMPONENTES FLOTANTES
// ===============================================
function FloatingWhatsAppButton() { 
  const whatsappNumber = "5491112345678"; 
  
  return (
    // <<< Revertido a fixed, z-40 y bottom-5 right-5 >>>
    <a 
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank" 
      rel="noopener noreferrer" 
      className="group relative fixed bottom-5 right-5 z-40 w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 flex items-center justify-center"
      aria-label="Contactar por WhatsApp" 
      title="Contactar por WhatsApp" // Basic tooltip
    >
      {/* <<< Icono revertido en el siguiente paso >>> */}
      <WhatsAppIcon className="w-6 h-6" /> 
      
      {/* Tooltip (visible on hover, desktop only) */}
      <span className="absolute bottom-full right-0 mb-2 hidden md:block px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chatea por WhatsApp
      </span>
    </a>
  );
}
// ** CORRECCIÓN DE LINTER **
interface FloatingMiniCartProps { onClick: () => void; } // Añadir props tipadas
function FloatingMiniCart({ onClick }: FloatingMiniCartProps) {
  const { totalItems, totalPrice } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Solo renderizar si hay items Y ya está montado
  if (!isMounted || totalItems === 0) return null;
  
  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // <<< Añadida clase animate-subtle-glow y ajustado shadow/border base >>>
      className={`fixed bottom-6 left-6 z-40 group flex items-center transition-all duration-500 ease-in-out rounded-xl border border-gray-800 shadow-xl animate-subtle-glow ${ // Añadido rounded-xl, border, shadow aquí
        isHovered ? 'translate-y-[-4px]' : ''
      }`}
      aria-label={`Carrito con ${totalItems} items`}
    >
      {/* Dot indicator */}
      <div className="absolute -right-2 -top-2 w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
        {totalItems}
      </div>
      
      {/* Main container - Ahora sin borde ni sombra propios */}
      <div className="bg-gradient-to-r from-gray-900 to-black text-white rounded-xl overflow-hidden flex items-center"> 
        {/* Icon container */}
        <div className="bg-red-600 p-3">
          <CartIcon className="w-5 h-5" />
        </div>
        
        {/* Price info */}
        <div className="px-4 py-2">
          <div className="text-xs opacity-80 font-medium">Total de compra</div>
          <div className="text-base font-bold">
            ${totalPrice.toLocaleString("es-AR")}
          </div>
        </div>
      </div>
      
      {/* Decorative shine effect (mantenido como estaba) */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out pointer-events-none`}></div>
    </button>
  );
}


// ===============================================
//      APP WRAPPER Y CONTENT (Maneja estado y renderizado)
// ===============================================
function AppContent() {
  const [currentView, setCurrentView] = useState<ViewName>("storefront"); // Tipar estado
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // Tipar estado
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<Record<string, string | number>>({}); // Tipar estado
  const [brandFilter, setBrandFilter] = useState<string | null>(null); // Tipar estado
  const productContext = useContext(ProductContext); // Usar el contexto para acceder a products
  const prevViewRef = useRef(currentView);

  // Scroll to top on view change (if cart is not open)
  useEffect(() => {
    if (prevViewRef.current !== currentView && !isCartOpen) {
      const timer = setTimeout(() => { window.scrollTo({ top: 0, behavior: "smooth" }) }, 50);
      return () => clearTimeout(timer);
    }
    prevViewRef.current = currentView;
  }, [currentView, isCartOpen]);

  // Check admin status from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try { setIsAdmin(localStorage.getItem("isAdminLoggedIn") === "true"); } catch(e) { console.error("Error reading admin status", e); }
    }
  }, []);

  // Update localStorage when admin status changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try { localStorage.setItem("isAdminLoggedIn", isAdmin ? "true" : "false"); } catch(e) { console.error("Error saving admin status", e); }
    }
  }, [isAdmin]);

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // ** CORRECCIÓN DE LINTER **
  const setView: SetViewFunction = (newView, context = {}) => {
    console.log(`Setting view to: ${newView}`, context); // Debug
    setCurrentView(newView);

    // Update selectedProduct based on context
    if (context.product !== undefined) {
      setSelectedProduct(context.product);
    } else if (newView !== 'productDetail') {
      // Clear selectedProduct if not navigating to detail view
      setSelectedProduct(null);
    }

    // Update search/measure filters
    if (context.filters) {
        setCurrentFilters(context.filters);
        // If measure filters applied, clear brand filter
        if (context.filters.ancho || context.filters.perfil || context.filters.diametro) {
            if (brandFilter !== null) setBrandFilter(null);
        }
    } else if (!context.keepFilters && newView !== 'neumaticos' && newView !== 'llantas') {
        // Clear measure filters if navigating away and not explicitly keeping them
        if (Object.keys(currentFilters).length > 0) setCurrentFilters({});
    }

    // Update brand filter
    if (context.brand) {
        setBrandFilter(context.brand);
        // If brand filter applied, clear measure filters
        if (Object.keys(currentFilters).length > 0) setCurrentFilters({});
    } else if (newView !== 'neumaticos' && !context.filters) {
         // Clear brand filter if navigating away without applying new filters
         // Prevents keeping brand filter when going to storefront, etc.
         if (brandFilter !== null && !['shopByBrand', 'productDetail'].includes(newView)) {
             setBrandFilter(null);
         }
    }
  };

  // ** CORRECCIÓN DE LINTER **
  const handleSearch = (filters: Record<string, string>) => {
    console.log("AppContent received search:", filters); // Debug
    // Navigate to the category page with the applied filters
    setView((filters.category || "neumaticos") as ViewName, { filters: filters, keepFilters: true });
  };


  const PageTransitionStyles = () => (<style>{`
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in-view { animation: fadeIn 0.3s ease-out; }
    .animate-fadeIn { animation: fadeIn 0.5s ease-out; }

    /* Animación de brillo sutil */
    @keyframes subtle-glow {
      0%, 100% { box-shadow: 0 0 8px 2px rgba(220, 38, 38, 0.3); /* Rojo suave */ }
      50% { box-shadow: 0 0 16px 4px rgba(220, 38, 38, 0.5); /* Rojo más intenso */ }
    }
    .animate-subtle-glow {
      animation: subtle-glow 2.5s ease-in-out infinite;
    }
  `}</style>);

  const renderMainLayout = (ContentView: ComponentType<any>, props: Record<string, any> = {}) => (
    <>
      <Header setView={setView} toggleCart={toggleCart} />
      {/* ** CORRECCIÓN DE LINTER ** */}
      <main className="flex-grow fade-in-view" key={currentView + JSON.stringify(selectedProduct?.id ?? props?.category ?? props?.brandFilter ?? currentFilters ?? "main")}>
        <ContentView
            setView={setView}
            handleSearch={handleSearch} // Pass down if needed by ContentView
            currentFilters={currentFilters} // Pass current measure filters
            brandFilter={brandFilter} // Pass current brand filter
            initialBrandFilter={brandFilter} // Pass as initial to CategoryPage
            product={selectedProduct} // Pass the selected product
            {...props} // Pass any other specific props for the view
            // Ensure a unique key for re-rendering when relevant state changes
            // ** CORRECCIÓN DE LINTER **
            key={selectedProduct?.id ?? currentView + JSON.stringify(currentFilters) + (brandFilter||'')}
        />
      </main>
      <Footer />
    </>
  );

  // ** CORRECCIÓN DE LINTER **
  const renderAdminLayout = (ContentView: ComponentType<any>) => ( <div className="fade-in-view" key={currentView}><ContentView setView={setView} setIsAdmin={setIsAdmin} /></div> );

  const renderView = () => {
    // Use products from context, fallback to initial (though context should provide it)
    const products = productContext?.products ?? [];

    // Props common to main layout views that need filter/product state
    const mainProps = { currentFilters, brandFilter, initialBrandFilter: brandFilter };

    // Admin Routes
    if (currentView === "adminLogin") return renderAdminLayout(AdminLogin);
    if (currentView === "adminDashboard") return isAdmin ? renderAdminLayout(AdminDashboard) : renderAdminLayout(AdminLogin);

    // Main Application Views
    let CurrentPageComponent;
    let specificProps = {}; // Props specific to the current view

    switch (currentView) {
      case "productDetail":
        if (!selectedProduct) return renderMainLayout(() => <div className="container mx-auto p-12 text-center">Producto no encontrado o cargando...</div>);
        CurrentPageComponent = ProductDetail;
        // 'product' prop is already passed down via renderMainLayout
        break;
      case "neumaticos": CurrentPageComponent = CategoryPage; specificProps = { category: "neumatico", categoryLabel: "Neumáticos" }; break;
      case "shopByBrand": CurrentPageComponent = ShopByBrandPage; break;
      case "llantas": CurrentPageComponent = CategoryPage; specificProps = { category: "llanta", categoryLabel: "Llantas" }; break;
      case "accesorios": CurrentPageComponent = CategoryPage; specificProps = { category: "accesorio", categoryLabel: "Accesorios" }; break;
      case "servicios": CurrentPageComponent = CategoryPage; specificProps = { category: "servicio", categoryLabel: "Servicios" }; break;
      // Sub-categories / Filtered views
      case "llantas_deportivas": CurrentPageComponent = CategoryPage; specificProps = { category: "llanta", categoryLabel: "Llantas Deportivas", filterType: "deportiva" }; break;
      case "llantas_chapa": CurrentPageComponent = CategoryPage; specificProps = { category: "llanta", categoryLabel: "Llantas de Chapa", filterType: "chapa" }; break;
      case "llantas_r14": CurrentPageComponent = CategoryPage; specificProps = { category: "llanta", categoryLabel: 'Llantas Rodado 14"', filterType: "r14" }; break;
      case "llantas_r15": CurrentPageComponent = CategoryPage; specificProps = { category: "llanta", categoryLabel: 'Llantas Rodado 15"', filterType: "r15" }; break;
      case "llantas_r17": CurrentPageComponent = CategoryPage; specificProps = { category: "llanta", categoryLabel: 'Llantas Rodado 17"', filterType: "r17" }; break;
       // Specific services (navigate to ProductDetail if found, otherwise show category)
       case "servicio_alineacion":
        const alProd = products.find(p => p.id === 3 || p.name?.toLowerCase().includes('alineación 3d'));
        if (alProd) { setView('productDetail', { product: alProd as Product }); return null; } // Navigate
        else { CurrentPageComponent = CategoryPage; specificProps = { category: "servicio", categoryLabel: "Alineación", filterType: "alineacion" }; } // Fallback to filtered category
        break;
      case "servicio_reparacion":
        const repProd = products.find(p => p.id === 5 || p.name?.toLowerCase().includes('reparación de llantas'));
        if (repProd) { setView('productDetail', { product: repProd as Product }); return null; }
        else { CurrentPageComponent = CategoryPage; specificProps = { category: "servicio", categoryLabel: "Reparación de Llantas", filterType: "reparacion" }; }
        break;
      case "servicio_aceite":
        const acProd = products.find(p => p.id === 6 || p.name?.toLowerCase().includes('cambio de aceite'));
         if (acProd) { setView('productDetail', { product: acProd as Product }); return null; }
         else { CurrentPageComponent = CategoryPage; specificProps = { category: "servicio", categoryLabel: "Cambio de Aceite", filterType: "aceite" }; }
         break;
      // Other service categories (show general service page for now)
      case "servicio_frenos": case "servicio_suspension": case "servicio_mecanica": CurrentPageComponent = CategoryPage; specificProps = { category: "servicio", categoryLabel: "Servicios" }; break;
      // Standard Pages
      case "contacto": CurrentPageComponent = ContactoPage; break;
      case "cart": CurrentPageComponent = CartPage; break;
      case "checkout": CurrentPageComponent = CheckoutPage; break;
      // Default / Storefront
      case "storefront":
      default:
         // Clear filters only if coming from a filtered view that isn't product detail
         if ((brandFilter || Object.keys(currentFilters).length > 0) && prevViewRef.current !== 'productDetail') {
             setBrandFilter(null);
             setCurrentFilters({});
         }
        CurrentPageComponent = Storefront;
        specificProps = { handleSearch }; // Pass handleSearch specifically to Storefront
        break;
    }

    // Render the chosen layout with the determined component and props
    return renderMainLayout(CurrentPageComponent, { ...mainProps, ...specificProps });
  }

  return (
    <>
      <PageTransitionStyles />
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased flex flex-col relative">
        {renderView()}
        {/* <FloatingWhatsAppButton /> */}
        <FloatingMiniCart onClick={toggleCart} />
        <SideCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} setView={setView} />
      </div>
    </>
  )
}

// --- App Component (Entry Point) ---
function App() {
  // Callback for CartProvider, can be used for side effects on cart update if needed
  const handleCartUpdate = React.useCallback(() => {
    // console.log("Cart updated");
  }, []);

  return (
    <ProductProvider>
      <CartProvider onCartUpdate={handleCartUpdate}>
        <AppContent />
      </CartProvider>
    </ProductProvider>
  )
}
export default App;

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

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const data = await req.json();      // Product sin id
    const ok = await updateProduct({ ...data, id: params.id });
    if (!ok) throw new Error('Update failed');
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const ok = await deleteProduct(params.id);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'Delete failed' }, { status: 500 });
}

