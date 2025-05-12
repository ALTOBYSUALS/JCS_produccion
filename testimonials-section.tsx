"use client"

import { useState } from "react"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"

interface Testimonial {
  name: string
  role: string
  company: string
  image: string
  rating: number
  quote: string
}

export default function TestimonialsSection() {
  const testimonials: Testimonial[] = [
    {
      name: "Carlos R.",
      role: "Dueño de Taller",
      company: "Cliente desde 2018, San Justo",
      image: "https://placehold.co/100x100/333/fff?text=CR",
      rating: 5,
      quote:
        "JCS El Guardián es la mejor solución para cualquiera que busque calidad en neumáticos y llantas. Su servicio es detallado, sus productos son de primera y la atención al cliente es increíblemente amigable.",
    },
    {
      name: "Laura M.",
      role: "Empresaria",
      company: "Cliente desde 2020, Ramos Mejía",
      image: "https://placehold.co/100x100/333/fff?text=LM",
      rating: 5,
      quote:
        "JCS El Guardián me ha ayudado a mantener mi flota de vehículos en perfectas condiciones. Los reportes detallados y el servicio preciso hacen que el mantenimiento sea mucho más fácil. ¡Altamente recomendado para empresarios!",
    },
    {
      name: "Martín G.",
      role: "Profesional",
      company: "Cliente desde 2019, Morón",
      image: "https://placehold.co/100x100/333/fff?text=MG",
      rating: 5,
      quote:
        "La seguridad y facilidad de acceso son mis principales prioridades. JCS El Guardián cumple con ambas. Ahora puedo mantener mis vehículos en perfectas condiciones con total tranquilidad.",
    },
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1))
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4 lg:px-6 relative max-w-6xl">
        {/* Decorative stars */}
        <div className="absolute top-0 left-10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 0L13.4641 10.5359L24 12L13.4641 13.4641L12 24L10.5359 13.4641L0 12L10.5359 10.5359L12 0Z"
              fill="black"
            />
          </svg>
        </div>
        <div className="absolute bottom-10 right-10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 0L13.4641 10.5359L24 12L13.4641 13.4641L12 24L10.5359 13.4641L0 12L10.5359 10.5359L12 0Z"
              fill="black"
            />
          </svg>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          Confiado por más de 1000+ clientes satisfechos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`bg-white p-8 rounded-3xl transition-all duration-500 ${
                index === currentIndex ? "scale-105 shadow-xl" : "scale-95 opacity-70"
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    — {testimonial.name}, {testimonial.role}
                  </h3>
                  <p className="text-gray-600 text-sm">{testimonial.company}</p>
                </div>
              </div>

              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < testimonial.rating ? "text-orange-500 fill-orange-500" : "text-gray-300"}`}
                  />
                ))}
                <span className="ml-2 font-bold">{testimonial.rating}.0</span>
              </div>

              <p className="text-gray-800 font-medium">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center mt-8 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full ${
                index === currentIndex ? "bg-orange-500 w-8" : "bg-gray-300"
              } transition-all duration-300`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-center mt-6 space-x-4">
          <button
            onClick={goToPrevious}
            className="p-4 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="p-4 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
