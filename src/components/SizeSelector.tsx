"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface SizeSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectSize: (size: string) => void
  productTitle: string
}

const sizes = ["XS", "S", "M", "L", "XL", "XXL"]

export default function SizeSelector({
  isOpen,
  onClose,
  onSelectSize,
  productTitle,
}: SizeSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<string>("")

  if (!isOpen) return null

  const handleConfirm = () => {
    if (selectedSize) {
      onSelectSize(selectedSize)
      setSelectedSize("")
      onClose()
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Select Size</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Product Title */}
          <p className="text-sm text-gray-600 mb-4">{productTitle}</p>

          {/* Size Options */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-3 border-2 rounded-md font-medium transition-colors ${
                  selectedSize === size
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleConfirm}
              disabled={!selectedSize}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
