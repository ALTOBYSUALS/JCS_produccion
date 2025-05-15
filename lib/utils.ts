import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from 'crypto';
import { Product } from "@/components/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera un token aleatorio de seguimiento para pedidos
 */
export function generateTrackingToken(): string {
  const timestamp = new Date().getTime().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`.toUpperCase();
}

/**
 * Genera la URL completa de seguimiento con el token
 */
export function generateTrackingUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/rastreo?token=${token}`;
}

/**
 * Función para convertir objetos con propiedades anidadas a URLSearchParams
 */
export function objectToQueryString(obj: Record<string, any>, prefix = ''): string {
  const params = new URLSearchParams();
  
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      const propKey = prefix ? `${prefix}[${key}]` : key;
      
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        // Recursión para objetos anidados
        const nestedParams = objectToQueryString(obj[key], propKey);
        if (nestedParams) {
          params.append(propKey, nestedParams);
        }
      } else if (Array.isArray(obj[key])) {
        // Manejo de arrays
        obj[key].forEach((item: any, index: number) => {
          params.append(`${propKey}[${index}]`, String(item));
        });
      } else {
        // Valores simples
        params.append(propKey, String(obj[key]));
      }
    }
  }
  
  return params.toString();
}

/**
 * Formatea un precio para mostrar en la UI
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

export const productsCache = {
  data: null as Product[] | null,
  timestamp: 0,
  ttl: 15 * 60 * 1000, // 15 minutos
  
  isValid() {
    return this.data && (Date.now() - this.timestamp < this.ttl);
  },
  
  set(data: Product[]) {
    this.data = data;
    this.timestamp = Date.now();
  }
};
