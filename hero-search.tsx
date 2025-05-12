"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Phone } from "lucide-react"

export default function HeroSearch() {
  const [searchType, setSearchType] = useState("neumaticos") // "neumaticos" or "llantas"
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [rimSize, setRimSize] = useState("")
  const [wheelDiameter, setWheelDiameter] = useState("")
  const [wheelWidth, setWheelWidth] = useState("")
  const [wheelOffset, setWheelOffset] = useState("")
  const [wheelBoltPattern, setWheelBoltPattern] = useState("")

  // Sample data for dropdowns
  const widthOptions = [
    "155",
    "165",
    "175",
    "185",
    "195",
    "205",
    "215",
    "225",
    "235",
    "245",
    "255",
    "265",
    "275",
    "285",
    "295",
    "305",
    "315",
    "325",
  ]
  const heightOptions = ["30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85"]
  const rimSizeOptions = ["R13", "R14", "R15", "R16", "R17", "R18", "R19", "R20", "R21", "R22"]

  // Wheel specific options
  const wheelDiameterOptions = ["13", "14", "15", "16", "17", "18", "19", "20", "21", "22"]
  const wheelWidthOptions = [
    "5.5",
    "6.0",
    "6.5",
    "7.0",
    "7.5",
    "8.0",
    "8.5",
    "9.0",
    "9.5",
    "10.0",
    "10.5",
    "11.0",
    "12.0",
  ]
  const wheelOffsetOptions = [
    "0",
    "+15",
    "+20",
    "+25",
    "+30",
    "+35",
    "+40",
    "+45",
    "+50",
    "-10",
    "-15",
    "-20",
    "-25",
    "-30",
  ]
  const wheelBoltPatternOptions = [
    "4x100",
    "4x108",
    "4x114.3",
    "5x100",
    "5x108",
    "5x112",
    "5x114.3",
    "5x120",
    "6x139.7",
  ]

  const handleSearch = () => {
    if (searchType === "neumaticos") {
      console.log("Searching for tires:", { width, height, rimSize })
      alert(`Buscando neumáticos: ${width}/${height}/${rimSize}`)
    } else {
      console.log("Searching for wheels:", { wheelDiameter, wheelWidth, wheelOffset, wheelBoltPattern })
      alert(`Buscando llantas: ${wheelDiameter}" x ${wheelWidth}J ET${wheelOffset} ${wheelBoltPattern}`)
    }
  }

  const handleTabChange = (type) => {
    setSearchType(type)
  }

  return (
    <div className="relative z-10 mt-6 md:mt-12 max-w-3xl mx-auto px-4 md:px-0">
      <div className="bg-white/10 backdrop-filter backdrop-blur-lg border border-white/20 rounded-xl p-4 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(255,255,255,0.1)]">
        {/* Tabs con efecto de glassmorfismo */}
        <div className="flex flex-wrap mb-6 border-b border-white/20">
          <button
            className={`py-2 md:py-3 px-3 md:px-5 font-medium text-sm transition-all duration-300 relative ${
              searchType === "neumaticos"
                ? "text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-red-600 after:rounded-full after:transition-all after:duration-300"
                : "text-gray-400 hover:text-white hover:after:w-1/2 after:absolute after:bottom-0 after:left-1/4 after:w-0 after:h-0.5 after:bg-white/40 after:rounded-full after:transition-all after:duration-300"
            }`}
            onClick={() => handleTabChange("neumaticos")}
          >
            <span className="relative z-10 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              NEUMÁTICOS
            </span>
          </button>
          <button
            className={`py-2 md:py-3 px-3 md:px-5 font-medium text-sm transition-all duration-300 relative ${
              searchType === "llantas"
                ? "text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-red-600 after:rounded-full after:transition-all after:duration-300"
                : "text-gray-400 hover:text-white hover:after:w-1/2 after:absolute after:bottom-0 after:left-1/4 after:w-0 after:h-0.5 after:bg-white/40 after:rounded-full after:transition-all after:duration-300"
            }`}
            onClick={() => handleTabChange("llantas")}
          >
            <span className="relative z-10 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="2" />
                <path d="M12 4v2M12 18v2M4 12H6M18 12h2" />
              </svg>
              LLANTAS
            </span>
          </button>
          <div className="ml-auto flex items-center text-white text-sm mt-2 md:mt-0">
            <Phone size={16} className="mr-2 text-red-500" />
            <a href="tel:+123456789" className="hover:underline transition-all duration-300 hover:text-red-400">
              Llamar ahora
            </a>
          </div>
        </div>

        <div className="bg-black/20 backdrop-filter backdrop-blur-sm p-3 md:p-5 rounded-lg mb-4 md:mb-6 border border-white/10">
          <h3 className="text-white font-medium mb-3 md:mb-4 flex items-center text-sm md:text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 md:h-5 md:w-5 mr-2 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar por Medida
          </h3>

          {searchType === "neumaticos" ? (
            /* Tire search fields */
            <div className="grid grid-cols-1 gap-3 mb-4">
              <div className="relative group">
                <select
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full bg-black/30 text-white border border-white/20 rounded-lg py-2.5 md:py-3 pl-3 md:pl-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-filter backdrop-blur-sm transition-all duration-300 hover:bg-black/40 group-hover:border-red-400 text-sm md:text-base"
                >
                  <option value="">Ancho</option>
                  {widthOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-red-500 group-hover:transform group-hover:translate-x-[-2px] transition-transform duration-300">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>

              <div className="relative group">
                <select
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-black/30 text-white border border-white/20 rounded-lg py-2.5 md:py-3 pl-3 md:pl-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-filter backdrop-blur-sm transition-all duration-300 hover:bg-black/40 group-hover:border-red-400 text-sm md:text-base"
                >
                  <option value="">Perfil</option>
                  {heightOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-red-500 group-hover:transform group-hover:translate-x-[-2px] transition-transform duration-300">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>

              <div className="relative group">
                <select
                  value={rimSize}
                  onChange={(e) => setRimSize(e.target.value)}
                  className="w-full bg-black/30 text-white border border-white/20 rounded-lg py-2.5 md:py-3 pl-3 md:pl-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-filter backdrop-blur-sm transition-all duration-300 hover:bg-black/40 group-hover:border-red-400 text-sm md:text-base"
                >
                  <option value="">Diámetro</option>
                  {rimSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-red-500 group-hover:transform group-hover:translate-x-[-2px] transition-transform duration-300">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          ) : (
            /* Wheel search fields */
            <div className="grid grid-cols-1 gap-3 mb-4">
              <div className="relative group">
                <select
                  value={wheelDiameter}
                  onChange={(e) => setWheelDiameter(e.target.value)}
                  className="w-full bg-black/30 text-white border border-white/20 rounded-lg py-2.5 md:py-3 pl-3 md:pl-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-filter backdrop-blur-sm transition-all duration-300 hover:bg-black/40 group-hover:border-red-400 text-sm md:text-base"
                >
                  <option value="">Diámetro (pulgadas)</option>
                  {wheelDiameterOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}"
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-red-500 group-hover:transform group-hover:translate-x-[-2px] transition-transform duration-300">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>

              <div className="relative group">
                <select
                  value={wheelWidth}
                  onChange={(e) => setWheelWidth(e.target.value)}
                  className="w-full bg-black/30 text-white border border-white/20 rounded-lg py-2.5 md:py-3 pl-3 md:pl-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-filter backdrop-blur-sm transition-all duration-300 hover:bg-black/40 group-hover:border-red-400 text-sm md:text-base"
                >
                  <option value="">Ancho (J)</option>
                  {wheelWidthOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}J
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-red-500 group-hover:transform group-hover:translate-x-[-2px] transition-transform duration-300">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>

              <div className="relative group">
                <select
                  value={wheelOffset}
                  onChange={(e) => setWheelOffset(e.target.value)}
                  className="w-full bg-black/30 text-white border border-white/20 rounded-lg py-2.5 md:py-3 pl-3 md:pl-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-filter backdrop-blur-sm transition-all duration-300 hover:bg-black/40 group-hover:border-red-400 text-sm md:text-base"
                >
                  <option value="">Desplazamiento (ET)</option>
                  {wheelOffsetOptions.map((option) => (
                    <option key={option} value={option}>
                      ET{option}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-red-500 group-hover:transform group-hover:translate-x-[-2px] transition-transform duration-300">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>

              <div className="relative group">
                <select
                  value={wheelBoltPattern}
                  onChange={(e) => setWheelBoltPattern(e.target.value)}
                  className="w-full bg-black/30 text-white border border-white/20 rounded-lg py-2.5 md:py-3 pl-3 md:pl-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-filter backdrop-blur-sm transition-all duration-300 hover:bg-black/40 group-hover:border-red-400 text-sm md:text-base"
                >
                  <option value="">Patrón de Tornillos</option>
                  {wheelBoltPatternOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-red-500 group-hover:transform group-hover:translate-x-[-2px] transition-transform duration-300">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSearch}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 md:py-4 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg active:translate-y-0 active:shadow-md flex items-center justify-center text-sm md:text-base"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 md:h-5 md:w-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            VER RESULTADOS
          </Button>
        </div>

        {/* Visual representation for tires */}
        {searchType === "neumaticos" && width && height && rimSize && (
          <div className="mt-6 relative animate-fadeIn">
            <div className="flex justify-center">
              <div className="relative transform transition-all duration-500 hover:scale-105 bg-black/30 p-4 rounded-lg backdrop-filter backdrop-blur-sm border border-white/10">
                <img
                  src="https://placehold.co/300x150/333333/ffffff?text=Neumático"
                  alt="Neumático"
                  className="rounded-lg"
                />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="bg-white/90 text-black text-xl font-bold px-2 py-1 rounded shadow-lg">{width}</span>
                  <span className="bg-red-600 text-white text-xl font-bold px-2 py-1 rounded shadow-lg">{height}</span>
                  <span className="bg-white/90 text-black text-xl font-bold px-2 py-1 rounded shadow-lg">
                    {rimSize}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute top-0 left-1/4 w-px h-16 bg-white/50"></div>
            <div className="absolute top-0 left-1/2 w-px h-16 bg-white/50"></div>
            <div className="absolute top-0 left-3/4 w-px h-16 bg-white/50"></div>
          </div>
        )}

        {/* Visual representation for wheels */}
        {searchType === "llantas" && wheelDiameter && wheelWidth && (
          <div className="mt-6 relative animate-fadeIn">
            <div className="flex justify-center">
              <div className="relative transform transition-all duration-500 hover:scale-105 bg-black/30 p-4 rounded-lg backdrop-filter backdrop-blur-sm border border-white/10">
                <img src="https://placehold.co/300x150/333333/ffffff?text=Llanta" alt="Llanta" className="rounded-lg" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/90 text-black text-xl font-bold px-2 py-1 rounded shadow-lg">
                      {wheelDiameter}"
                    </span>
                    <span className="bg-red-600 text-white text-xl font-bold px-2 py-1 rounded shadow-lg">
                      {wheelWidth}J
                    </span>
                  </div>
                  {wheelOffset && wheelBoltPattern && (
                    <div className="flex items-center gap-2">
                      <span className="bg-white/90 text-black text-sm font-bold px-2 py-1 rounded shadow-lg">
                        ET{wheelOffset}
                      </span>
                      <span className="bg-white/90 text-black text-sm font-bold px-2 py-1 rounded shadow-lg">
                        {wheelBoltPattern}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute top-0 left-1/3 w-px h-16 bg-white/50"></div>
            <div className="absolute top-0 left-2/3 w-px h-16 bg-white/50"></div>
          </div>
        )}
      </div>
    </div>
  )
}
