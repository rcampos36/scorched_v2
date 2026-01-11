"use client"

import { useCart } from "@/contexts/CartContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { X, Plus, Minus, ShoppingBag } from "lucide-react"
import { useState } from "react"
import Checkout from "./Checkout"

const sizes = ["XS", "S", "M", "L", "XL", "XXL"]

// Color mapping for display
const COLOR_MAP: Record<string, { label: string; hex: string }> = {
  black: { label: "Black", hex: "#000000" },
  white: { label: "White", hex: "#FFFFFF" },
  navy: { label: "Navy", hex: "#1E3A5F" },
  gray: { label: "Gray", hex: "#808080" },
  red: { label: "Red", hex: "#DC2626" },
  blue: { label: "Blue", hex: "#2563EB" },
  green: { label: "Green", hex: "#16A34A" },
  yellow: { label: "Yellow", hex: "#EAB308" },
  orange: { label: "Orange", hex: "#EA580C" },
  purple: { label: "Purple", hex: "#9333EA" },
  pink: { label: "Pink", hex: "#EC4899" },
  brown: { label: "Brown", hex: "#92400E" },
}

export default function Cart() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    updateSize,
    getTotalPrice,
    isCartOpen,
    setIsCartOpen,
  } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)

  if (!isCartOpen) return null

  const handleCheckout = () => {
    if (cartItems.length === 0) return
    
    // Check if all items have sizes
    const itemsWithoutSize = cartItems.filter(item => !item.size || item.size.trim() === '')
    if (itemsWithoutSize.length > 0) {
      alert('Please select a size for all items before proceeding to checkout.')
      return
    }
    
    setShowCheckout(true)
  }

  if (showCheckout) {
    return (
      <Checkout
        onBack={() => setShowCheckout(false)}
        onClose={() => {
          setShowCheckout(false)
          setIsCartOpen(false)
        }}
      />
    )
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-xl sm:text-2xl font-bold">Shopping Cart</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCartOpen(false)}
            className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-4" />
              <p className="text-gray-600 text-base sm:text-lg mb-2">Your cart is empty</p>
              <p className="text-gray-400 text-xs sm:text-sm">
                Add some items to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {cartItems.map((item, index) => (
                <Card key={`${item.id}-${item.size || 'no-size'}-${item.color || 'no-color'}-${index}`}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      {/* Product Image */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 64px, 80px"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 truncate">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {item.description}
                        </p>
                        
                        {/* Size Selector */}
                        <div className="mb-2">
                          <label className="text-xs text-gray-500 mb-1 block">
                            Size: <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={item.size || ""}
                            onChange={(e) => {
                              if (e.target.value) {
                                updateSize(item.id, item.size, e.target.value)
                              }
                            }}
                            className={`text-xs border rounded px-2 py-1 bg-white ${
                              !item.size || item.size.trim() === ''
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                            required
                          >
                            <option value="">Select Size *</option>
                            {sizes.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                          {(!item.size || item.size.trim() === '') && (
                            <p className="text-xs text-red-500 mt-1">Size is required</p>
                          )}
                        </div>

                        {item.color && (
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Color:</span>
                            <div
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{
                                backgroundColor: COLOR_MAP[item.color]?.hex || item.color
                              }}
                            />
                            <span className="text-xs text-gray-600">
                              {COLOR_MAP[item.color]?.label || item.color.charAt(0).toUpperCase() + item.color.slice(1)}
                            </span>
                          </div>
                        )}
                        <p className="text-sm font-bold text-gray-900 mb-2">
                          ${item.price.toFixed(2)}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1, item.size, item.color, item.graphic)
                            }
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1, item.size, item.color, item.graphic)
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 ml-auto text-red-600 hover:text-red-700"
                            onClick={() => removeFromCart(item.id, item.size, item.color, item.graphic)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Total and Checkout */}
        {cartItems.length > 0 && (
          <div className="border-t p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between text-base sm:text-lg font-bold">
              <span>Total:</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            {cartItems.some(item => !item.size || item.size.trim() === '') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 sm:p-3">
                <p className="text-xs sm:text-sm text-yellow-800">
                  ⚠️ Please select a size for all items before checkout
                </p>
              </div>
            )}
            <Button
              className="w-full bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-2 sm:py-2.5"
              onClick={handleCheckout}
              disabled={cartItems.some(item => !item.size || item.size.trim() === '')}
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
