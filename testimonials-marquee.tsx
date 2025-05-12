"use client"

import { useRef, useEffect } from "react"
import { Star, Quote } from "lucide-react" // Asumiendo que usas lucide-react

// --- Interfaz y Componente Testimonial (sin cambios) ---
interface TestimonialProps {
  name: string
  role: string
  content: string
  rating: number
}

const Testimonial = ({ name, role, content, rating }: TestimonialProps) => (
  <div className="flex-shrink-0 w-72 sm:w-80 bg-white rounded-lg shadow-md p-6 mx-3 sm:mx-4 border border-gray-200 relative transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
    <div className="absolute -top-3 -right-3 bg-red-600 text-white p-2 rounded-full shadow">
      <Quote className="h-4 w-4" />
    </div>
    <p className="text-gray-700 mb-4 italic text-sm sm:text-base">{content}</p>
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{name}</h4>
        <p className="text-xs sm:text-sm text-gray-500">{role}</p>
      </div>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 sm:h-4 sm:w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    </div>
  </div>
)

// --- Componente Principal TestimonialsMarquee (Modificado) ---
export default function TestimonialsMarquee() {
  const testimonials = [
    {
      name: "Carlos Rodríguez",
      role: "Cliente desde 2018",
      content: "Excelente servicio. Cambiaron mis neumáticos en tiempo récord y a un precio justo.",
      rating: 5,
    },
    {
      name: "Laura Méndez",
      role: "Cliente desde 2020",
      content: "Las llantas deportivas que compré le dieron un look increíble a mi auto. Muy recomendable.",
      rating: 5,
    },
    {
      name: "Martín Gómez",
      role: "Cliente desde 2019",
      content: "Profesionales en todo sentido. El servicio de alineación es de primera calidad.",
      rating: 4,
    },
    {
      name: "Sofía Peralta",
      role: "Cliente desde 2021",
      content: "Precios competitivos y excelente atención. Siempre vuelvo para el mantenimiento de mi vehículo.",
      rating: 5,
    },
    {
      name: "Diego Fernández",
      role: "Cliente desde 2017",
      content: "Confianza y calidad. Nunca tuve un problema con los productos que compré aquí.",
      rating: 5,
    },
    {
      name: "Valentina Torres",
      role: "Cliente desde 2022",
      content: "El servicio de frenos fue impecable. Me explicaron todo el proceso y quedé muy conforme.",
      rating: 4,
    },
  ]

  const marqueeRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const marquee = marqueeRef.current
    const content = contentRef.current
    if (!marquee || !content) return

    // Clonar contenido para el bucle infinito
    const clone = content.cloneNode(true)
    marquee.appendChild(clone)

    // Función para ajustar la duración de la animación según el ancho
    const setAnimationDuration = () => {
      if (!content || !marquee) return
      const contentWidth = content.offsetWidth
      // Ajusta el divisor para controlar la velocidad (número más grande = más lento)
      const duration = contentWidth / 35 // Por ejemplo, 35 píxeles por segundo
      // Aplica la duración calculada y las propiedades base de la animación
      marquee.style.setProperty("--marquee-duration", `${duration}s`)
      marquee.classList.add("animate-marquee") // Añade la clase para activar la animación CSS
    }

    // Establece la duración inicial y escucha cambios de tamaño
    setAnimationDuration()
    window.addEventListener("resize", setAnimationDuration)

    // Pausar animación al pasar el mouse
    const pauseAnimation = () => (marquee.style.animationPlayState = "paused")
    const resumeAnimation = () => (marquee.style.animationPlayState = "running")

    marquee.addEventListener("mouseenter", pauseAnimation)
    marquee.addEventListener("mouseleave", resumeAnimation)

    // Limpieza al desmontar
    return () => {
      window.removeEventListener("resize", setAnimationDuration)
      marquee.removeEventListener("mouseenter", pauseAnimation)
      marquee.removeEventListener("mouseleave", resumeAnimation)
      // Opcional: remover el clon si el componente se desmonta y remonta frecuentemente
      // if (marquee.contains(clone)) {
      //   marquee.removeChild(clone);
      // }
    }
  }, []) // Ejecutar solo una vez al montar

  return (
    <div className="py-16 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-6 mb-10">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-2">Lo que dicen nuestros clientes</h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto">
          La confianza de nuestros clientes es nuestro mayor orgullo. Conocé sus experiencias con JCS El Guardián.
        </p>
      </div>

      {/* Contenedor relativo para los degradados */}
      <div className="relative w-full">
        {/* Degradado izquierdo */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent"></div>

        {/* Contenedor de la marquesina (SIN overflow-x-auto) */}
        <div
          ref={marqueeRef}
          className="flex py-4 whitespace-nowrap" // Eliminamos animate-marquee aquí, se añadirá con JS
          // La animación se define en CSS global y se activa con la clase
        >
          {/* Contenido original */}
          <div ref={contentRef} className="flex">
            {testimonials.map((testimonial, index) => (
              // Añadimos keys únicas para original y clon
              <Testimonial key={`orig-${index}`} {...testimonial} />
            ))}
          </div>
          {/* El clon se añade dinámicamente con JavaScript */}
        </div>

        {/* Degradado derecho */}
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent"></div>
      </div>
    </div>
  )
}
