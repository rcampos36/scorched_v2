"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface ProductSelectionContextType {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const ProductSelectionContext = createContext<ProductSelectionContextType | undefined>(undefined)

export function ProductSelectionProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return (
    <ProductSelectionContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </ProductSelectionContext.Provider>
  )
}

export function useProductSelection() {
  const context = useContext(ProductSelectionContext)
  if (context === undefined) {
    throw new Error("useProductSelection must be used within a ProductSelectionProvider")
  }
  return context
}
