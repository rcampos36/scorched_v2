"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import ProductCustomizationModal from "./ProductCustomizationModal"

interface ProductCard {
  id: number
  image: string
  title: string
  description: string
  price?: number
}

const defaultProducts: ProductCard[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
    title: "HOODIES",
    description: "Our best-selling pullover hoodies.",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    title: "CREWNECKS",
    description: "Custom sweats for cold weather.",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    title: "BASIC T-SHIRTS",
    description: "Standard tees for any occasion.",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
    title: "PREMIUM TEES",
    description: "Our favorite super-soft t-shirts.",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    title: "NO MINIMUMS",
    description: "No minimums, unlimited print colors.",
  },
]

interface SectionData {
  sectionHeading: string
  sectionSubtitle: string
  products: ProductCard[]
}

export default function BestSellingShirts() {
  const [sectionHeading, setSectionHeading] = useState("OUR BEST-SELLING SHIRTS. JUMP RIGHT IN.")
  const [sectionSubtitle, setSectionSubtitle] = useState("Get started with one of our best-selling favorites.")
  const [products, setProducts] = useState<ProductCard[]>(defaultProducts)
  const [mounted, setMounted] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductCard | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const fetchData = async () => {
      try {
        // Add cache busting with timestamp to ensure fresh data
        const timestamp = Date.now()
        const response = await fetch(`/api/best-selling?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        })
        if (response.ok) {
          const data: SectionData = await response.json()
          if (data) {
            if (data.sectionHeading) setSectionHeading(data.sectionHeading)
            if (data.sectionSubtitle) setSectionSubtitle(data.sectionSubtitle)
            if (data.products && data.products.length > 0) {
              setProducts(data.products)
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch products:", error)
        // Use default data on error
      }
    }

    fetchData()
    
    // Refetch data periodically (every 30 seconds) to pick up changes
    const interval = setInterval(() => {
      fetchData()
    }, 30000) // 30 seconds
    
    // Refetch data when window gains focus (user returns to tab)
    const handleFocus = () => {
      fetchData()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  if (!mounted) {
    return (
      <div className="w-full py-16 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <section className="w-full py-16 bg-gray-100">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 leading-tight px-4">
            {(() => {
              // Split heading at first period to create two lines
              const periodIndex = sectionHeading.indexOf('.')
              if (periodIndex !== -1) {
                const firstLine = sectionHeading.substring(0, periodIndex + 1)
                const secondLine = sectionHeading.substring(periodIndex + 2).trim()
                
                const formatText = (text: string, keyPrefix: string) => 
                  text.split(/(BEST-SELLING)/i).map((part, i) => 
                    part.toUpperCase() === "BEST-SELLING" || part.toLowerCase() === "best-selling" ? (
                      <span key={`${keyPrefix}-${i}`} className="text-blue-600">{part}</span>
                    ) : (
                      <span key={`${keyPrefix}-${i}`}>{part}</span>
                    )
                  )
                
                return (
                  <>
                    {formatText(firstLine, 'line1')}
                    <br />
                    {formatText(secondLine, 'line2')}
                  </>
                )
              } else {
                // If no period found, display as single line
                return sectionHeading.split(/(BEST-SELLING)/i).map((part, i) => 
                  part.toUpperCase() === "BEST-SELLING" || part.toLowerCase() === "best-selling" ? (
                    <span key={i} className="text-blue-600">{part}</span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )
              }
            })()}
          </h2>
          
          {/* Separator Line */}
          <div className="w-16 h-0.5 bg-gray-900 mx-auto mb-6"></div>
          
          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-700 px-4">
            {sectionSubtitle}
          </p>
        </div>

        {/* Product Cards */}
        <div className="w-full px-4">
          <div 
            className="grid gap-4 sm:gap-6 mx-auto w-full"
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-full bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer"
              onClick={() => {
                setSelectedProduct(product)
                setIsModalOpen(true)
              }}
            >
              {/* Image */}
              <div className="relative w-full aspect-[4/5] overflow-hidden rounded-t-lg">
                {product.image.startsWith('/uploads/') ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    quality={85}
                    loading="lazy"
                  />
                )}
              </div>
              
              {/* Content */}
              <div className="p-4 sm:p-6 text-center transition-colors duration-300 group-hover:bg-pink-500">
                <h3 className="text-sm sm:text-base md:text-lg font-bold uppercase text-gray-900 mb-2 tracking-wide group-hover:text-white transition-colors duration-300">
                  {product.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 group-hover:text-white transition-colors duration-300">
                  {product.description}
                </p>
              </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Customization Modal */}
        {selectedProduct && (
          <ProductCustomizationModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedProduct(null)
            }}
            product={{
              id: selectedProduct.id,
              image: selectedProduct.image,
              title: selectedProduct.title,
              description: selectedProduct.description,
              price: selectedProduct.price || 0,
            }}
          />
        )}
      </div>
    </section>
  )
}
