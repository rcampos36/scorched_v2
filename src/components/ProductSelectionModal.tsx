"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProductCustomizationModal from "./ProductCustomizationModal"

interface Product {
  id: number
  image: string
  title: string
  description: string
  price: number
}

interface ProductSelectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProductSelectionModal({
  isOpen,
  onClose,
}: ProductSelectionModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
    }
  }, [isOpen])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/best-selling")
      if (response.ok) {
        const data = await response.json()
        if (data?.products && data.products.length > 0) {
          setProducts(data.products)
        }
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setIsCustomizationOpen(true)
  }

  const handleCustomizationClose = () => {
    setIsCustomizationOpen(false)
    setSelectedProduct(null)
  }

  const handleClose = () => {
    if (!isCustomizationOpen) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } transition-opacity duration-300`}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isCustomizationOpen) {
            handleClose()
          }
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold">Select a Product</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full"
              disabled={isCustomizationOpen}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-600">No products available</p>
              </div>
            ) : (
              <div 
                className="grid gap-6"
                style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                }}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer border border-gray-200"
                    onClick={() => handleProductSelect(product)}
                  >
                    {/* Image */}
                    <div className="relative w-full aspect-[4/5] overflow-hidden">
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
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          quality={85}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold uppercase text-gray-900 mb-2">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {product.description}
                      </p>
                      <p className="text-lg font-bold text-pink-600">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Customization Modal */}
      {selectedProduct && (
        <ProductCustomizationModal
          isOpen={isCustomizationOpen}
          onClose={handleCustomizationClose}
          product={selectedProduct}
        />
      )}
    </>
  )
}
