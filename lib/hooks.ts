import { useState, useEffect } from 'react';
import { Product } from '@/components/types';

/**
 * Hook para cargar productos desde la API
 */
export function useProducts(includeInactive = false) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?includeInactive=${includeInactive}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching products: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data.products);
      setError(null);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err : new Error('Unknown error loading products'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [includeInactive]);

  return { products, loading, error, loadProducts };
} 