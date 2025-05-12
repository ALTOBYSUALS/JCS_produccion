"use client";

import React from 'react';

interface DigitalTickerProps {
  messages?: string[];
  speed?: number; // Duration of one full scroll cycle in seconds
}

const DigitalTicker: React.FC<DigitalTickerProps> = ({
  messages = [
    "OFERTA ESPECIAL: 4x3 en Neumáticos Pirelli - Solo por hoy!",
    "Nuevas Llantas Deportivas R17 Disponibles - ¡Consultá Stock!",
    "Servicio de Alineación y Balanceo con 20% OFF - ¡Pedí tu turno!",
    "Financiación Exclusiva: Ahora 12 y Ahora 18 en Servicios",
    "JCS El Guardián: Calidad y Confianza desde 1995",
  ],
  speed = 30, // Default speed: 30 seconds per cycle
}) => {
  if (!messages || messages.length === 0) {
    return null;
  }

  // Duplicate messages to create a seamless loop effect
  const tickerContent = [...messages, ...messages].join(' \u00A0 | \u00A0 '); // Use non-breaking space and separator

  return (
    <div 
      className="bg-gradient-to-r from-gray-900 via-black to-gray-800 text-red-500 overflow-hidden whitespace-nowrap relative h-8 flex items-center border-b border-red-900/50 shadow-inner font-mono"
      style={{ fontFamily: 'var(--font-space-mono)' }} // Apply Space Mono font variable
    >
      <style jsx>{`
        .ticker-wrap {
          display: inline-block;
          padding-left: 100%; /* Start off screen */
          animation: ticker ${speed * 2}s linear infinite;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } /* Move half the total width (original + duplicate) */
        }
        .ticker-wrap:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="ticker-wrap text-xs uppercase tracking-wider">
        {tickerContent}
      </div>
    </div>
  );
};

export default DigitalTicker; 