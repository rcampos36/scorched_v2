"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X, Upload, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/contexts/CartContext"

interface Product {
  id: number
  image: string
  title: string
  description: string
  price: number
}

interface SizeOption {
  size: string
  quantity: number
  color: string
}

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"]

interface ColorOption {
  value: string
  label: string
  hex: string
}

const AVAILABLE_COLORS: ColorOption[] = [
  { value: "black", label: "Black", hex: "#000000" },
  { value: "white", label: "White", hex: "#FFFFFF" },
  { value: "navy", label: "Navy", hex: "#1E3A5F" },
  { value: "gray", label: "Gray", hex: "#808080" },
  { value: "red", label: "Red", hex: "#DC2626" },
  { value: "blue", label: "Blue", hex: "#2563EB" },
  { value: "green", label: "Green", hex: "#16A34A" },
  { value: "yellow", label: "Yellow", hex: "#EAB308" },
  { value: "orange", label: "Orange", hex: "#EA580C" },
  { value: "purple", label: "Purple", hex: "#9333EA" },
  { value: "pink", label: "Pink", hex: "#EC4899" },
  { value: "brown", label: "Brown", hex: "#92400E" },
]

const DEFAULT_COLOR = "black"

interface ProductCustomizationModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
}

export default function ProductCustomizationModal({
  isOpen,
  onClose,
  product,
}: ProductCustomizationModalProps) {
  const [sizeOptions, setSizeOptions] = useState<SizeOption[]>([])
  const [graphic, setGraphic] = useState<string | undefined>(undefined)
  const [uploadingGraphic, setUploadingGraphic] = useState<boolean>(false)
  const { addToCart, setIsCartOpen } = useCart()

  useEffect(() => {
    if (product && isOpen) {
      // Start with empty size options - user will add sizes as needed
      setSizeOptions([])
      setGraphic(undefined)
    }
  }, [product, isOpen])

  if (!isOpen || !product) return null

  const updateSizeOption = (index: number, updates: Partial<SizeOption>) => {
    setSizeOptions((prev) =>
      prev.map((option, i) => (i === index ? { ...option, ...updates } : option))
    )
  }

  const removeSizeOption = (index: number) => {
    setSizeOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const addSizeOption = () => {
    // Find first available size that's not already in the list
    const usedSizes = sizeOptions.map((opt) => opt.size)
    const availableSize = AVAILABLE_SIZES.find((size) => !usedSizes.includes(size))
    
    if (availableSize) {
      setSizeOptions((prev) => [
        ...prev,
        {
          size: availableSize,
          quantity: 1,
          color: DEFAULT_COLOR,
        },
      ])
    }
  }

  const handleGraphicUpload = async (file: File) => {
    setUploadingGraphic(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/customer-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setGraphic(data.url)
    } catch (error) {
      console.error('Failed to upload graphic:', error)
      alert('Failed to upload graphic/logo. Please try again.')
    } finally {
      setUploadingGraphic(false)
    }
  }

  const handleGraphicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleGraphicUpload(file)
    }
    e.target.value = ''
  }

  const handleRemoveGraphic = () => {
    setGraphic(undefined)
  }

  const getTotalPrice = () => {
    return sizeOptions.reduce((total, option) => {
      return total + product.price * option.quantity
    }, 0)
  }

  const getTotalQuantity = () => {
    return sizeOptions.reduce((total, option) => total + option.quantity, 0)
  }

  const handleAddToCart = () => {
    // Validate that graphic is provided
    if (!graphic) {
      alert('Please upload or enter a graphic/logo before adding to cart.')
      return
    }

    // Add each size/color/quantity combination with the same graphic
    sizeOptions.forEach((option) => {
      if (option.quantity > 0) {
        // Add the item the specified number of times
        // addToCart will increment quantity if item already exists
        for (let i = 0; i < option.quantity; i++) {
          addToCart({
            id: product.id,
            image: product.image,
            title: product.title,
            description: product.description,
            price: product.price,
            size: option.size,
            color: option.color,
            graphic: graphic,
            orderType: 'custom',
          })
        }
      }
    })
    
    // Close modal and optionally open cart
    onClose()
    setIsCartOpen(true)
  }

  const hasItems = getTotalQuantity() > 0
  const canAddToCart = hasItems && graphic

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      } transition-opacity duration-300`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 z-[60]" />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col z-[61]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{product.title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="relative w-full aspect-square rounded-lg overflow-hidden">
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
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
            </div>

            {/* Customization Options */}
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${product.price.toFixed(2)} each
                </p>
              </div>

              {/* Size, Quantity, and Color Options */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Select Size, Quantity & Color
                </Label>

                {sizeOptions.length === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSizeOption}
                    className="w-full"
                  >
                    + Add Size
                  </Button>
                ) : (
                  <div className="space-y-3">
                    {sizeOptions.map((option, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg space-y-3"
                      >
                        {/* Size, Quantity, Color Row */}
                        <div className="flex items-center gap-3">
                          {/* Size Selector */}
                          <div className="flex-shrink-0">
                            <Label htmlFor={`size-${index}`} className="sr-only">
                              Size
                            </Label>
                            <select
                              id={`size-${index}`}
                              value={option.size}
                              onChange={(e) =>
                                updateSizeOption(index, { size: e.target.value })
                              }
                              className="h-10 px-3 border rounded-md bg-white text-sm font-medium"
                            >
                              {AVAILABLE_SIZES.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity Input */}
                          <div className="flex-shrink-0">
                            <Label htmlFor={`quantity-${index}`} className="sr-only">
                              Quantity
                            </Label>
                            <Input
                              id={`quantity-${index}`}
                              type="number"
                              min="0"
                              value={option.quantity}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 0
                                updateSizeOption(index, { quantity: qty })
                              }}
                              className="w-20 text-center"
                              placeholder="0"
                            />
                          </div>

                          {/* Color Selector */}
                          <div className="flex items-center gap-2 flex-1">
                            <Label htmlFor={`color-${index}`} className="text-sm whitespace-nowrap">
                              Color:
                            </Label>
                            <div className="flex items-center gap-2 flex-1">
                              <select
                                id={`color-${index}`}
                                value={option.color}
                                onChange={(e) =>
                                  updateSizeOption(index, { color: e.target.value })
                                }
                                className="h-10 px-3 border rounded-md bg-white text-sm font-medium flex-1"
                              >
                                {AVAILABLE_COLORS.map((color) => (
                                  <option key={color.value} value={color.value}>
                                    {color.label}
                                  </option>
                                ))}
                              </select>
                              <div
                                className="w-8 h-8 rounded border border-gray-300 flex-shrink-0"
                                style={{
                                  backgroundColor: AVAILABLE_COLORS.find(c => c.value === option.color)?.hex || "#000000"
                                }}
                              />
                            </div>
                          </div>

                          {/* Remove Button */}
                          {option.quantity === 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSizeOption(index)}
                              className="flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add Another Size Button */}
                    {sizeOptions.length < AVAILABLE_SIZES.length && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addSizeOption}
                        className="w-full"
                      >
                        + Add Another Size
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Graphic/Logo Upload Section - Shared for all products */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">
                  Graphic/Logo <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-gray-500 mb-2">
                  Upload a high-quality graphic, logo, or design. This will be applied to all products in your order. Accepted formats: <strong>JPEG, PNG, WebP, GIF</strong>. Maximum size: <strong>10MB</strong>. For best results, use high-resolution images (300 DPI or higher). Recommended: PNG with transparent background for logos.
                </p>
                
                {graphic ? (
                  <div className="space-y-2">
                    <div className="relative w-full h-32 border rounded-md overflow-hidden bg-gray-100">
                      {graphic.startsWith('/uploads/') ? (
                        <img
                          src={graphic}
                          alt="Graphic preview"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      ) : (
                        <Image
                          src={graphic}
                          alt="Graphic/Logo preview"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          quality={95}
                        />
                      )}
                      <button
                        onClick={handleRemoveGraphic}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <Input
                      type="text"
                      value={graphic}
                      readOnly
                      className="text-xs"
                      placeholder="Graphic URL"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label
                      htmlFor="graphic-upload"
                      className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                        uploadingGraphic
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                      }`}
                    >
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {uploadingGraphic ? "Uploading..." : "Upload Graphic/Logo"}
                      </span>
                      <input
                        id="graphic-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleGraphicFileChange}
                        disabled={uploadingGraphic}
                        className="hidden"
                      />
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Or enter graphic/logo URL (https://example.com/logo.png)"
                        onChange={(e) => setGraphic(e.target.value || undefined)}
                        value={graphic || ""}
                        className="text-xs"
                      />
                      {graphic && (
                        <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Total and Add to Cart */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Quantity</p>
              <p className="text-xl font-bold">{getTotalQuantity()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Price</p>
              <p className="text-2xl font-bold text-pink-600">
                ${getTotalPrice().toFixed(2)}
              </p>
            </div>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
