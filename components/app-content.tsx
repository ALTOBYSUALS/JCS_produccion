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
  ProductSpec as ImportedProductSpec,
  OrderDetails
} from '@/components/types';
// IMPORTAR HOOKS
import { useProducts as useProductsApi } from '@/lib/hooks';
// Añadir esta importación:
import { NextResponse } from 'next/server';
import { createProduct, updateProduct, deleteProduct } from '@/lib/notion';
import { CheckoutForm } from "./checkout-form";

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
  active?: boolean; // Añadir esta propiedad como opcional
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
type ViewName = 'storefront' | 'neumaticos' | 'llantas' | 'accesorios' | 'servicios' | 'contacto' | 'nosotros' | 'shopByBrand' | 'productDetail' | 'cart' | 'checkout' | 'adminLogin' | 'adminDashboard' |
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
// Importar el componente WhyChooseUs
import WhyChooseUs from './WhyChooseUs';

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
const CartIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
  {/* Cofre/baúl de tesoro medieval */}
  <path d="M5 6.5C5 5.67 5.67 5 6.5 5h11c.83 0 1.5.67 1.5 1.5V8h-14V6.5z" strokeWidth={1.5} />
  <path d="M4 8h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" strokeWidth={1.5} />
  <path d="M8 8v2" strokeWidth={1.5} />
  <path d="M16 8v2" strokeWidth={1.5} />
  <path d="M4 12h16" strokeWidth={1.5} />
  <path d="M12 12v4" strokeWidth={1.5} />
  <path d="M9 14.5h6" strokeWidth={1.5} />
  {/* Detalles ornamentales */}
  <path d="M7.5 17.5a.5.5 0 100-1 .5.5 0 000 1z" fill="currentColor" />
  <path d="M16.5 17.5a.5.5 0 100-1 .5.5 0 000 1z" fill="currentColor" />
</svg>);
const UserIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>);
const TrashIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const PhoneIcon: FC<SvgProps>=(props)=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>);
const WhatsAppIcon: FC<{className?: string}>=(props)=>(<img src="https://pub-13fdc27487374a41a3033c5799078fd0.r2.dev/Asset%201sui.png" alt="WhatsApp" className={props.className} style={{ width: props.className?.includes('w-') ? undefined : '24px', height: props.className?.includes('h-') ? undefined : '24px', objectFit: 'contain' }} />);
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

// Sol de Mayo Argentino - Componente sutil
const SolDeMayo: FC<{className?: string; size?: number}>=(props)=>(<svg className={props.className} width={props.size || 24} height={props.size || 24} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="20" fill="currentColor" stroke="currentColor" strokeWidth="1"/><g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M50 10 L50 25"/><path d="M50 75 L50 90"/><path d="M10 50 L25 50"/><path d="M75 50 L90 50"/><path d="M21.21 21.21 L32.32 32.32"/><path d="M67.68 67.68 L78.79 78.79"/><path d="M78.79 21.21 L67.68 32.32"/><path d="M32.32 67.68 L21.21 78.79"/><path d="M50 5 L50 15"/><path d="M50 85 L50 95"/><path d="M5 50 L15 50"/><path d="M85 50 L95 50"/><path d="M18.93 18.93 L26.26 26.26"/><path d="M73.74 73.74 L81.07 81.07"/><path d="M81.07 18.93 L73.74 26.26"/><path d="M26.26 73.74 L18.93 81.07"/></g><circle cx="50" cy="50" r="8" fill="currentColor"/></svg>);

// Bandera Argentina sutil
const ArgentinaFlag: FC<{className?: string}>=(props)=>(<svg className={props.className} width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="5.33" fill="#74ACDF"/><rect y="5.33" width="24" height="5.33" fill="#FFFFFF"/><rect y="10.67" width="24" height="5.33" fill="#74ACDF"/><circle cx="12" cy="8" r="2" fill="#F6B900" stroke="#F6B900" strokeWidth="0.5"/></svg>);

// Indicador de Carga Genérico
const GenericLoadingSpinner = ({ text = "Cargando..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center py-10 my-6">
    <div className="w-12 h-12 border-4 border-red-600 border-solid border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-red-700 text-lg" style={{ fontFamily: "var(--font-uncial-antiqua)" }}>{text}</p>
  </div>
);

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
const handleSearchClick = () => { const filters: Record<string, string> = { category: activeTab }; if (ancho) filters.ancho = ancho; if (perfil) filters.perfil = perfil; if (diametro) filters.diametro = diametro; if (activeTab === 'llantas') { delete filters.perfil; } onSearch(filters); }; return (<div className="mt-6 md:mt-8 max-w-lg mx-auto border-2 border-red-500/30 rounded-lg p-4 backdrop-blur-sm bg-black/20"><div className="flex justify-center mb-6"><div className="bg-white/10 backdrop-blur rounded-full p-1 border border-white/20"><button onClick={() => setActiveTab("neumaticos")} className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${activeTab === "neumaticos" ? "bg-white text-gray-900 shadow-lg" : "text-white hover:text-yellow-300"}`}>NEUMÁTICOS</button><button onClick={() => setActiveTab("llantas")} className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${activeTab === "llantas" ? "bg-white text-gray-900 shadow-lg" : "text-white hover:text-yellow-300"}`}>LLANTAS</button></div></div><div key={activeTab} className="animate-fadeIn space-y-4">{activeTab === "neumaticos" && (<>{/* Filtro minimalista y elegante */}
<div className="text-center mb-4">
  <p className="text-sm text-gray-300 mb-3">Encontrá tu medida perfecta</p>
  <div className="flex flex-wrap justify-center gap-2 mb-3">
    <Select value={ancho} onChange={(e: ChangeEvent<HTMLSelectElement>) => setAncho(e.target.value)} className="bg-white/10 backdrop-blur border-white/20 text-white text-sm rounded-full px-4 py-2 min-w-[100px] focus:ring-2 focus:ring-red-500 focus:border-transparent hover:bg-white/20 transition-all duration-200">
      <option value="" className="text-gray-800">Ancho</option>
      {anchos.sort((a, b) => parseInt(a) - parseInt(b)).map((a) => ( <option key={a} value={a} className="text-gray-800">{a}</option> ))}
    </Select>
    <Select value={perfil} onChange={(e: ChangeEvent<HTMLSelectElement>) => setPerfil(e.target.value)} className="bg-white/10 backdrop-blur border-white/20 text-white text-sm rounded-full px-4 py-2 min-w-[100px] focus:ring-2 focus:ring-red-500 focus:border-transparent hover:bg-white/20 transition-all duration-200">
      <option value="" className="text-gray-800">Perfil</option>
      {perfiles.sort((a, b) => parseFloat(a) - parseFloat(b)).map((p) => ( <option key={p} value={p} className="text-gray-800">{p}</option> ))}
    </Select>
    <Select value={diametro} onChange={(e: ChangeEvent<HTMLSelectElement>) => setDiametro(e.target.value)} className="bg-white/10 backdrop-blur border-white/20 text-white text-sm rounded-full px-4 py-2 min-w-[100px] focus:ring-2 focus:ring-red-500 focus:border-transparent hover:bg-white/20 transition-all duration-200">
      <option value="" className="text-gray-800">Rodado</option>
      {diametros.sort((a, b) => parseInt(a) - parseInt(b)).map((d) => ( <option key={d} value={d} className="text-gray-800">R{d}</option> ))}
    </Select>
  </div>
  {(ancho || perfil || diametro) && (
    <div className="text-sm text-red-400 font-semibold mb-2 animate-pulse">
      {ancho && <span>{ancho}</span>}
      {ancho && perfil && <span className="text-white/60">/</span>}
      {perfil && <span>{perfil}</span>}
      {(ancho || perfil) && diametro && <span className="text-white/60"> R</span>}
      {diametro && <span>{diametro}</span>}
    </div>
  )}
</div></>)}{activeTab === "llantas" && (<><div className="flex items-center gap-2 text-red-500 mb-1"><SearchIcon /><h3 className="text-md font-semibold text-gray-200">Buscar Llanta por Medida</h3></div><Select value={diametro} onChange={(e: ChangeEvent<HTMLSelectElement>) => setDiametro(e.target.value)} className="bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500"><option value="">Seleccionar Rodado</option>{diametros.sort((a, b) => parseInt(a) - parseInt(b)).map((d) => ( <option key={d} value={d}>R{d}</option> ))}</Select><Select value={ancho} onChange={(e: ChangeEvent<HTMLSelectElement>) => setAncho(e.target.value)} className="bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500"><option value="">Seleccionar Ancho (Opcional)</option>{['5.5"', '6"', '6.5"', '7"', '7.5"', '8"'].map((a) => (<option key={a} value={a.replace('"', "")}>{a}</option>))}</Select><Select className="bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:ring-red-500" value=""><option value="">Centro / Distribución (Opcional)</option><option value="4x100">4x100</option><option value="4x108">4x108</option><option value="5x100">5x100</option><option value="5x114">5x114.3</option></Select></>)}<Button onClick={handleSearchClick} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-full px-8 py-3 mx-auto block transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"><SearchIcon /> Buscar</Button></div></div>) }


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
const ProductGridMobile: FC<ProductGridMobileProps> = ({ products = [], categoryLabel, onProductSelect, setView, addToCart }) => {
  // Determinar la vista correcta basada en el categoryLabel
  const getViewFromCategoryLabel = () => {
    if (categoryLabel.toLowerCase().includes('neumático')) return 'neumaticos';
    if (categoryLabel.toLowerCase().includes('llanta')) return 'llantas';
    if (categoryLabel.toLowerCase().includes('accesorio')) return 'accesorios';
    if (categoryLabel.toLowerCase().includes('servicio')) return 'servicios';
    return 'storefront';
  };

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-3">
        <Button onClick={() => setView(getViewFromCategoryLabel())} variant="ghost" size="sm" className="text-gray-600 pl-0">
          <ArrowLeftIcon /> Volver
        </Button>
        <h2 className="font-bold text-lg text-center flex-grow">{categoryLabel}</h2>
        <div className="w-10"></div>
      </div>
      {products.length === 0 ? ( 
        <p className="text-center text-gray-500 py-8">No se encontraron productos.</p> 
      ) : ( 
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => ( 
            <ProductCardMobile key={p?.id || Math.random()} product={p} onProductSelect={onProductSelect} /> 
          ))}
        </div> 
      )}
    </div>
  );
}; // Removido addToCart de props pasadas a ProductCardMobile


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
                        <img src="https://pub-13fdc27487374a41a3033c5799078fd0.r2.dev/image_1_zvzh9f.png" alt="Logo" className="h-7 w-auto" />
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
  const [isMounted, setIsMounted] = useState(false);
  
  // Sólo mostrar badge después de la hidratación
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems: { label: string; view: ViewName }[] = [
    { label: "Neumáticos", view: "neumaticos" },
    { label: "Llantas", view: "llantas" },
    { label: "Accesorios", view: "accesorios" },
    { label: "Servicios", view: "servicios" },
    { label: "Nosotros", view: "nosotros" },
    { label: "Contacto", view: "contacto" },
    // { label: "Marcas", view: "shopByBrand" }, // Temporalmente oculto
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Ticker digital en la parte superior */}
      <DigitalTicker />
      
      {/* Barra de navegación principal - altura reducida */}
      <div className="container mx-auto px-4 lg:px-6 w-[87%]">
        <nav className="h-14 md:h-[70px] hidden lg:flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex-shrink-0 cursor-pointer" 
            onClick={() => setView("storefront")}
          >
            <img 
              src="https://pub-13fdc27487374a41a3033c5799078fd0.r2.dev/image_1_zvzh9f.png" 
              alt="Logo JCS El Guardián" 
              className="h-8 w-auto" 
            />
          </div>
          
          {/* Enlaces de navegación - texto reducido */}
          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className="text-[13px] tracking-wide text-gray-700 hover:text-red-600 transition-colors py-1.5 uppercase"
                style={{ fontFamily: "var(--font-uncial-antiqua)" }}
              >
                {item.label}
              </button>
            ))}
          </div>
          
          {/* Botones de acción */}
          <div className="flex items-center">
            <button 
              onClick={toggleCart}
              className="p-2 rounded-md hover:bg-gray-100 transition-all relative"
              title="Carrito"
            >
              <CartIcon className="w-5 h-5 text-gray-700" />
              {isMounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
            </button>
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
function Footer() { const wN = "5491144820369"; const pN = "4482-0369"; const preventDefault = (e: MouseEvent) => e.preventDefault(); return (<footer className="bg-black text-gray-300 pt-8 md:pt-12 pb-20 md:pb-8 mt-8 md:mt-16"><div className="container mx-auto px-4 lg:px-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8"><div><h5 className="font-semibold mb-3 uppercase text-sm text-white">Servicios</h5><ul className="space-y-2 text-xs"><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Alineación y Balanceo</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Reparación Llantas</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Frenos</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Suspensión</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Mecánica Ligera</a></li></ul></div><div><h5 className="font-semibold mb-3 uppercase text-sm text-white">Productos</h5><ul className="space-y-2 text-xs"><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Neumáticos Nuevos</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Llantas Aleación</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Llantas Chapa</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Accesorios</a></li></ul></div><div className="mt-6 md:mt-0"><h5 className="font-semibold mb-3 uppercase text-sm text-white">La Empresa</h5><ul className="space-y-2 text-xs"><li><a href="#" className="hover:text-white hover:underline block py-1">Quiénes Somos</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Nuestra Historia</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Sucursal San Justo</a></li><li><a href="#" onClick={preventDefault} className="hover:text-white hover:underline block py-1">Trabajá con Nosotros</a></li></ul></div><div className="mt-6 md:mt-0"><h5 className="font-semibold mb-3 uppercase text-sm text-white">Contacto</h5><ul className="space-y-2 text-xs"><li className="py-1"><a href={`tel:${pN}`} className="flex items-center hover:text-white"><PhoneIcon className="h-4 w-4 mr-2 shrink-0" />4482 - 0369 | 0463</a></li><li className="py-1"><a href="mailto:info@jcselguardian.com.ar" className="flex items-center hover:text-white break-all"><UserIcon className="h-4 w-4 mr-2 shrink-0" />info@jcselguardian.com.ar</a></li><li className="py-1"><a href="https://maps.google.com/?q=San+Justo,Buenos+Aires,Argentina" target="_blank" className="flex items-center hover:text-white" rel="noreferrer"><LocationIcon className="h-4 w-4 mr-2 shrink-0" />San Justo, Buenos Aires, Argentina</a></li><li className="py-1"><div className="flex space-x-3 mt-3"><a href="https://www.instagram.com/jcselguardian.oficial/" target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full flex items-center justify-center w-7 h-7" title="Instagram"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c-4.013 0-4.505.014-6.09.088C4.63 0.158 3.86 0.324 3.186 0.594c-0.7.278-1.306.678-1.888 1.26C0.716 2.44 0.316 3.046 0.038 3.746c-0.27.674-0.436 1.444-0.508 3.03C- .55 1.807 2 2.3 2 6.314v11.372c0 4.013.014 4.505.088 6.09.074 1.586.238 2.356.508 3.03.278.7.678 1.306 1.26 1.888.582.582 1.188.982 1.888 1.26.674.27 1.444.436 3.03.508C7.807 21.986 8.3 22 12.315 22h0.001c4.013 0 4.505-.014 6.09-.088 1.586-.074 2.356-.238 3.03-.508.7-.278 1.306-.678 1.888-1.26.582-.582.982-1.188 1.26-1.888.27-.674.436-1.444.508-3.03.074-1.585.088-2.077.088-6.09V6.314c0-4.013-0.014-4.505-.088-6.09-0.074-1.586-0.238-2.356-0.508-3.03-0.278-0.7-0.678-1.306-1.26-1.888C21.56 0.316 20.954 0.084 20.254 0c-0.674-0.27-1.444-0.436-3.03-0.508C16.82 0.014 16.328 0 12.315 0h-0.001zm0 2.163c3.927 0 4.38.016 5.917.086 1.428.066 2.06.236 2.49.414 0.512.206 0.896.49 1.297.89 0.398 0.402 0.684 0.784 0.89 1.298 0.178 0.43 0.348 1.062 0.414 2.49 0.07 1.537 0.086 1.99 0.086 5.917s-0.016 4.38-0.086 5.917c-0.066 1.428-0.236 2.06-0.414 2.49-0.206 0.512-.49.896-.89 1.297-0.402.398-.784.684-1.298.89-0.43.178-1.062.348-2.49.414-1.537.07-1.99.086-5.917.086s-4.38-.016-5.917-.086c-1.428-.066-2.06-.236-2.49-0.414-0.512-.206-0.896-.49-1.297-.89-0.398-.402-.684-.784-.89-1.298-0.178-.43-.348-1.062-.414-2.49-.07-1.537-0.086-1.99-0.086-5.917s0.016-4.38.086-5.917c0.066-1.428.236-2.06.414-2.49 0.206-.512.49-.896.89-1.297.402-.398.784-.684 1.298-.89 0.43-.178 1.062.348 2.49-.414C7.935 2.179 8.388 2.163 12.315 2.163zm0 12.315c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6zm0-10c-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4-1.791-4-4-4zm6.406-4.303c-0.776 0-1.406 0.63-1.406 1.406s0.63 1.406 1.406 1.406 1.406-0.63 1.406-1.406-0.63-1.406-1.406-1.406z" clipRule="evenodd" /></svg></a></div></li></ul></div></div><div className="border-t border-gray-700 pt-6 text-center text-xs text-gray-500"><div className="flex items-center justify-center gap-2 mb-3"><ArgentinaFlag className="opacity-70" /><span className="text-gray-400">Empresa Argentina - San Justo, Buenos Aires</span></div><p>© {new Date().getFullYear()} JCS El Guardián. Todos los derechos reservados.</p><div className="flex justify-center space-x-4 mt-4"><a href="#" className="hover:text-white">Términos</a><span>|</span><a href="#" className="hover:text-white">Privacidad</a></div></div></div><div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 py-2 px-4 flex justify-around items-center md:hidden z-40"><a href={`tel:${pN}`} className="flex flex-col items-center text-gray-400 hover:text-white px-1"><PhoneIcon className="h-5 w-5" /><span className="text-[10px] mt-1">Llamar</span></a><a href={`https://wa.me/${wN}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-gray-400 hover:text-white px-1"><WhatsAppIcon className="h-5 w-5" /><span className="text-[10px] mt-1">WhatsApp</span></a><a href="https://maps.google.com/?q=San+Justo,Buenos+Aires,Argentina" target="_blank" className="flex flex-col items-center text-gray-400 hover:text-white px-1" rel="noreferrer"><LocationIcon className="h-5 w-5" /><span className="text-[10px] mt-1">Ubicación</span></a><button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} className="flex flex-col items-center text-gray-400 hover:text-white px-1"><ArrowUpIcon className="h-5 w-5" /><span className="text-[10px] mt-1">Subir</span></button></div></footer>) }

// --- Hero Section Component ---
interface HeroSectionProps {
    handleSearch: (filters: Record<string, string>) => void;
}
function HeroSection({ handleSearch }: HeroSectionProps) { 
  return (
    <div className="relative overflow-hidden min-h-screen flex items-center text-white">
      {/* Imagen de fondo del guerrero/guardián */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: 'url(https://pub-13fdc27487374a41a3033c5799078fd0.r2.dev/Container.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Overlay oscuro para mejorar legibilidad */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 py-8 md:py-12 relative z-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl mx-auto text-center">
          
          {/* Badge del 30° Aniversario dorado */}
          <div className="flex justify-center mb-4">
            <div 
              className="relative bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold tracking-wider"
              style={{ 
                boxShadow: '0 0 20px rgba(255,215,0,0.6)'
              }}
            >
              <span className="relative">✨ 30° ANIVERSARIO ✨</span>
            </div>
          </div>
          
          {/* Título principal con tipografía gótica y brillo dorado */}
          <h1 
            className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-wider mb-4"
            style={{ 
              fontFamily: "'Cinzel', 'Times New Roman', serif",
              letterSpacing: '0.1em',
              color: '#D4AF37', // Dorado
              textShadow: '0 0 30px rgba(212,175,55,0.8), 0 0 60px rgba(212,175,55,0.4), 2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            JCS EL GUARDIÁN
          </h1>
          
          {/* Subtítulo elegante */}
          <p 
            className="text-lg md:text-xl lg:text-2xl text-white mb-8 max-w-3xl mx-auto font-medium tracking-wide"
            style={{ 
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            Las mejores marcas en Neumáticos y Llantas. 
            <span className="text-red-400 font-bold"> Servicios de Calidad Nacional</span>
            <span className="text-gray-200"> y Confianza.</span>
          </p>
          
          {/* Formulario de búsqueda centrado */}
          <div className="max-w-lg mx-auto">
            <CustomHeroSearch onSearch={handleSearch} />
          </div>
        </div>
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
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const scroll = (direction: 'left' | 'right') => { 
      if (scrollRef.current) { 
        const scrollAmount = scrollRef.current.offsetWidth; 
        scrollRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" }); 
        
        // Update current index
        const newIndex = direction === "left" 
          ? Math.max(0, currentIndex - 1)
          : Math.min(items.length - 1, currentIndex + 1);
        setCurrentIndex(newIndex);
      } 
    };
    
    const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.target as HTMLImageElement;
        img.onerror = null;
        img.style.backgroundColor = "#e0e0e0";
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
    };
    
    if (!Array.isArray(items) || items.length === 0) return null; 
    
    return (
      <div className="relative group rounded-2xl overflow-hidden shadow-2xl">
        <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {items.map((item, i) => (
            <div key={i} className="w-full shrink-0 snap-center h-[45vh] md:h-[65vh] relative bg-gradient-to-br from-gray-800 to-gray-900">
              {/* Background Image with Enhanced Overlay */}
              <img 
                src={item.imageUrl || "/placeholder.svg"} 
                alt={item.title || `Banner ${i + 1}`} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                onError={handleImageError} 
              />
              
              {/* Enhanced Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30"></div>
              
              {/* Decorative Elements */}
              <div className="absolute top-6 right-6 w-16 h-16 border-2 border-white/20 rounded-full opacity-60"></div>
              <div className="absolute bottom-6 left-6 w-12 h-12 border border-white/10 rounded-full opacity-40"></div>
              
              {/* Content with Enhanced Typography */}
              <div className="absolute inset-0 flex flex-col justify-center items-start p-6 md:p-12 lg:p-16 text-white z-10">
                {item.title && (
                  <h2 className="text-2xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-4 max-w-4xl leading-tight tracking-tight">
                    <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent drop-shadow-2xl">
                      {item.title}
                    </span>
                  </h2>
                )}
                
                {item.subtitle && (
                  <p className="text-base md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-2xl font-medium text-gray-100 drop-shadow-lg leading-relaxed">
                    {item.subtitle}
                  </p>
                )}
                
                {item.buttonText && (
                  <Button 
                    variant="default" 
                    size="lg"
                    className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white font-bold px-8 py-4 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-red-500/30 backdrop-blur-sm"
                    onClick={item.onClick || (() => {})}
                  >
                    <span className="flex items-center gap-3">
                      {item.buttonText}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Button>
                )}
              </div>
              
              {/* Anniversary Badge for Special Items */}
              {item.title?.includes('30°') && (
                <div className="absolute top-6 left-6 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black px-4 py-2 rounded-full font-black text-sm shadow-xl border-2 border-yellow-300">
                  ✨ 30° ANIVERSARIO ✨
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Enhanced Navigation Controls */}
        {items.length > 1 && (
          <>
            <button 
              onClick={() => scroll("left")} 
              aria-label="Anterior" 
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 hover:scale-110 border border-white/20"
            >
              <ChevronLeftIcon />
            </button>
            <button 
              onClick={() => scroll("right")} 
              aria-label="Siguiente" 
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 hover:scale-110 border border-white/20"
            >
              <ChevronRightIcon />
            </button>
            
            {/* Elegant Indicators */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    if (scrollRef.current) {
                      scrollRef.current.scrollTo({ left: index * scrollRef.current.offsetWidth, behavior: "smooth" });
                    }
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 border border-white/30 ${
                    index === currentIndex 
                      ? 'bg-white scale-125 shadow-lg' 
                      : 'bg-white/40 hover:bg-white/70 hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    ) 
}


// --- Promotional Banner Components ---
interface PromoBannerProps {
  title: string;
  subtitle?: string;
  discount?: string;
  backgroundImages?: string[];
  backgroundColor?: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  autoSlide?: boolean;
}

const PromoBanner: FC<PromoBannerProps> = ({
  title,
  subtitle,
  discount,
  backgroundImages,
  backgroundColor = 'bg-gradient-to-br from-red-500 via-red-600 to-red-800',
  size = 'medium',
  onClick,
  autoSlide = false
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const sizeClasses = {
    small: 'h-36 md:h-44',
    medium: 'h-44 md:h-52',
    large: 'h-56 md:h-72'
  };

  // Optimized auto-slide with reduced frequency
  useEffect(() => {
    if (autoSlide && backgroundImages && backgroundImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
      }, 6000); // Increased to 6 seconds to reduce lag
      return () => clearInterval(interval);
    }
  }, [autoSlide, backgroundImages]);

  const currentBackgroundImage = backgroundImages && backgroundImages.length > 0 
    ? backgroundImages[currentImageIndex] 
    : null;

  return (
    <div 
      className={`relative ${sizeClasses[size]} rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.01] hover:shadow-xl group shadow-lg border border-gray-200/20`}
      onClick={onClick}
    >
      {/* Background Image with Optimized Transition */}
      {currentBackgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out"
          style={{ backgroundImage: `url(${currentBackgroundImage})` }}
        />
      )}
      
      {/* Enhanced Gradient Overlay with Brand Colors */}
      <div className={`absolute inset-0 ${currentBackgroundImage ? 'bg-gradient-to-br from-black/60 via-red-900/40 to-black/70' : backgroundColor} transition-all duration-300`}></div>
      
      {/* Subtle Brand Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-500/30 to-transparent"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white/20 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 border border-white/10 rounded-full"></div>
      </div>
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-center items-center text-white p-4 text-center z-10">
        {discount && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black px-4 py-2 rounded-full font-black text-sm md:text-base shadow-xl transform rotate-12 border-2 border-white/30">
            <span className="drop-shadow-sm">{discount}</span>
          </div>
        )}
        
        <h3 className="text-xl md:text-4xl font-black mb-3 group-hover:scale-105 transition-transform duration-300 drop-shadow-xl tracking-wide">
          <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
            {title}
          </span>
        </h3>
        
        {subtitle && (
          <p className="text-sm md:text-xl opacity-95 max-w-md font-semibold drop-shadow-lg text-gray-100">
            {subtitle}
          </p>
        )}
        
        {/* Enhanced Call to Action */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center space-x-2 bg-white/25 backdrop-blur-md rounded-full px-6 py-2 border border-white/30">
            <span className="text-sm font-bold">Ver más</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Optimized Image Indicators */}
      {backgroundImages && backgroundImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(index);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 border border-white/30 ${
                index === currentImageIndex 
                  ? 'bg-white scale-110 shadow-lg' 
                  : 'bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface BrandBannerProps {
  brandName: string;
  logoUrl?: string;
  tagline?: string;
  onClick?: () => void;
  brandColor?: string;
}

const BrandBanner: FC<BrandBannerProps> = ({ brandName, logoUrl, tagline, onClick, brandColor = 'from-gray-50 to-white' }) => {
  return (
    <div 
      className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105 hover:-translate-y-2 border border-gray-200/50 group overflow-hidden"
      onClick={onClick}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className={`absolute inset-0 bg-gradient-to-br ${brandColor} opacity-10`}></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-red-400/20 to-orange-400/20 rounded-full transform -translate-x-8 translate-y-8 group-hover:scale-125 transition-transform duration-700"></div>
      </div>
      
      <div className="relative flex flex-col items-center text-center z-10">
        {logoUrl && (
          <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
            <img 
              src={logoUrl} 
              alt={`${brandName} logo`}
              className="h-14 md:h-18 w-auto object-contain filter drop-shadow-md"
              onError={(e: SyntheticEvent<HTMLImageElement, Event>) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <h4 className="text-lg md:text-xl font-black text-gray-800 mb-2 group-hover:text-gray-900 transition-colors duration-300 tracking-wide">
          {brandName}
        </h4>
        
        {tagline && (
          <p className="text-sm md:text-base text-gray-600 font-medium group-hover:text-gray-700 transition-colors duration-300">
            {tagline}
          </p>
        )}
        
        {/* Hover Effect Arrow */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PromotionalBannersSectionProps {
  setView: SetViewFunction;
}

const PromotionalBannersSection: FC<PromotionalBannersSectionProps> = ({ setView }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const banners = [
    {
      id: 1,
      title: "FINANCIACIÓN 0%",
      subtitle: "12 cuotas sin interés en productos seleccionados",
      discount: "SIN INTERÉS",
      image: "https://pub-13fdc27487374a41a3033c5799078fd0.r2.dev/20250513_1654_Promocio%CC%81n_JSC_El_Guardia%CC%81n_simple_compose_01jv5kbjyqefgacz81gwrg0xvr_1_vfk4u5.png",
      gradient: "from-red-600 via-red-700 to-red-800",
      action: () => setView('contacto')
    },
    {
      id: 2,
      title: "NEUMÁTICOS PREMIUM",
      subtitle: "Las mejores marcas con garantía de calidad",
      discount: "OFERTAS",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      gradient: "from-black via-gray-800 to-gray-900",
      action: () => setView('neumaticos')
    },
    {
      id: 3,
      title: "LLANTAS EXCLUSIVAS",
      subtitle: "Diseño y elegancia para tu vehículo",
      discount: "NUEVOS MODELOS",
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      gradient: "from-yellow-600 via-yellow-700 to-amber-800",
      action: () => setView('llantas')
    },
    {
      id: 4,
      title: "SERVICIOS PROFESIONALES",
      subtitle: "30 años de experiencia y confianza",
      discount: "RESERVÁ TURNO",
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      gradient: "from-red-800 via-black to-gray-900",
      action: () => setView('servicios')
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="relative bg-gradient-to-br from-black via-gray-900 to-gray-800 py-12 md:py-16 overflow-hidden">
      {/* Fondo decorativo con colores de marca */}
      <div className="absolute inset-0 opacity-[0.1]">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-600 to-red-800 transform -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-yellow-600 to-amber-700 transform translate-x-1/3 translate-y-1/3 -rotate-12 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-red-700 to-yellow-600 transform -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full opacity-50"></div>
      </div>
      
      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-black text-white mb-2">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent">
              Ofertas Especiales
            </span>
          </h2>
          <p className="text-gray-300 font-medium">Aprovechá nuestras promociones exclusivas</p>
        </div>

        {/* Carrusel Horizontal Moderno */}
        <div className="relative max-w-7xl mx-auto">
          <div className="overflow-hidden rounded-3xl shadow-2xl border border-gray-200/20">
            <div 
              className="flex transition-transform duration-1000 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {banners.map((banner) => (
                <div key={banner.id} className="w-full flex-shrink-0 relative">
                  <div 
                    className={`relative h-72 md:h-96 bg-gradient-to-br ${banner.gradient} overflow-hidden cursor-pointer group`}
                    onClick={banner.action}
                  >
                    {/* Patrón de fondo decorativo */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full transform translate-x-48 -translate-y-48"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full transform -translate-x-32 translate-y-32"></div>
                    </div>
                    
                    {/* Imagen de fondo */}
                    <div className="absolute inset-0">
                      <img 
                        src={banner.image} 
                        alt={banner.title}
                        className="w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-all duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/10"></div>
                    </div>
                    
                    {/* Contenido */}
                    <div className="relative z-10 h-full flex items-center">
                      <div className="container mx-auto px-8 md:px-16">
                        <div className="max-w-3xl">
                          {/* Badge de descuento con animación */}
                          <div className="inline-flex items-center bg-white/25 backdrop-blur-md border border-white/40 rounded-full px-6 py-3 mb-6 shadow-lg group-hover:bg-white/30 transition-all duration-500">
                            <div className="w-2 h-2 bg-white rounded-full mr-3 animate-pulse"></div>
                            <span className="text-white font-black text-base tracking-wider">
                              {banner.discount}
                            </span>
                          </div>
                          
                          {/* Título con efecto gradiente */}
                          <h3 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-none tracking-tight">
                            <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent drop-shadow-2xl">
                              {banner.title}
                            </span>
                          </h3>
                          
                          {/* Subtítulo elegante */}
                          <p className="text-xl md:text-2xl text-white/95 mb-8 font-medium leading-relaxed max-w-2xl">
                            {banner.subtitle}
                          </p>
                          
                          {/* Botón CTA mejorado */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              banner.action();
                            }}
                            className="group/btn inline-flex items-center bg-white text-gray-900 hover:bg-gray-50 font-black text-lg px-8 py-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20 hover:border-white/40"
                          >
                            <span className="mr-3">Ver Ofertas</span>
                            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center group-hover/btn:bg-red-700 transition-colors duration-300">
                              <svg className="w-3 h-3 text-white group-hover/btn:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Efecto de brillo en hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -skew-x-12 group-hover:animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controles de navegación mejorados */}
          <button 
            onClick={prevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/15 backdrop-blur-md hover:bg-white/25 text-white p-4 rounded-full shadow-2xl transition-all duration-300 z-20 border border-white/20 hover:border-white/40 group"
          >
            <svg className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/15 backdrop-blur-md hover:bg-white/25 text-white p-4 rounded-full shadow-2xl transition-all duration-300 z-20 border border-white/20 hover:border-white/40 group"
          >
            <svg className="w-6 h-6 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Indicadores modernos */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-500 rounded-full ${
                  index === currentSlide 
                    ? 'w-8 h-3 bg-white shadow-lg' 
                    : 'w-3 h-3 bg-white/50 hover:bg-white/70 hover:scale-110'
                }`}
              />
            ))}
          </div>

          {/* Contador de slides */}
          <div className="absolute top-6 right-6 bg-black/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium z-20">
            {currentSlide + 1} / {banners.length}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 30th Anniversary Celebration Section ---
interface AnniversaryCelebrationProps {
  setView: SetViewFunction;
}

const AnniversaryCelebrationSection: FC<AnniversaryCelebrationProps> = ({ setView }) => {
  return (
    <div className="bg-gradient-to-b from-gray-800 via-gray-900 to-black py-16 md:py-20">
      <div className="container mx-auto px-4 lg:px-6">
        {/* 30th Anniversary Celebration Banner */}
        <div className="relative bg-gradient-to-br from-black via-gray-900 to-black rounded-3xl p-8 md:p-12 text-center overflow-hidden shadow-2xl border border-yellow-400/30">
        {/* Elegant Golden Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full transform -translate-x-48 -translate-y-48 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-yellow-300 via-yellow-400 to-yellow-500 rounded-full transform translate-x-40 translate-y-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-400 rounded-full transform animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Decorative Golden Particles */}
        <div className="absolute inset-0 z-5">
          <div className="absolute top-16 left-16 w-3 h-3 bg-yellow-400 rounded-full opacity-80 animate-pulse"></div>
          <div className="absolute top-24 right-20 w-2 h-2 bg-yellow-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-yellow-500 rounded-full opacity-70 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/2 right-16 w-2 h-2 bg-yellow-200 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2.5s' }}></div>
          <div className="absolute bottom-32 right-1/3 w-3 h-3 bg-yellow-400 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>
        
        <div className="relative z-10">
          {/* Anniversary Badge */}
          <div className="flex justify-center mb-6">
            <div 
              className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-bold tracking-wider shadow-xl border-2 border-yellow-300"
              style={{ fontFamily: 'var(--font-anniversary-elegant)' }}
            >
              ✨ CELEBRAMOS 30 AÑOS DE EXCELENCIA ✨
            </div>
          </div>
          
          {/* Main Title */}
          <h3 
            className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 tracking-wide"
            style={{ 
              fontFamily: 'var(--font-anniversary-title)',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.5)'
            }}
          >
            <span className="bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-2xl">
              Ofertas Especiales
            </span>
            <br />
            <span className="text-yellow-300 text-2xl md:text-3xl lg:text-4xl font-semibold" style={{ fontFamily: 'var(--font-anniversary-elegant)' }}>
              del 30° Aniversario
            </span>
          </h3>
          
          {/* Elegant Subtitle */}
          <div className="mb-6 md:mb-8">
            <p 
              className="text-lg md:text-xl lg:text-2xl text-yellow-100 font-medium mb-2 tracking-wide"
              style={{ 
                fontFamily: 'var(--font-anniversary-elegant)',
                textShadow: '2px 2px 4px rgba(0,0,0,0.6)'
              }}
            >
              Tres décadas de confianza merecen una celebración especial
            </p>
            <div className="flex justify-center mb-4">
              <div className="w-32 md:w-48 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-90"></div>
            </div>
            <p className="text-base md:text-lg text-yellow-200 opacity-90 font-medium">
              🎉 Financiación sin interés en 12 cuotas • 🚚 Envío gratis en CABA y GBA
            </p>
          </div>
          
          {/* Elegant Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
            <Button 
              variant="default" 
              size="default"
              className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black hover:from-yellow-300 hover:via-yellow-400 hover:to-yellow-500 font-black text-base md:text-lg px-6 md:px-8 py-3 md:py-4 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-yellow-300"
              onClick={() => setView('neumaticos')}
              style={{ fontFamily: 'var(--font-anniversary-elegant)' }}
            >
              ⭐ Ver Neumáticos Premium
            </Button>
            <Button 
              variant="outline" 
              size="default"
              className="border-2 border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black font-black text-base md:text-lg px-6 md:px-8 py-3 md:py-4 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              onClick={() => setView('contacto')}
              style={{ fontFamily: 'var(--font-anniversary-elegant)' }}
            >
              💎 Consultar Financiación VIP
            </Button>
          </div>
          
          {/* Anniversary Message */}
          <div className="mt-6 md:mt-8">
            <p 
              className="text-sm md:text-base text-yellow-300 opacity-80 italic tracking-wide"
              style={{ fontFamily: 'var(--font-anniversary-elegant)' }}
            >
              "30 años cuidando tu seguridad en cada kilómetro"
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

// --- Storefront Component ---
interface StorefrontProps {
    setView: SetViewFunction;
    handleSearch: (filters: Record<string, string>) => void;
}
function Storefront({ setView, handleSearch }: StorefrontProps) { 
  const { products, loading: productsLoading } = useProducts(); // Destructurar loading
  const scrollContainerRef = useRef<HTMLDivElement>(null); 
  const handleProductSelect = (product: Product) => { setView("productDetail", { product: product }); }; 
  const scroll = (offset: number) => { if (scrollContainerRef.current) scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" }); }; 
  const carouselItems: CarouselItem[] = [
    { 
      imageUrl: "https://pub-13fdc27487374a41a3033c5799078fd0.r2.dev/20250513_1654_Promocio%CC%81n_JSC_El_Guardia%CC%81n_simple_compose_01jv5kbjyqefgacz81gwrg0xvr_1_vfk4u5.png", 
      title: "🏆 Llantas Premium del 30° Aniversario", 
      subtitle: "Elegancia y rendimiento excepcional para tu vehículo. Financiación especial disponible.", 
      buttonText: "Explorar Llantas Premium", 
      onClick: () => setView("llantas"), 
    }, 
    { 
      imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80", 
      title: "🔧 Servicios Profesionales Especializados", 
      subtitle: "30 años de experiencia en alineación, balanceo y reparación de frenos.", 
      buttonText: "Reservar Turno", 
      onClick: () => setView("contacto"), 
    },
    { 
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80", 
      title: "⭐ Neumáticos de Calidad Mundial", 
      subtitle: "Las mejores marcas internacionales con garantía extendida y precios especiales.", 
      buttonText: "Ver Neumáticos", 
      onClick: () => setView("neumaticos"), 
    },
  ]; 
  const [isMobile, setIsMobile] = useState(false); 
  useEffect(() => { const check = () => setIsMobile(window.innerWidth < 768); check(); window.addEventListener("resize", check); return () => window.removeEventListener("resize", check); }, []); 
  const displayProducts = Array.isArray(products) ? products : []; 
  const limitedProducts = displayProducts.slice(0, 8); 
  const tireProducts = displayProducts.filter(p => p.category === "neumatico"); 
  const { addToCart } = useCart(); 
  return (
    <>
      {/* 1. HERO SECTION */}
      <HeroSection handleSearch={handleSearch} />
      
      {/* 2. PROMOTIONAL BANNERS - Transición suave del hero */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700">
        <PromotionalBannersSection setView={setView} />
      </div>
      
      {/* 3. PRODUCTOS Y SERVICIOS - Fondo claro para contraste */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-12 md:py-16">
        <div id="productos-servicios" className="container mx-auto px-2 md:px-4 lg:px-6 scroll-mt-20">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
                Productos y Servicios
              </span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Descubrí nuestra amplia gama de productos de calidad premium
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto mt-4"></div>
          </div>
          
          {!isMobile && displayProducts.length > 4 && (
            <div className="flex justify-center mb-6">
              <div className="flex space-x-2 bg-white rounded-full p-2 shadow-lg border">
                <Button variant="outline" size="icon" onClick={() => scroll(-300)} title="Scroll Izquierda" className="rounded-full">
                  <ChevronLeftIcon />
                </Button>
                <Button variant="outline" size="icon" onClick={() => scroll(300)} title="Scroll Derecha" className="rounded-full">
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          )}
          
          {productsLoading && displayProducts.length === 0 ? (
            <GenericLoadingSpinner text="Cargando productos y servicios..." />
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No hay productos disponibles en este momento.</p>
            </div>
          ) : isMobile ? (
            <div className="grid grid-cols-2 gap-4 px-2">
              {limitedProducts.map((p) => (
                <ProductCardMobile key={p.id || Math.random()} product={p} onProductSelect={handleProductSelect} />
              ))}
              {tireProducts.length > 0 && (
                <div className="col-span-2 text-center mt-6">
                  <Button variant="default" size="lg" onClick={() => setView("neumaticos")} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
                    Ver todos los productos
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div ref={scrollContainerRef} className="flex overflow-x-auto space-x-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 -mx-4 px-4">
              {displayProducts.map((p) => (
                <ProductCard key={p.id || Math.random()} product={p} onProductSelect={handleProductSelect} />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 4. IMAGE CAROUSEL - Fondo neutro */}
      <div className="bg-gray-100 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Servicios Especializados
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Ofrecemos servicios profesionales para mantener tu vehículo en perfectas condiciones
            </p>
          </div>
          <ImageCarousel items={carouselItems} />
        </div>
      </div>
      
      {/* 5. WHY CHOOSE US - Fondo blanco para destacar */}
      <div className="bg-white py-12 md:py-16">
        <WhyChooseUs />
      </div>
    </>
  ) 
}


// --- Product Detail Page (CON CARRUSEL DE IMAGEN) ---
interface ProductDetailProps {
    product: Product | null; // Puede ser null inicialmente
    setView: SetViewFunction;
}
function ProductDetail({ product, setView }: ProductDetailProps) {
  const { addToCart } = useCart();
  const { products: allProducts, loading: productsLoading } = useProducts(); // Obtener todos los productos
  const [activeTab, setActiveTab] = useState<"details" | "specs" | "reviews">("details");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null); // Ref para el scroll de relacionados

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

  // Lógica para productos relacionados
  const relatedProducts = useMemo(() => {
    if (!product || !allProducts || allProducts.length === 0) return [];
    return allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 8); // Mostrar hasta 8 productos
  }, [product, allProducts]);

  const handleRelatedProductSelect = (selectedRelatedProduct: Product) => {
    setView("productDetail", { product: selectedRelatedProduct });
  };

  const scrollRelated = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 lg:px-6 py-6 md:py-12">
        <Button variant="outline" size="sm" onClick={() => setView("storefront")} className="mb-6 inline-flex items-center gap-2"><ArrowLeftIcon /> Volver</Button>
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
          <div className="md:col-span-5 lg:col-span-5 flex flex-col">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm mb-5">
               <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-2 self-start">{categories.find((c) => c.value === product.category)?.label || "Producto"}</span>
               <h1 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">{product.name || 'Nombre no disponible'}</h1>
                {product.rating !== undefined && product.rating > 0 && (<div className="flex items-center mb-3 text-sm"><div className="flex">{[1, 2, 3, 4, 5].map((star) => (<StarIcon key={star} filled={star <= Math.round(product.rating || 0)} />))}</div><button className="text-gray-500 ml-2 hover:underline cursor-pointer text-sm" onClick={() => setActiveTab("reviews")}>({product.reviewCount || 0} opiniones)</button></div>)}
               <div className="mb-4"><span className={`text-2xl md:text-3xl font-bold ${isService ? "text-red-600" : "text-black"}`}>{isService ? "Consultar Precio" : `$${product.price?.toLocaleString("es-AR") ?? 'N/A'}`}</span></div>
               <Button size="lg" variant={isService ? "outline" : "default"} className="w-full mb-3" onClick={handleAddToCartClick} disabled={!isService && (!product || typeof product.price !== 'number')}> {isService ? "Solicitar Consulta" : "Agregar al Carrito"} </Button>
                <div className="text-xs text-gray-500 space-y-1 border-t pt-3"><p className="flex items-center gap-1.5"><UserIcon className="w-4 h-4" /> Vendido por: <span className="font-medium text-gray-700">JCS El Guardián</span><ShieldCheckIcon className="w-4 h-4 text-green-600 ml-1" /></p><p className="flex items-center gap-1.5"><StoreIcon className="w-4 h-4" /> Retiro <span className="font-medium text-green-600">Gratis</span> en San Justo</p><p className="flex items-center gap-1.5"><TruckIcon className="w-4 h-4" /> Envío a coordinar</p></div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex-grow">
               <div className="border-b border-gray-200 mb-4"><nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide" aria-label="Tabs"><button onClick={() => setActiveTab("details")} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === "details" ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>Detalles</button>{product.specs && Object.keys(product.specs).length > 0 && (<button onClick={() => setActiveTab("specs")} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === "specs" ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>Especificaciones</button>)}<button onClick={() => setActiveTab("reviews")} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === "reviews" ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>Reseñas ({product.reviewCount || 0})</button></nav></div>
               <div className="mt-4">{renderTabContent()}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Sección de Productos Relacionados */}
      {relatedProducts.length > 0 && (
        <div className="container mx-auto px-4 lg:px-6 py-8 md:py-12 border-t mt-8 md:mt-12">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-semibold">También te podría interesar</h2>
            {relatedProducts.length > 3 && ( 
              <div className="hidden sm:flex space-x-2">
                <Button variant="outline" size="icon" onClick={() => scrollRelated(-300)} title="Scroll Izquierda">
                  <ChevronLeftIcon />
                </Button>
                <Button variant="outline" size="icon" onClick={() => scrollRelated(300)} title="Scroll Derecha">
                  <ChevronRightIcon />
                </Button>
              </div>
            )}
          </div>
          <div ref={scrollContainerRef} className="flex overflow-x-auto space-x-4 pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 -mx-4 px-4">
            {relatedProducts.map((relatedP) => (
              <ProductCard
                key={relatedP.id}
                product={relatedP}
                onProductSelect={handleRelatedProductSelect}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
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
  const { products, loading: productsLoading } = useProducts(); // Destructurar y renombrar loading
  const [selectedBrand, setSelectedBrand] = useState(initialBrandFilter || "");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  // Nuevos estados para los filtros de chips
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrandFilter ? [initialBrandFilter] : []);
  const [selectedRodados, setSelectedRodados] = useState<number[]>([]);
  // Nuevo estado para búsqueda por nombre
  const [searchQuery, setSearchQuery] = useState("");
  // Siempre usar filtros visuales para llantas
  const useVisualFilters = category === 'llanta';

  // Calcular marcas disponibles
  const availableBrands = useMemo(() => {
      const safeProducts = Array.isArray(products) ? products : [];
      if (!safeProducts || !category) return [];
      let categoryProducts = safeProducts.filter(p => p && p.category === category);
      
      // Aplica filtros de HeroSearch ANTES de sacar las marcas
      if (currentFilters.ancho) { categoryProducts = categoryProducts.filter((p) => p && String(p.specs?.ancho) === String(currentFilters.ancho)); }
      if (currentFilters.perfil) { categoryProducts = categoryProducts.filter((p) => p && String(p.specs?.perfil) === String(currentFilters.perfil)); }
      if (currentFilters.diametro) { categoryProducts = categoryProducts.filter((p) => p && String(p.specs?.rodado) === String(currentFilters.diametro)); }
      
      // Para llantas, buscar en specs.marca (que es más específico para llantas)
      if (category === 'llanta') {
        const brands = new Set<string>();
        categoryProducts.forEach(p => {
          if (p && p.specs?.marca) {
            brands.add(String(p.specs.marca));
          }
        });
        return Array.from(brands).sort();
      } else {
        // Para neumáticos y otros, usar getProductBrand
        const brands = new Set(categoryProducts.map(p => getProductBrand(p)).filter((b): b is string => b !== null && b !== 'Otros')); 
        return Array.from(brands).sort();
      }
  }, [products, category, currentFilters]);

  // Calcular rodados disponibles (solo para llantas)
  const availableRodados = useMemo(() => {
      if (category !== 'llanta') return [];
      const productsList = Array.isArray(products) ? products : [];
      if (!productsList || !category) return [];
      
      let categoryProducts = productsList.filter((p: Product) => p && p.category === category);
      
      // Aplicar filtros ya seleccionados (excepto rodados)
      if (selectedBrands.length > 0) {
          categoryProducts = categoryProducts.filter((p: Product) => 
              p && p.specs?.marca && selectedBrands.includes(String(p.specs.marca))
          );
      }
      
      // También aplicar filtros de precio si hay alguno seleccionado
      if (selectedPriceRange) {
          const [minStr, maxStr] = selectedPriceRange.split('-');
          const minPrice = parseInt(minStr);
          const maxPrice = maxStr ? parseInt(maxStr) : Infinity;
          categoryProducts = categoryProducts.filter((p: Product) => { 
              if (!p || typeof p.price !== 'number' || p.price <= 0) return false; 
              return p.price >= minPrice && p.price <= maxPrice; 
          });
      }
      
      const rodados = new Set<number>();
      categoryProducts.forEach((p: Product) => {
          if (p && p.specs?.rodado) {
              // Convertir a número para asegurar que los valores se almacenen correctamente
              const rodadoNum = Number(p.specs.rodado);
              if (!isNaN(rodadoNum)) {
                  rodados.add(rodadoNum);
              }
          }
      });
      
      return Array.from(rodados).sort((a, b) => a - b);
  }, [products, category, selectedBrands, selectedPriceRange]);
  
  // Manejadores para los filtros visuales
  const handleBrandToggle = (brand: string) => {
      setSelectedBrands(prev => 
          prev.includes(brand) 
              ? prev.filter(b => b !== brand) 
              : [...prev, brand]
      );
      setSelectedBrand(""); // Limpiar el filtro de menú desplegable para evitar conflictos
  };
  
  const handleRodadoToggle = (rodado: number) => {
      setSelectedRodados(prev => 
          prev.includes(rodado) 
              ? prev.filter(r => r !== rodado) 
              : [...prev, rodado]
      );
  };

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

    // 3. Filtro de búsqueda por nombre
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        results = results.filter(p => {
            if (!p) return false;
            const name = p.name?.toLowerCase() || "";
            const description = p.description?.toLowerCase() || "";
            return name.includes(query) || description.includes(query);
        });
    }

    // 4. Filtro de marca
    const activeBrandFilter = selectedBrand || initialBrandFilter;
    if (activeBrandFilter) {
        results = results.filter(p => { if(!p) return false; const productBrand = getProductBrand(p); return productBrand?.toLowerCase() === activeBrandFilter.toLowerCase(); });
    }

    // 5. Filtro de precio
    if (selectedPriceRange) {
        const [minStr, maxStr] = selectedPriceRange.split('-');
        const minPrice = parseInt(minStr);
        const maxPrice = maxStr ? parseInt(maxStr) : Infinity;
        results = results.filter(p => { if (!p || typeof p.price !== 'number' || p.price <= 0) return false; return p.price >= minPrice && p.price <= maxPrice; });
    }

    // 6. Filtros visuales (chips)
    if (useVisualFilters) {
        // Filtro de marcas (visual)
        if (selectedBrands.length > 0) {
            results = results.filter(p => {
                if (!p || !p.specs?.marca) return false;
                return selectedBrands.includes(String(p.specs.marca));
            });
        }
        
        // Filtro de rodados (visual)
        if (selectedRodados.length > 0) {
            results = results.filter(p => {
                if (!p || !p.specs?.rodado) return false;
                return selectedRodados.includes(Number(p.specs.rodado));
            });
        }
    }

    return results;
  }, [products, category, currentFilters, filterType, searchQuery, selectedBrand, selectedPriceRange, initialBrandFilter, useVisualFilters, selectedBrands, selectedRodados]);

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

  // Añadimos estos estados al nivel superior
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 9; // 3 columnas x 3 filas

  return (
    <div className="container mx-auto px-0 md:px-4 lg:px-6 py-4 md:py-12">
      {isMobile ? (
        // Vista Móvil
        productsLoading && (!Array.isArray(products) || products.length === 0) ? (
          <GenericLoadingSpinner text={`Cargando ${pageTitle}...`} />
        ) : (
          <ProductGridMobile 
            products={filteredProducts} 
            onProductSelect={handleProductSelect} 
            categoryLabel={pageTitle} 
            setView={setView} 
            addToCart={addToCart}
          />
        )
      ) : (
        <>
          <h1 className="mb-6 text-center flex justify-center">
            <span 
              className="text-xl md:text-2xl lg:text-3xl font-bold text-black tracking-wide celtic-title-elegant text-center"
              style={{ 
                fontFamily: 'var(--font-uncial-antiqua)',
                letterSpacing: '0.05em',
                display: 'block',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {pageTitle}
            </span>
            {hasActiveSearchFilters && !activeBrandFilter && (
              <span className="block text-sm font-normal text-gray-500 mt-2">
                (Filtros: {Object.entries(currentFilters).filter(([key, val]) => key !== 'category' && val).map(([key, val]) => `${key=='diametro'?'R':''}${val}`).join('/')})
              </span>
            )}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              {/* Panel de filtros moderno */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
                {/* Header del panel */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Filtros</h3>
                      <p className="text-red-100 text-sm">Encuentra tu producto ideal</p>
                    </div>
                  </div>
                </div>
                
                {/* Filtros activos */}
                {(searchQuery || selectedBrand || selectedPriceRange || selectedBrands.length > 0 || selectedRodados.length > 0) && (
                  <div className="p-4 bg-red-50 border-b border-red-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-800">Filtros activos</span>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedBrand("");
                          setSelectedPriceRange("");
                          setSelectedBrands([]);
                          setSelectedRodados([]);
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Limpiar todo
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {searchQuery && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Búsqueda: "{searchQuery}"
                          <button onClick={() => setSearchQuery("")} className="hover:bg-red-200 rounded-full p-0.5">
                            <XMarkIcon />
                          </button>
                        </span>
                      )}
                      {selectedBrand && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          {selectedBrand}
                          <button onClick={() => setSelectedBrand("")} className="hover:bg-red-200 rounded-full p-0.5">
                            <XMarkIcon />
                          </button>
                        </span>
                      )}
                      {selectedBrands.map(brand => (
                        <span key={brand} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          {brand}
                          <button onClick={() => handleBrandToggle(brand)} className="hover:bg-red-200 rounded-full p-0.5">
                            <XMarkIcon />
                          </button>
                        </span>
                      ))}
                      {selectedRodados.map(rodado => (
                        <span key={rodado} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          R{rodado}
                          <button onClick={() => handleRodadoToggle(rodado)} className="hover:bg-red-200 rounded-full p-0.5">
                            <XMarkIcon />
                          </button>
                        </span>
                      ))}
                      {selectedPriceRange && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          {priceRanges.find(r => r.value === selectedPriceRange)?.label}
                          <button onClick={() => setSelectedPriceRange("")} className="hover:bg-red-200 rounded-full p-0.5">
                            <XMarkIcon />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Búsqueda por nombre */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                      <SearchIcon />
                    </div>
                    <h4 className="font-semibold text-gray-800">Buscar</h4>
                  </div>
                  
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={`Buscar ${categoryLabel.toLowerCase()}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon />
                    </div>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon />
                      </button>
                    )}
                  </div>
                  
                  {searchQuery && (
                    <div className="mt-3 text-xs text-gray-500">
                      Buscando: "{searchQuery}"
                    </div>
                  )}
                </div>
                
                {/* Filtro de marca */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800">Marca</h4>
                  </div>
                  
                  {useVisualFilters ? (
                    <div className="space-y-3">
                      {availableBrands.map((brand) => (
                        <label key={brand} className="flex items-center group cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(brand)}
                              onChange={() => handleBrandToggle(brand)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                              selectedBrands.includes(brand)
                                ? 'bg-red-600 border-red-600'
                                : 'border-gray-300 group-hover:border-red-400'
                            }`}>
                              {selectedBrands.includes(brand) && (
                                <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-medium">{brand}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="relative">
                      <Select
                        value={selectedBrand}
                        onChange={handleBrandChange}
                        className="w-full text-sm bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Todas las marcas</option>
                        {availableBrands.map((brand) => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>
                
                {/* Filtro de precio */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-800">Precio</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {priceRanges.map((range) => (
                      <label key={range.value} className="flex items-center group cursor-pointer">
                        <div className="relative">
                                                     <input
                             type="radio"
                             name="priceRange"
                             value={range.value}
                             checked={selectedPriceRange === range.value}
                             onChange={(e) => setSelectedPriceRange(e.target.value)}
                             className="sr-only"
                           />
                          <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                            selectedPriceRange === range.value
                              ? 'bg-green-600 border-green-600'
                              : 'border-gray-300 group-hover:border-green-400'
                          }`}>
                            {selectedPriceRange === range.value && (
                              <div className="w-2 h-2 bg-white rounded-full absolute top-1.5 left-1.5"></div>
                            )}
                          </div>
                        </div>
                        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-medium">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Filtro de rodado (solo para llantas) */}
                {category === 'llanta' && availableRodados.length > 0 && (
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TireIcon />
                      </div>
                      <h4 className="font-semibold text-gray-800">Rodado</h4>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {availableRodados.map((rodado) => (
                        <button
                          key={rodado}
                          onClick={() => handleRodadoToggle(rodado)}
                          className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                            selectedRodados.includes(rodado)
                              ? 'bg-purple-600 border-purple-600 text-white shadow-lg transform scale-105'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-purple-400 hover:bg-purple-50'
                          }`}
                        >
                          <div className="font-bold text-sm">R{rodado}</div>
                          <div className="text-xs opacity-75">{rodado}"</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Estadísticas */}
                <div className="p-6 bg-gray-50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{filteredProducts.length}</div>
                    <div className="text-sm text-gray-600">productos encontrados</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              {productsLoading && (!Array.isArray(products) || products.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-xl border border-gray-200 min-h-[300px]">
                  <GenericLoadingSpinner text={`Cargando ${categoryLabel}...`} />
                </div>
              ) : filteredProducts.length === 0 && (Array.isArray(products) && products.length > 0) ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center min-h-[300px] flex flex-col justify-center items-center">
                  <p className="text-gray-500 mb-4">No se encontraron productos con los filtros seleccionados.</p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedBrands([]);
                      setSelectedRodados([]);
                      setSelectedPriceRange('');
                      setSelectedBrand('');
                      setView(category as ViewName, { filters: { category: category } });
                    }} 
                    className="text-sm text-red-600 hover:underline"
                  >
                    Limpiar filtros y ver todos
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center min-h-[300px] flex flex-col justify-center items-center">
                  <p className="text-gray-500 mb-4">No se encontraron productos con los filtros seleccionados.</p>
                  <button 
                    onClick={() => {
                      setSelectedBrands([]);
                      setSelectedRodados([]);
                      setSelectedPriceRange('');
                      setSelectedBrand('');
                      setView(category as ViewName, { filters: { category: category } });
                    }} 
                    className="text-sm text-red-600 hover:underline"
                  >
                    Limpiar filtros y ver todos
                  </button>
                </div>
              ) : (
                <>
                  {/* Calcular productos a mostrar en la página actual */}
                  {(() => {
                    // Calcular productos a mostrar en la página actual
                    const indexOfLastProduct = currentPage * productsPerPage;
                    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
                    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
                    
                    // Calcular total de páginas
                    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
                    
                    // Función para cambiar página
                    const paginate = (pageNumber: number) => {
                      setCurrentPage(pageNumber);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    };
                    
                    // Renderizar componentes
                    return (
                      <>
                        {/* Grid de productos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                          {currentProducts.map((product) => (
                            <ProductCard 
                              key={product.id || Math.random()} 
                              product={product} 
                              onProductSelect={handleProductSelect} 
                            />
                          ))}
                        </div>
                        
                        {/* Controles de paginación */}
                        {totalPages > 1 && (
                          <div className="flex justify-center items-center mt-8 bg-white rounded-lg border border-gray-200 p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => paginate(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="mr-2"
                              aria-label="Página anterior"
                            >
                              <ChevronLeftIcon />
                            </Button>
                            
                            <div className="flex space-x-1">
                              {Array.from({ length: totalPages }, (_, i) => {
                                // Mostrar solo un número limitado de páginas
                                const pageNum = i + 1;
                                const isCurrentPage = pageNum === currentPage;
                                
                                // Mostrar solo páginas cercanas a la actual
                                if (
                                  pageNum === 1 || 
                                  pageNum === totalPages || 
                                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                ) {
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={isCurrentPage ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => paginate(pageNum)}
                                      className={`w-8 h-8 p-0 ${isCurrentPage ? 'bg-red-600 text-white' : ''}`}
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                } else if (
                                  pageNum === currentPage - 2 || 
                                  pageNum === currentPage + 2
                                ) {
                                  return <span key={pageNum} className="px-2 flex items-center">...</span>;
                                }
                                
                                return null;
                              })}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => paginate(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="ml-2"
                              aria-label="Página siguiente"
                            >
                              <ChevronRightIcon />
                            </Button>
                          </div>
                        )}
                        
                        {/* Mostrar conteo de productos */}
                        <div className="text-center mt-4 text-sm text-gray-500">
                          Mostrando {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} de {filteredProducts.length} productos
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}


// --- Contacto Page Component ---
function ContactoPage() { 
  const pN = "4482 - 0369 | 0463"; 
  const em = "info@jcselguardian.com.ar"; 
  const ad = "Av. General Enrique Mosconi 2084, B1754 San Justo, Provincia de Buenos Aires"; 
  const sc = "L-V 8-18hs, Sáb 8-13hs."; 
  const whatsappNumber = "5491144820369";
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section con estilo del 30° aniversario */}
      <div className="relative bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white py-16 md:py-24 overflow-hidden">
        {/* Elementos decorativos sutiles */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 border border-white/20 rounded-full animate-spin-slow"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 border border-white/10 rounded-full animate-spin-reverse"></div>
        </div>
        
        {/* Sol de Mayo sutil */}
        <div className="absolute top-8 right-8 opacity-15">
          <SolDeMayo className="text-yellow-300/60" size={32} />
        </div>
        
        <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
          {/* Badge del 30° Aniversario */}
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black px-4 py-1.5 rounded-full text-xs font-bold tracking-wider shadow-lg animate-pulse">
              <span className="relative">✨ 30 AÑOS DE CONFIANZA ✨</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
            <span className="bg-gradient-to-b from-red-400 via-red-500 to-red-700 bg-clip-text text-transparent drop-shadow-2xl"
                  style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CONTACTO
            </span>
          </h1>
          <p className="text-lg md:text-xl text-yellow-100 max-w-2xl mx-auto">
            Estamos aquí para ayudarte con todo lo que necesites
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 lg:px-6 py-10 md:py-16">
      
      <div className="max-w-6xl mx-auto">
        {/* Información de Contacto y Formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
              Información de Contacto
            </h2>
            <p className="text-gray-600 mb-5 text-sm">Ponte en contacto con nosotros para cualquier consulta sobre neumáticos, llantas y servicios.</p>
            
            <ul className="space-y-4 text-gray-700 text-sm">
              <li className="flex items-start">
                <PhoneIcon className="w-5 h-5 mr-3 mt-0.5 text-red-600 shrink-0" />
                <div>
                  <strong>Teléfono:</strong><br />
                  <a href={`tel:${pN.replace(/\D/g, "")}`} className="hover:text-red-700">{pN}</a>
                </div>
              </li>
              <li className="flex items-start">
                <UserIcon className="w-5 h-5 mr-3 mt-0.5 text-red-600 shrink-0" />
                <div>
                  <strong>Email:</strong><br />
                  <a href={`mailto:${em}`} className="hover:text-red-700 break-all">{em}</a>
                </div>
              </li>
              <li className="flex items-start">
                <LocationIcon className="w-5 h-5 mr-3 mt-0.5 text-red-600 shrink-0" />
                <div>
                  <strong>Dirección:</strong><br />
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(ad)}`} target="_blank" rel="noreferrer" className="hover:text-red-700">{ad}</a>
                </div>
              </li>
              <li className="flex items-start">
                <ClockIcon className="w-5 h-5 mr-3 mt-0.5 text-red-600 shrink-0" />
                <div>
                  <strong>Horarios de Atención:</strong><br />
                  {sc}
                </div>
              </li>
            </ul>

            {/* Botones de Acción */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
              <a 
                href={`https://wa.me/${whatsappNumber}?text=Hola,%20me%20interesa%20consultar%20sobre%20sus%20productos`}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                <WhatsAppIcon className="w-5 h-5" />
                Consultar por WhatsApp
              </a>
              <a 
                href={`tel:${pN.replace(/\D/g, "")}`}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                <PhoneIcon className="w-5 h-5" />
                Llamar Ahora
              </a>
            </div>

            {/* Reseñas de Google */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-400">
                  {"★".repeat(5)}
                </div>
                <span className="text-sm font-medium">4.6 de 5</span>
              </div>
              <p className="text-xs text-gray-600">Basado en 1,272 reseñas de Google</p>
              <a 
                href="https://maps.google.com/?q=JCS+El+Guardián+San+Justo" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Ver todas las reseñas →
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              Envíanos un Mensaje
            </h2>
            <form onSubmit={(e: FormEvent<HTMLFormElement>) => {e.preventDefault(); alert('Formulario enviado (simulación).');}}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contact-name">Nombre *</Label>
                  <Input id="contact-name" type="text" placeholder="Tu nombre completo" required />
                </div>
                <div>
                  <Label htmlFor="contact-email">Email *</Label>
                  <Input id="contact-email" type="email" placeholder="tu@email.com" required />
                </div>
                <div>
                  <Label htmlFor="contact-phone">Teléfono</Label>
                  <Input id="contact-phone" type="tel" placeholder="(011) 1234-5678" />
                </div>
                <div>
                  <Label htmlFor="contact-subject">Asunto</Label>
                  <Select id="contact-subject">
                    <option value="">Seleccionar asunto</option>
                    <option value="neumaticos">Consulta sobre Neumáticos</option>
                    <option value="llantas">Consulta sobre Llantas</option>
                    <option value="servicios">Servicios de Taller</option>
                    <option value="presupuesto">Solicitar Presupuesto</option>
                    <option value="garantia">Garantía</option>
                    <option value="otro">Otro</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contact-message">Mensaje *</Label>
                  <Textarea id="contact-message" placeholder="¿En qué podemos ayudarte? Describe tu consulta..." rows={4} required />
                </div>
                <div className="text-right pt-2">
                  <Button type="submit" className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-full py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    Enviar Mensaje
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Mapa de Google Maps */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent mb-2">
              Nuestra Ubicación
            </h2>
            <p className="text-gray-600 text-sm">Visítanos en nuestro local en San Justo, Buenos Aires</p>
          </div>
          <div className="relative h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3282.8234567890123!2d-58.5567890!3d-34.6789012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDQwJzQ0LjAiUyA1OMKwMzMnMjQuNCJX!5e0!3m2!1ses!2sar!4v1234567890123!5m2!1ses!2sar"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación de JCS El Guardián"
            ></iframe>
            {/* Overlay con información */}
            <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-xs">
              <h3 className="font-semibold text-sm text-gray-800 mb-1">JCS El Guardián</h3>
              <p className="text-xs text-gray-600 mb-2">{ad}</p>
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400 text-xs">
                  {"★".repeat(5)}
                </div>
                <span className="text-xs text-gray-600">4.6 (1,272 reseñas)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-xl shadow-lg border border-red-100 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ClockIcon className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Horarios Extendidos</h3>
            <p className="text-sm text-gray-600">Lunes a Viernes: 8:00 - 18:00<br />Sábados: 8:00 - 13:00</p>
            <div className="mt-3 text-yellow-500">
              ⭐⭐⭐⭐⭐
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-lg border border-green-100 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <WhatsAppIcon className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Atención Inmediata</h3>
            <p className="text-sm text-gray-600">Respuesta rápida por WhatsApp<br />Consultas y presupuestos</p>
            <div className="mt-3 text-yellow-500">
              ⭐⭐⭐⭐⭐
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-lg border border-blue-100 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <LocationIcon className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Fácil Acceso</h3>
            <p className="text-sm text-gray-600">Ubicación estratégica en San Justo<br />Estacionamiento disponible</p>
            <div className="mt-3 text-yellow-500">
              ⭐⭐⭐⭐⭐
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  ) 
}


// --- Nosotros Page Component ---
function NosotrosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section minimalista con colores del brand */}
      <div className="relative bg-gradient-to-br from-black via-gray-900 to-black py-16 md:py-24">
        {/* Sol de Mayo sutil en rojo */}
        <div className="absolute top-8 right-8 opacity-20">
          <SolDeMayo className="text-red-500" size={32} />
        </div>
        
        <div className="container mx-auto px-4 lg:px-6 text-center">
          {/* Badge del 30° aniversario en dorado */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black px-6 py-2 rounded-full text-sm font-bold tracking-wider shadow-lg">
              ✨ 30 años de trayectoria ✨
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-red-500">
            NOSOTROS
          </h1>
          
          <p className="text-lg md:text-xl text-white max-w-2xl mx-auto leading-relaxed">
            Conocé un poco más sobre JCS El Guardián
          </p>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="container mx-auto px-4 lg:px-6 py-16">
        
        {/* ¿Por qué elegirnos? */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              ¿Por qué elegirnos?
            </h2>
            <div className="w-16 h-1 bg-red-500 mx-auto"></div>
          </div>
          
          <div className="bg-gray-50 border-l-4 border-red-500 p-8 md:p-12 rounded-lg shadow-sm">
            <p className="text-gray-700 text-lg leading-relaxed text-center mb-6">
              Contamos con un equipo altamente calificado, cuya experiencia y especialización se ha consolidado a lo largo de estos años en el rubro.
            </p>
            <p className="text-black text-lg leading-relaxed text-center font-semibold">
              Nuestro propósito es asegurar la satisfacción y tranquilidad de nuestros clientes.
            </p>
          </div>
        </div>

        {/* Equipo JCS */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Equipo JCS
            </h2>
            <h3 className="text-xl font-semibold text-red-600 mb-4">
              Conocé a nuestro equipo
            </h3>
            <div className="w-16 h-1 bg-red-500 mx-auto"></div>
          </div>
          
          <div className="bg-black text-white p-8 md:p-12 rounded-lg text-center shadow-lg">
            <p className="text-white text-lg leading-relaxed font-semibold">
              Acompañamos a nuestros clientes en cada kilómetro.
            </p>
          </div>
        </div>

        {/* Nuestros valores */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Nuestros valores
            </h2>
            <div className="w-16 h-1 bg-red-500 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 hover:bg-gray-50 rounded-lg transition-colors duration-300 border border-gray-200">
              <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <ClockIcon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-black mb-3">Rapidez</h3>
              <p className="text-gray-600 leading-relaxed">
                Atención ágil y eficiente para que no pierdas tiempo
              </p>
            </div>
            
            <div className="text-center p-6 hover:bg-gray-50 rounded-lg transition-colors duration-300 border border-gray-200">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <ShieldCheckIcon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-black mb-3">Calidad</h3>
              <p className="text-gray-600 leading-relaxed">
                Productos y servicios de primera línea
              </p>
            </div>
            
            <div className="text-center p-6 hover:bg-gray-50 rounded-lg transition-colors duration-300 border border-gray-200">
              <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TruckIcon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-black mb-3">Confianza</h3>
              <p className="text-gray-600 leading-relaxed">
                30 años de respaldo y experiencia en el rubro
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action con colores del brand */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              ¿Cómo podemos ayudarte?
            </h2>
            <div className="w-16 h-1 bg-red-500 mx-auto mb-6"></div>
          </div>
          
          <div className="bg-black text-white p-8 md:p-12 rounded-lg text-center shadow-xl">
            <p className="text-white text-lg leading-relaxed mb-8">
              Tenemos personal de atención para proporcionarte toda la información necesaria.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-300 shadow-lg"
                onClick={() => window.location.href = 'https://wa.me/5491144820369'}
              >
                <WhatsAppIcon className="w-5 h-5 mr-2" />
                Contactar por WhatsApp
              </Button>
              
              <Button 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-black font-semibold px-8 py-3 rounded-lg transition-all duration-300"
                onClick={() => window.location.href = 'tel:44820369'}
              >
                <PhoneIcon className="w-5 h-5 mr-2" />
                Llamar ahora
              </Button>
            </div>
            
            <div className="mt-8">
              <p className="text-red-400 font-semibold">
                Rapidez, Calidad y Confianza desde 1995
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


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
// --- InfoModal Component ---
interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  actionText?: string;
}

function InfoModal({ isOpen, onClose, title, message, actionText = "Entendido" }: InfoModalProps) {
  if (!isOpen) return null;
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300" 
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-11/12 max-w-md animate-fadeIn">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="p-5">
          <p className="text-gray-700">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end rounded-b-lg">
          <Button
            onClick={onClose}
            variant="default"
            className="bg-red-600 hover:bg-red-700"
          >
            {actionText}
          </Button>
        </div>
      </div>
    </>
  );
}

function CheckoutPage({ setView }: CheckoutPageProps) {
  const { cartItems, totalPrice, clearCart } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("mercadopago");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
    // Campos para facturación
    documento: "",
    tipoDocumento: "DNI",
    razonSocial: "",
    tipoFactura: "B"
  });
  const [saveInfo, setSaveInfo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mostrarDatosFiscales, setMostrarDatosFiscales] = useState(false);
  const [orderReference, setOrderReference] = useState('');
  
  // Estado para el modal de información de pago con tarjeta
  const [showCardInfoModal, setShowCardInfoModal] = useState(false);
  const openCardInfoModal = () => setShowCardInfoModal(true);
  const closeCardInfoModal = () => setShowCardInfoModal(false);
  
  const validCartItems = Array.isArray(cartItems) ? cartItems : [];
  
  // Redireccionar si carrito vacío
  useEffect(() => {
    if (validCartItems.length === 0 && !orderPlaced) {
      const timer = setTimeout(() => setView('cart'), 50);
      return () => clearTimeout(timer);
    }
  }, [validCartItems, orderPlaced, setView]);
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Generar ID de referencia del pedido
      const referenceId = Math.random().toString(36).substring(2, 10).toUpperCase();
      setOrderReference(referenceId);
      
      // Generar texto detallado de productos
      const detalleProductosTexto = validCartItems.map(item => 
        `${item.quantity}x ${item.name}`
      ).join(", ");
      
      // MODIFICACIÓN: Si es 'creditCard', mostrar modal informativo en lugar de alert
      if (paymentMethod === 'creditCard') {
        console.log("APP-CONTENT: Intento de pago con 'creditCard' detectado. Mostrando modal informativo.");
        openCardInfoModal();
        setIsProcessing(false);
        return; // Detener el procesamiento aquí para 'creditCard'
      }
      
      // Preparar datos del pedido (esto solo se ejecutará si no es 'creditCard')
      const orderData: OrderDetails = {
        pedidoId: referenceId,
        fechaPedido: new Date().toISOString(),
        cliente: formData.name,
        emailCliente: formData.email,
        telefonoCliente: formData.phone,
        direccionEnvio: formData.address,
        ciudadEnvio: formData.city,
        cpEnvio: formData.postalCode,
        notasAdicionales: formData.notes,
        subtotal: totalPrice,
        costoEnvio: 0, // A determinar posteriormente
        totalPedido: totalPrice,
        detalleProductosTexto,
        estadoPedido: "Pendiente de Pago",
        metodoPago: paymentMethod, // Ya no será 'creditCard' en este punto
        datosFiscales: mostrarDatosFiscales ? {
          documento: formData.documento,
          tipoDocumento: formData.tipoDocumento,
          razonSocial: formData.razonSocial,
          tipoFactura: formData.tipoFactura
        } : undefined
      };
      
      console.log("💡 CHECKOUT PAGE (app-content) - Enviando pedido a la API:", {
        pedidoId: orderData.pedidoId,
        metodoPago: orderData.metodoPago,
        valorDePaymentMethodEstado: paymentMethod
      });
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error(await response.text() || 'Error al crear el pedido');
      }
      
      const result = await response.json();
      
      console.log("Orden confirmada (app-content):", { 
        orderData,
        apiResponse: result
      });
      
      // --- INICIO DE LA MODIFICACIÓN IMPORTANTE ---
      // Si el método de pago es 'creditCard', el CardPaymentBrick en checkout-form.tsx
      // es el responsable de procesar el pago y actualizar el estado del pedido.
      // Aquí, en app-content.tsx, solo hemos registrado el pedido.
      // No creamos preferencia de MP ni redirigimos.
      if (paymentMethod === 'creditCard') {
        console.log("APP-CONTENT: Método de pago es 'creditCard'. Pedido registrado. El Brick en CheckoutForm se encargará del pago.");
        // No actualizamos orderPlaced aquí. CheckoutForm lo hará después del pago exitoso del Brick.
        // Es importante NO llamar a clearCart() aquí tampoco.
        setIsProcessing(false); // Dejamos de mostrar "Procesando..." del botón de app-content
        // Aquí podrías considerar mostrar un mensaje al usuario indicando que complete los datos de la tarjeta
        // en el formulario que se muestra (el Brick).
        // Por ejemplo: alert("Por favor, completa los datos de tu tarjeta a continuación.");
        return; // Salimos de handleConfirmOrder de app-content para que CheckoutForm tome el control.
      }
      // --- FIN DE LA MODIFICACIÓN IMPORTANTE ---
      
      // El siguiente bloque SOLO se ejecutará si paymentMethod es 'mercadopago' (para redirección)
      // o para otros métodos que no sean 'creditCard'.
      if (paymentMethod === 'mercadopago') {
        console.log("🟢 APP-CONTENT: INICIANDO INTEGRACIÓN CON MERCADO PAGO (Redirección) 🟢");
        
        try {
          const mercadoPagoData = {
            items: cartItems.map(item => ({
              id: item.id.toString(),
              title: item.name,
              description: "Producto",
              picture_url: item.imageUrl || "https://placehold.co/100",
              quantity: item.quantity,
              unit_price: item.price,
              currency_id: 'ARS'
            })),
            payer: {
              name: formData.name,
              email: formData.email,
              phone: {
                area_code: "",
                number: formData.phone
              },
              address: {
                street_name: formData.address,
                zip_code: formData.postalCode
              }
            },
            back_url: { 
              success: `${window.location.origin}/confirmacion?status=success`,
              failure: `${window.location.origin}/confirmacion?status=failure`,
              pending: `${window.location.origin}/confirmacion?status=pending`,
            },
            external_reference: result.order.pedidoId, // Usamos el ID del pedido creado
            // No incluimos payment_methods.excluded_payment_types aquí, 
            // ya que es para el flujo de redirección de MP estándar.
          };
          
          console.log("APP-CONTENT: Enviando datos a /api/mercadopago (para redirección):", JSON.stringify(mercadoPagoData, null, 2));
          
          const mpResponse = await fetch("/api/mercadopago", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(mercadoPagoData)
          });
          
          console.log("APP-CONTENT: Respuesta de /api/mercadopago:", mpResponse.status);
          
          if (!mpResponse.ok) {
            const errorText = await mpResponse.text();
            console.error("APP-CONTENT: Error con Mercado Pago (redirección):", mpResponse.status, errorText);
            throw new Error(`Error ${mpResponse.status}: ${errorText}`);
          }
          
          const mpResult = await mpResponse.json();
          console.log("APP-CONTENT: Datos de preferencia de Mercado Pago (redirección):", mpResult);
          
          if (mpResult && mpResult.initPoint) {
            console.log("APP-CONTENT: Redirigiendo a Mercado Pago (redirección):", mpResult.initPoint);
            localStorage.setItem("mp_preference", JSON.stringify({
              id: mpResult.preferenceId,
              url: mpResult.initPoint,
              timestamp: Date.now()
            }));
            window.location.href = mpResult.initPoint;
            return; 
          } else {
            console.error("APP-CONTENT: No se recibió initPoint de Mercado Pago (redirección):", mpResult);
            throw new Error("Respuesta incompleta de Mercado Pago (redirección)");
          }
        } catch (mpError) {
          console.error("APP-CONTENT: Error en integración con Mercado Pago (redirección):", mpError);
          alert("Hubo un problema con la conexión a Mercado Pago. Por favor, intenta nuevamente o elige otro método de pago.");
          setIsProcessing(false);
          return;
        }
      }
      
      // Para otros métodos de pago que no sean 'creditCard' ni 'mercadopago' (ej. efectivo, transferencia)
      // o si la lógica de MP no hizo return.
      // Enviar email con link de seguimiento
      if (result.order && result.order.id) {
        try {
          const emailResponse = await fetch('/api/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              orderId: result.order.id
            }),
          });
          
          if (!emailResponse.ok) {
            console.warn("No se pudo enviar el email de confirmación:", await emailResponse.json());
          } else {
            console.log("Email de confirmación enviado correctamente");
          }
        } catch (emailError) {
          console.error("Error al enviar email de confirmación:", emailError);
        }
      }
      
      // Si todo va bien para métodos que no son tarjeta ni redirección MP, mostrar confirmación
      setOrderPlaced(true);
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error al procesar el pedido:", error);
      // Aquí se podría mostrar un mensaje de error al usuario
    } finally {
      setIsProcessing(false);
    }
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
          <p className="text-sm text-gray-500 mb-4">Referencia: #{orderReference || Math.random().toString(36).substring(2, 10).toUpperCase()}</p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6 text-left">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Seguimiento por Email</h3>
                <p className="text-sm text-gray-600">Te hemos enviado un correo electrónico con un enlace para seguir el estado de tu pedido. Mantente al tanto de las actualizaciones.</p>
              </div>
            </div>
          </div>
          
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

  // Check if we're using credit card payment and should show the CheckoutForm
  if (paymentMethod === 'tarjeta') {
    return (
      <CheckoutForm 
        setView={setView}
        cartItems={validCartItems}
        totalPrice={totalPrice}
        formData={formData}
      />
    );
  }
  
  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">Finalizar Compra</h1>
      
      {/* Modal informativo para pago con tarjeta */}
      <InfoModal 
        isOpen={showCardInfoModal}
        onClose={closeCardInfoModal}
        title="Información de Pago"
        message="Para realizar un pago con tarjeta de crédito o débito, por favor selecciona la opción de 'Mercado Pago'. Serás redirigido a la plataforma segura de Mercado Pago para completar tu compra."
        actionText="Entendido"
      />
      
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
            
            {/* Datos fiscales */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Datos para Facturación</h3>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="mostrarDatosFiscales" 
                    checked={mostrarDatosFiscales} 
                    onChange={() => setMostrarDatosFiscales(!mostrarDatosFiscales)} 
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
                  />
                  <label htmlFor="mostrarDatosFiscales" className="ml-2 block text-sm text-gray-600">
                    Necesito factura
                  </label>
                </div>
              </div>
              
              {mostrarDatosFiscales && (
                <div className="space-y-4 animate-fadeIn pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipoDocumento">Tipo de documento</Label>
                      <Select 
                        id="tipoDocumento" 
                        name="tipoDocumento" 
                        value={formData.tipoDocumento}
                        onChange={handleInputChange}
                        className="mt-1"
                      >
                        <option value="DNI">DNI</option>
                        <option value="CUIT">CUIT</option>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="documento">Número de {formData.tipoDocumento}</Label>
                      <Input 
                        id="documento" 
                        name="documento" 
                        value={formData.documento} 
                        onChange={handleInputChange} 
                        required={mostrarDatosFiscales}
                        placeholder={formData.tipoDocumento === "DNI" ? "12345678" : "30-12345678-9"} 
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  {formData.tipoDocumento === "CUIT" && (
                    <div>
                      <Label htmlFor="razonSocial">Razón Social</Label>
                      <Input 
                        id="razonSocial" 
                        name="razonSocial" 
                        value={formData.razonSocial} 
                        onChange={handleInputChange} 
                        required={mostrarDatosFiscales && formData.tipoDocumento === "CUIT"}
                        placeholder="Nombre de la empresa" 
                        className="mt-1"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="tipoFactura">Tipo de Factura</Label>
                    <Select 
                      id="tipoFactura" 
                      name="tipoFactura" 
                      value={formData.tipoFactura}
                      onChange={handleInputChange}
                      className="mt-1"
                    >
                      <option value="B">Factura B (Consumidor Final)</option>
                      {formData.tipoDocumento === "CUIT" && (
                        <option value="A">Factura A (Responsable Inscripto)</option>
                      )}
                      <option value="C">Factura C</option>
                    </Select>
                  </div>
                  
                  <div className="pt-2 border-t text-xs text-gray-500">
                    <p className="mb-1"><strong>Nota:</strong> Para facturas tipo A, es necesario proporcionar un CUIT válido de responsable inscripto.</p>
                    <p>Todos los precios incluyen IVA.</p>
                  </div>
                </div>
              )}
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
                      onChange={() => {
                        console.log("CHECKOUT APP-CONTENT: Seleccionando método de pago creditCard");
                        setPaymentMethod('creditCard');
                        // Mostrar el modal informativo cuando se selecciona este método
                        openCardInfoModal();
                      }} 
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
  const { products, addProduct, updateProduct, deleteProduct, loadProducts, loading: productsLoading } = useProducts(); // Renombrar loading
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrls: "[]",
    category: "accesorio",
    specs: "{}",
    rating: "0",
    reviewCount: "0"
  });
  const [specError, setSpecError] = useState('');
  const [imageUrlsError, setImageUrlsError] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Cargar pedidos desde Notion
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      // Hacer una llamada a la API para obtener los pedidos
      const response = await fetch('/api/orders');
      
      if (!response.ok) {
        throw new Error(`Error al cargar pedidos: ${response.status}`);
      }
      
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      // Mostrar pedidos de ejemplo si hay un error
      setOrders([
        {
          id: "ORD123456",
          fecha: "2023-05-12T15:30:00Z",
          cliente: "Juan Pérez",
          email: "juan@example.com",
          total: 45000,
          estado: "Pendiente de Pago",
          metodoPago: "Transferencia"
        },
        {
          id: "ORD789012",
          fecha: "2023-05-11T10:15:00Z",
          cliente: "María López",
          email: "maria@example.com",
          total: 28500,
          estado: "Pagado",
          metodoPago: "Mercado Pago"
        }
      ]);
    } finally {
      setLoadingOrders(false);
    }
  };
  
  // Cargar productos al montar el componente
  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts();
    } else if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab, loadProducts]); // Añadir loadProducts a dependencias
  
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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <Button onClick={handleLogout} variant="outline" size="sm">Cerrar Sesión</Button>
        </div>
      
      <div className="mb-6 border-b">
        <div className="flex space-x-4">
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'products' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('products')}
          >
            Productos
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'orders' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('orders')}
          >
            Pedidos
          </button>
        </div>
      </div>
      
      {activeTab === 'products' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestión de Productos</h2>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => { setShowForm(true); setEditingProduct(null); }}
                size="sm"
                className="flex items-center gap-1"
              >
                <PlusIcon />
                Nuevo Producto
          </Button>
              <Button 
                onClick={() => loadProducts()}
                variant="outline"
                size="sm"
                disabled={productsLoading}
              >
                {productsLoading ? 'Cargando...' : 'Recargar'}
              </Button>
            </div>
          </div>
          
        {showForm && (
            <div className="mb-6 bg-white p-6 border rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields... */}
                {/* ... existing code ... */}
              </form>
                </div>
          )}
          
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productsLoading ? ( // Usar productsLoading
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        <GenericLoadingSpinner text="Cargando productos..." />
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No hay productos para mostrar.</td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                              <img 
                                src={product.imageUrls?.[0] || "https://placehold.co/100?text=No+Image"} 
                                alt={product.name}
                                className="h-full w-full object-contain"
                                onError={handleAdminImageError}
                              />
                   </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.id}</div>
                </div>
                  </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${product.price.toLocaleString('es-AR')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {product.active !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                          >
                            <PencilIcon />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900 ml-3"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {activeTab === 'orders' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestión de Pedidos</h2>
            <div className="flex items-center gap-2">
              <Button 
                onClick={loadOrders}
                variant="outline"
                size="sm"
                disabled={loadingOrders}
              >
                {loadingOrders ? 'Cargando...' : 'Recargar'}
              </Button>
            </div>
          </div>
          
          <div className="border border-dashed border-yellow-300 bg-yellow-50 p-4 rounded-lg mb-6">
            <p className="text-yellow-700 text-sm">
              <strong>Nota:</strong> Esta funcionalidad requiere configurar la variable de entorno <code>NOTION_DATABASE_ID_ORDERS</code> en tu archivo <code>.env.local</code> y 
              crear una base de datos en Notion para los pedidos. Consulta la documentación para más detalles.
            </p>
          </div>
          
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pedido</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método de Pago</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        <GenericLoadingSpinner text="Cargando pedidos..." />
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No hay pedidos para mostrar.</td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.id}</div>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(order.fecha).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.cliente}</div>
                          <div className="text-xs text-gray-500">{order.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">${order.total.toLocaleString('es-AR')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.estado === 'Pagado' ? 'bg-green-100 text-green-800' :
                            order.estado === 'Pendiente de Pago' ? 'bg-yellow-100 text-yellow-800' :
                            order.estado === 'Enviado' ? 'bg-blue-100 text-blue-800' :
                            order.estado === 'Entregado' ? 'bg-purple-100 text-purple-800' :
                            order.estado === 'Cancelado' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.metodoPago}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Ver detalles"
                            onClick={() => alert(`Ver detalles del pedido ${order.id}`)}
                          >
                            Ver
                          </button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ... existing code ...


// ===============================================
//      COMPONENTES FLOTANTES
// ===============================================
function FloatingWhatsAppButton() { 
  const whatsappNumber = "5491144820369"; 
  
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
      className={`fixed bottom-6 left-6 z-40 group flex items-center transition-all duration-500 ease-in-out rounded-xl shadow-xl animate-subtle-glow ${
        isHovered ? 'translate-y-[-4px]' : ''
      }`}
      aria-label={`Carrito con ${totalItems} items`}
    >
      {/* Dot indicator */}
      <div className="absolute -right-2 -top-2 w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
        {totalItems}
      </div>
      
      {/* Main container */}
      <div className="bg-gradient-to-r from-gray-900 to-black text-white rounded-xl overflow-hidden flex items-center border border-gray-800"> 
        {/* Icon container - Ajustado a 14 de ancho para mejor balance */}
        <div className="bg-red-600 h-12 w-14 flex items-center justify-center">
          <CartIcon className="w-5 h-5" />
        </div>
        
        {/* Price info - Mantenido como está */}
        <div className="px-4 py-2.5">
          <div className="text-xs opacity-80 font-medium">Total de compra</div>
          <div className="text-base font-bold">
            ${totalPrice.toLocaleString("es-AR")}
          </div>
        </div>
      </div>
      
      {/* Decorative shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out pointer-events-none rounded-xl"></div>
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
      case "nosotros": CurrentPageComponent = NosotrosPage; break;
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

// Move the API handlers to a separate export object
const apiHandlers = {
  async POST(req: Request) {
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
  },

  async PUT(
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
  },

  async DELETE(
    _req: Request,
    { params }: { params: { id: string } },
  ) {
    const ok = await deleteProduct(params.id);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
};

// Export the components and API handlers
export { AppContent, apiHandlers };

// Make AppContent the default export
export default App;





