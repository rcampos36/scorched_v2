"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/CartContext"
import SizeSelector from "./SizeSelector"

interface Product {
  id: number
  image: string
  productType: string
  description: string
  price: string
}

interface GalleryData {
  heading: string
  browseAllLink: string
  products: Product[]
}

const defaultData: GalleryData = {
  heading: "Official Merch & Fanart",
  browseAllLink: "#",
  products: [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
      productType: "Tote Bag",
      description: "Friends Chandler Bath #friendshipgoals",
      price: "$21.99"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80",
      productType: "Women's Cropped T-Shirt",
      description: "SmileyWorld Endless Positivity Smiling Faces",
      price: "$29.99"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      productType: "Men's Ringer T-Shirt",
      description: "Harry Potter Hogwarts Alumni",
      price: "$36.99"
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80",
      productType: "Hoodie",
      description: "Custom Design Hoodie",
      price: "$45.99"
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
      productType: "Crewneck",
      description: "Premium Crewneck Sweatshirt",
      price: "$39.99"
    },
  ]
}

export default function ImageGallery() {
  const [data, setData] = useState<GalleryData>(defaultData)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const { addToCart } = useCart()
  const [sizeSelectorOpen, setSizeSelectorOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number
    image: string
    title: string
    description: string
    price: number
  } | null>(null)

  useEffect(() => {
    setMounted(true)
    
    const fetchData = async () => {
      try {
        const response = await fetch("/api/image-gallery")
        if (response.ok) {
          const fetchedData = await response.json()
          if (fetchedData) {
            setData(fetchedData)
          }
        }
      } catch (error) {
        console.error("Failed to fetch gallery data:", error)
        // Use default data on error
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const checkScrollability = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
      }
    }

    checkScrollability()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollability)
      window.addEventListener('resize', checkScrollability)
      return () => {
        container.removeEventListener('scroll', checkScrollability)
        window.removeEventListener('resize', checkScrollability)
      }
    }
  }, [data])

  const handleNext = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector('.product-card')?.clientWidth || 300
      const gap = 24 // gap-6 = 24px
      const scrollAmount = cardWidth + gap
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector('.product-card')?.clientWidth || 300
      const gap = 24
      const scrollAmount = cardWidth + gap
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    }
  }

  const handleSizeSelected = (size: string) => {
    if (selectedProduct) {
      addToCart({
        ...selectedProduct,
        size,
        orderType: 'merch',
      })
    }
  }

  if (!mounted) {
    return (
      <div className="w-full py-16 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!data.products || data.products.length === 0) {
    return null
  }

  return (
    <section className="w-full py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="mb-6 sm:mb-8 text-center px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
            {data.heading}
          </h2>
        </div>

        {/* Gallery Container */}
        <div className="relative">
          {/* Previous Button */}
          {canScrollLeft && (
            <button
              onClick={handlePrevious}
              className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center shadow-md transition-colors"
              aria-label="Previous products"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          )}

          {/* Scrollable Product Gallery */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-2 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {data.products.map((product) => {
              const handleAddToCartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault()
                e.stopPropagation()
                
                try {
                  // Convert price string to number (remove $ and any whitespace, then parse)
                  const priceString = product.price.replace(/[^0-9.]/g, '')
                  const priceNumber = parseFloat(priceString)
                  
                  if (isNaN(priceNumber) || priceNumber <= 0) {
                    console.error('Invalid price:', product.price)
                    alert('Invalid product price. Please contact support.')
                    return
                  }

                  // Set selected product and open size selector
                  setSelectedProduct({
                    id: product.id,
                    image: product.image,
                    title: product.productType,
                    description: product.description,
                    price: priceNumber,
                  })
                  setSizeSelectorOpen(true)
                } catch (error) {
                  console.error('Error preparing to add to cart:', error)
                  alert('Failed to add item to cart. Please try again.')
                }
              }


              return (
                <div
                  key={product.id}
                  className="product-card flex flex-col flex-shrink-0 w-[240px] sm:w-[280px] md:w-[300px] lg:w-[320px] bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                >
                  {/* Product Image */}
                  <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.productType}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 240px, (max-width: 768px) 280px, (max-width: 1024px) 300px, 320px"
                      quality={85}
                      loading="lazy"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <div className="flex-1 mb-2 sm:mb-3">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                        {product.productType}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                      <p className="text-base sm:text-lg font-bold text-gray-900">
                        {product.price}
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-1.5 sm:py-2 mt-auto text-xs sm:text-sm"
                      onClick={handleAddToCartClick}
                    >
                      <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Next Button */}
          {canScrollRight && (
            <button
              onClick={handleNext}
              className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center shadow-md transition-colors"
              aria-label="Next products"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Size Selector Modal */}
      {selectedProduct && (
        <SizeSelector
          isOpen={sizeSelectorOpen}
          onClose={() => {
            setSizeSelectorOpen(false)
            setSelectedProduct(null)
          }}
          onSelectSize={handleSizeSelected}
          productTitle={selectedProduct.title}
        />
      )}
    </section>
  )
}
