"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Product } from "@/components/types";

interface ProductContextType {
  products: Product[]
  loading: boolean;
  error: Error | null;
  addProduct: (product: Partial<Omit<Product, 'id'>>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string | number) => Promise<void>;
  reloadProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products?includeInactive=false");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const { products } = await res.json();
      setProducts(Array.isArray(products) ? products : []);
    } catch (error) {
      console.error("Failed to load products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addProduct = async (productData: Partial<Omit<Product, 'id'>>) => {
    setLoading(true);
    setError(null);
      try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        let errorDetails = 'Failed to create product';
         try {
            const errorData = await res.json();
            errorDetails = errorData.error || errorData.details || errorDetails;
          } catch (e) { /* Ignora */ }
        throw new Error(errorDetails);
       }
      await loadProducts();
    } catch (err) {
      console.error("Error adding product:", err);
      setError(err instanceof Error ? err : new Error('Failed to add product'));
    } finally {
       setLoading(false);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    setLoading(true);
    setError(null);
    try {
      const productId = updatedProduct.id;
      if (!productId) {
          throw new Error("Product ID is required for update");
      }
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });
       if (!res.ok) {
         let errorDetails = 'Failed to update product';
         try {
            const errorData = await res.json();
            errorDetails = errorData.error || errorData.details || errorDetails;
          } catch (e) { /* Ignora */ }
         throw new Error(errorDetails);
       }
      await loadProducts();
     } catch (err) {
      console.error("Error updating product:", err);
      setError(err instanceof Error ? err : new Error('Failed to update product'));
    } finally {
       setLoading(false);
    }
  };

  const deleteProduct = async (id: string | number) => {
    if (!id) {
        console.error("Product ID is required for delete");
        setError(new Error("Product ID is required for delete"));
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        let errorDetails = 'Failed to delete product';
         try {
            const errorData = await res.json();
            errorDetails = errorData.error || errorData.details || errorDetails;
          } catch (e) { /* Ignora */ }
        throw new Error(errorDetails);
       }
      await loadProducts();
     } catch (err) {
      console.error("Error deleting product:", err);
      setError(err instanceof Error ? err : new Error('Failed to delete product'));
    } finally {
       setLoading(false);
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        reloadProducts: loadProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductContext)
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider")
  }
  return context
}
