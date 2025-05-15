import { Metadata } from 'next';
import { TestMercadoPago } from '@/components/TestMercadoPago';

export const metadata: Metadata = {
  title: 'Prueba de Mercado Pago | JCS El Guardián',
  description: 'Página de diagnóstico para la integración con Mercado Pago'
};

export default function MercadoPagoTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Mercado Pago</h1>
      
      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Información de configuración</h2>
          <p className="text-gray-600 mb-3">
            Esta página te permite probar si la integración con Mercado Pago está configurada correctamente.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-md text-sm">
            <p className="font-medium">Requisitos para el funcionamiento:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-gray-700">
              <li>Variable de entorno <code className="bg-gray-200 px-1 rounded">MERCADO_PAGO_ACCESS_TOKEN</code> configurada</li>
              <li>Variable de entorno <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_SITE_URL</code> configurada</li>
              <li>SDK de Mercado Pago cargado correctamente en <code className="bg-gray-200 px-1 rounded">layout.tsx</code></li>
              <li>Credenciales válidas de Mercado Pago</li>
            </ul>
          </div>
        </div>
        
        <TestMercadoPago />
      </div>
    </div>
  );
} 