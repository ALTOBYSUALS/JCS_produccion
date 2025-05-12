export interface Product {
  id: number
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
  rating?: number
  reviewCount?: number
  discount?: string
  installments?: string
  shipping?: string
  url?: string
}

export const fetchProductsFromCSV = async (): Promise<Product[]> => {
  try {
    const csvUrl = process.env.NEXT_PUBLIC_CSV_URL || "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/listado%20%281%29-8xF7DXFQVO4peY0hK7rvlH1BWmqsgQ.csv"
    const response = await fetch(csvUrl)

    if (!response.ok) {
      throw new Error(`Error fetching CSV: ${response.status}`)
    }

    const csvText = await response.text()
    const products = parseCSVToProducts(csvText)
    return products
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

const parseCSVToProducts = (csvText: string): Product[] => {
  // Skip header row and split by lines
  const lines = csvText.split("\n").slice(1)

  return lines
    .filter((line) => line.trim() !== "")
    .map((line, index) => {
      // Parse CSV line (handling commas within quotes)
      const values = parseCSVLine(line)

      // Extract values based on schema
      const imageUrl = values[0] || "https://placehold.co/600x600/cccccc/333?text=Producto"
      const name = values[1] || `Producto ${index + 1}`
      const url = values[2] || ""
      const rating = Number.parseFloat(values[4]) || 0
      const reviewCount = Number.parseInt(values[7]?.replace(/[()]/g, "") || "0")

      // Price handling
      const priceStr = values[9] || "0"
      const price = Number.parseFloat(priceStr.replace(/\./g, "").replace(/,/g, ".")) || 0

      // Discount
      const discount = values[11] || ""

      // Installments
      const installments = values[12] || ""

      // Shipping
      const shipping = values[16] || ""

      // Determine category based on name
      let category = "accesorio"
      if (name.toLowerCase().includes("llanta")) {
        category = "llanta"
      } else if (name.toLowerCase().includes("neumático") || name.toLowerCase().includes("neumatico")) {
        category = "neumatico"
      } else if (name.toLowerCase().includes("servicio")) {
        category = "servicio"
      }

      // Create description from available data
      const description = `${name}. ${shipping ? `Con ${shipping.toLowerCase()}.` : ""} ${
        discount ? `Ahorra con ${discount}.` : ""
      } ${installments ? `Disponible en ${installments.toLowerCase()}.` : ""}`

      return {
        id: index + 1,
        name,
        description,
        price,
        imageUrl,
        category,
        rating,
        reviewCount,
        discount,
        installments,
        shipping,
        url,
      }
    })
}

// Helper function to parse CSV line handling commas within quotes
const parseCSVLine = (line: string): string[] => {
  const result = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}
