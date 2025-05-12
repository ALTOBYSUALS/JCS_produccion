// --- Product Card Component (CON CARRUSEL EN HOVER DE TARJETA) ---
function ProductCard({ product, onProductSelect }) {
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Estado local

  // Si no hay producto, no renderizar nada para evitar errores
  if (!product) return null;

  const isService = typeof product.price !== "number" || product.price === 0;

  // Asegurarse de que imageUrls sea un array válido y tener un fallback
  const imageUrls = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
    ? product.imageUrls
    : ["https://placehold.co/600x600/cccccc/ffffff?text=N/A"]; // Placeholder

  const totalImages = imageUrls.length;
  const currentImageUrl = imageUrls[currentImageIndex];

  // Funciones para navegar (con stopPropagation)
  const nextImage = (e) => {
    e.stopPropagation(); // IMPORTANTE: Evita que el click active onProductSelect de la tarjeta entera
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % totalImages);
  };

  const prevImage = (e) => {
    e.stopPropagation(); // IMPORTANTE: Evita que el click active onProductSelect
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + totalImages) % totalImages);
  };

  // Función para ir a detalles (se usa en la imagen y título)
  const handleViewDetails = () => {
    if (product) onProductSelect(product);
  };

  // Función para el botón principal (Agregar/Info)
  const handleMainButtonClick = (e) => {
    e.stopPropagation(); // Evita que el click active onProductSelect
    if (!isService && product) {
      addToCart(product);
    } else {
      handleViewDetails(); // Si es servicio o no tiene precio, va a detalles
    }
  };

  const formattedPrice = !isService ? `$${product.price.toLocaleString("es-AR")}` : "Consultar";

  return (
    // *** 'group' está en el Card para que el hover aplique a toda la tarjeta ***
    <Card className="flex flex-col group border border-gray-200/80 hover:shadow-xl transition-shadow duration-300 ease-in-out w-full max-w-[260px] flex-shrink-0 rounded-lg overflow-hidden">

      {/* Contenedor de la Imagen: 'relative' para posicionar botones */}
      <div
        className="aspect-square w-full overflow-hidden bg-gray-100 relative cursor-pointer"
        onClick={handleViewDetails}
      >
        <img
          key={currentImageUrl} // Ayuda a React con las transiciones
          src={currentImageUrl}
          alt={`Imagen ${currentImageIndex + 1} de ${product.name || "Producto"}`}
          className="w-full h-full object-cover transition-opacity duration-200 ease-in-out"
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x600/cccccc/ffffff?text=Error"; }}
        />

        {/* Botones y Puntos - Solo si hay más de 1 imagen */}
        {totalImages > 1 && (
          <>
            {/* Botón Anterior */}
            <Button
              variant="ghost" size="icon" onClick={prevImage}
              // La visibilidad depende del hover en el Card ('group')
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/50 focus:opacity-100 p-1"
              title="Anterior"
            > <ChevronLeftIcon className="w-4 h-4" /> </Button>

            {/* Botón Siguiente */}
            <Button
              variant="ghost" size="icon" onClick={nextImage}
               // La visibilidad depende del hover en el Card ('group')
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/50 focus:opacity-100 p-1"
              title="Siguiente"
            > <ChevronRightIcon className="w-4 h-4" /> </Button>

            {/* Indicadores de Puntos */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex space-x-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {imageUrls.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                  className={`block w-1.5 h-1.5 rounded-full transition-all duration-150 ${ index === currentImageIndex ? 'bg-white ring-1 ring-offset-1 ring-white/50' : 'bg-white/60 hover:bg-white/80' }`} // Estilo mejorado
                  aria-label={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div> {/* Fin del contenedor de la imagen */}

      {/* Contenido de la Tarjeta */}
      <CardContent className="flex-grow flex flex-col justify-between p-3 bg-white">
        <div>
          <h3
            className="text-sm font-semibold mb-1 line-clamp-2 cursor-pointer group-hover:text-red-600 transition-colors duration-200 h-10"
            onClick={handleViewDetails}
            title={product.name}
          >
            {product.name || 'Nombre no disponible'}
          </h3>
           {product.rating > 0 && (
             <div className="flex items-center mb-1">
               {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < Math.round(product.rating)} className="w-3.5 h-3.5" />)}
               <span className="text-xs text-gray-500 ml-1">({product.reviewCount || 0})</span>
             </div>
           )}
        </div>
        <div className="flex justify-between items-center mt-2">
          <div><span className={`text-base font-medium ${isService ? "text-red-600" : "text-gray-900"}`}>{formattedPrice}</span></div>
          <Button
            size="sm"
            variant={isService ? "outline" : "default"}
            onClick={handleMainButtonClick}
          >
            {isService ? "Info" : "Agregar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
