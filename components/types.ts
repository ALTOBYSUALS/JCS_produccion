// Interfaces principales para la aplicación

export interface ProductSpec {
  ancho?: string | number;
  perfil?: string | number;
  rodado?: string | number;
  [key: string]: string | number | undefined;
}

export interface Product {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  imageUrls: string[];
  category: string;
  specs: ProductSpec;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  active?: boolean;
  idOrigen?: string;
}

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  quantity: number;
}

// Interfaz para la gestión de pedidos en Notion
export interface OrderDetails {
  pedidoId: string;
  fechaPedido: string; // ISO String e.g. new Date().toISOString()
  cliente: string;
  emailCliente: string;
  telefonoCliente: string;
  direccionEnvio: string;
  ciudadEnvio: string;
  cpEnvio: string;
  notasAdicionales?: string;
  subtotal: number;
  costoEnvio: number;
  totalPedido: number;
  detalleProductosTexto: string; // Formato "2x Producto A, 1x Producto B"
  estadoPedido: string; // "Pendiente de Pago", "Pagado", etc.
  metodoPago: string; // "Efectivo", "Transferencia", "Mercado Pago", etc.
  productoIds?: string[]; // IDs de Notion de los productos en el pedido
  datosFiscales?: {
    documento: string; // DNI o CUIT
    tipoDocumento: string; // "DNI" o "CUIT"
    razonSocial?: string; // Para facturas a empresas
    tipoFactura: string; // "A", "B", "C"
  };
}

// Tipos para View y Contexto de setView
export type ViewName = 'storefront' | 'neumaticos' | 'llantas' | 'accesorios' | 'servicios' | 'contacto' | 'shopByBrand' | 'productDetail' | 'cart' | 'checkout' | 'adminLogin' | 'adminDashboard' |
                'llantas_deportivas' | 'llantas_chapa' | 'llantas_r14' | 'llantas_r15' | 'llantas_r17' |
                'servicio_alineacion' | 'servicio_reparacion' | 'servicio_aceite' | 'servicio_frenos' | 'servicio_suspension' | 'servicio_mecanica';

export interface SetViewContext {
  product?: Product;
  filters?: Record<string, string | number>;
  brand?: string;
  keepFilters?: boolean;
}

export type SetViewFunction = (view: ViewName, context?: SetViewContext) => void;

// Contextos (Product y Cart)
export interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number | string) => void;
  loadProducts: () => Promise<void>;
  loading: boolean;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
} 