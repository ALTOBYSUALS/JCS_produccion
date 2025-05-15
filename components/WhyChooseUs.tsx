'use client';

import { useState, useEffect } from 'react';

const razones = [
  { 
    titulo: "Calidad Garantizada", 
    descripcion: "Todos nuestros productos cuentan con garantía oficial", 
    icono: "✓" 
  },
  { 
    titulo: "Experiencia", 
    descripcion: "Más de 25 años en el mercado de neumáticos", 
    icono: "★" 
  },
  { 
    titulo: "Servicio Premium", 
    descripcion: "Atención personalizada y asesoramiento técnico", 
    icono: "♦" 
  },
  { 
    titulo: "Envío Rápido", 
    descripcion: "Llegamos a todo el país en tiempo récord", 
    icono: "⚡" 
  }
];

export default function WhyChooseUs() {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Efecto de animación al cargar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(100);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Efecto de animación para los círculos decorativos
  const calculatePosition = (index: number, total: number, radius = 130) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  return (
    <section className="py-16 md:py-20 relative overflow-hidden bg-white dark:bg-gray-900">
      {/* Círculos decorativos */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.13]">
        {[...Array(13)].map((_, i) => {
          const { x, y } = calculatePosition(i, 13);
          return (
            <div
              key={i}
              className="absolute rounded-full border border-red-500 dark:border-red-400"
              style={{
                width: `${(13 - i) * 20}px`,
                height: `${(13 - i) * 20}px`,
                transform: `translate(${x}px, ${y}px)`,
                opacity: 0.5 + (i / 13) * 0.5,
                transition: 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transitionDelay: `${i * 100}ms`,
                scale: animationProgress === 100 ? 1 : 0,
              }}
            />
          );
        })}
      </div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative inline-block">
            ¿Por qué elegirnos?
            <span 
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-400 to-red-600 transition-all duration-700"
              style={{ width: `${animationProgress}%` }}
            ></span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {razones.map((razon, index) => (
            <div 
              key={index}
              className="relative group transition-all duration-300 p-6 rounded-lg bg-gray-50 dark:bg-gray-800 border border-transparent hover:border-red-100 dark:hover:border-red-900"
              style={{
                transform: animationProgress === 100 ? 'translateY(0)' : 'translateY(30px)',
                opacity: animationProgress === 100 ? 1 : 0,
                transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
                transitionDelay: `${index * 150}ms`,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Icono animado */}
              <div className="flex justify-center mb-5">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white bg-gradient-to-br from-red-500 to-red-600 relative overflow-hidden"
                  style={{
                    transform: hoveredIndex === index ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.3s ease-out',
                  }}
                >
                  {razon.icono}
                  
                  {/* Efecto de onda al hacer hover */}
                  {hoveredIndex === index && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div 
                        className="absolute inset-0 rounded-full bg-white opacity-20"
                        style={{
                          transform: 'scale(0)',
                          animation: 'ripple 1s ease-out',
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-center mb-3 text-gray-800 dark:text-gray-200">
                {razon.titulo}
              </h3>
              
              <p className="text-center text-gray-600 dark:text-gray-400">
                {razon.descripcion}
              </p>
              
              {/* Línea decorativa */}
              <div 
                className="absolute bottom-0 left-1/2 w-0 h-1 bg-red-500/30 -translate-x-1/2 transition-all duration-500 ease-out"
                style={{ width: hoveredIndex === index ? '70%' : '0%' }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Estilos para las animaciones */}
      <style jsx>{`
        @keyframes ripple {
          to {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
} 