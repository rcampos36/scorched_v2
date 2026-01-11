"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface CartItem {
  id: number
  image: string
  title: string
  description: string
  price: number
  quantity: number
  size?: string
  color?: string
  graphic?: string
  orderType?: 'custom' | 'merch'
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (product: Omit<CartItem, "quantity">) => void
  removeFromCart: (id: number, size?: string, color?: string, graphic?: string) => void
  updateQuantity: (id: number, quantity: number, size?: string, color?: string, graphic?: string) => void
  updateSize: (id: number, oldSize: string | undefined, newSize: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart))
        } catch (error) {
          console.error("Failed to load cart from localStorage:", error)
        }
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cartItems))
    }
  }, [cartItems])

  const addToCart = (product: Omit<CartItem, "quantity">) => {
    setCartItems((prevItems) => {
      // Find existing item with same id, size, color, and graphic
      const existingItem = prevItems.find((item) => 
        item.id === product.id && 
        item.size === product.size && 
        item.color === product.color &&
        item.graphic === product.graphic
      )
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id && 
          item.size === product.size && 
          item.color === product.color &&
          item.graphic === product.graphic
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevItems, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (id: number, size?: string, color?: string, graphic?: string) => {
    setCartItems((prevItems) => 
      prevItems.filter((item) => 
        !(item.id === id && item.size === size && item.color === color && item.graphic === graphic)
      )
    )
  }

  const updateQuantity = (id: number, quantity: number, size?: string, color?: string, graphic?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, size, color, graphic)
      return
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && item.size === size && item.color === color && item.graphic === graphic
          ? { ...item, quantity } 
          : item
      )
    )
  }

  const updateSize = (id: number, oldSize: string | undefined, newSize: string) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && item.size === oldSize 
          ? { ...item, size: newSize }
          : item
      )
    )
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateSize,
        clearCart,
        getTotalPrice,
        getTotalItems,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
