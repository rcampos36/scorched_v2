"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, ShoppingCart, Settings, Search, X } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useProductSelection } from "@/contexts/ProductSelectionContext"
import UserAuthModal from "./UserAuthModal"
import ProductSelectionModal from "./ProductSelectionModal"
import CustomTShirtModal from "./CustomTShirtModal"
import SweatsHoodiesModal from "./SweatsHoodiesModal"

interface HeaderLink {
  text: string
  url: string
}

interface HeaderData {
  topBar: {
    phone: string
    phoneLink: string
    chatText: string
    chatLink: string
  }
  logo: {
    src: string
    alt: string
    width: number
    height: number
  }
  navigationLinks: HeaderLink[]
  ctaButton: {
    text: string
    url: string
  }
}

const defaultData: HeaderData = {
  topBar: {
    phone: "1-866-440-8237",
    phoneLink: "tel:1-866-440-8237",
    chatText: "Chat with us",
    chatLink: "#"
  },
  logo: {
    src: "/logo-v9.png",
    alt: "Logo",
    width: 150,
    height: 40
  },
  navigationLinks: [
    { text: "Custom T-Shirts", url: "#" },
    { text: "Sweats & Hoodies", url: "#" }
  ],
  ctaButton: {
    text: "Create Your Custom Order",
    url: "#"
  }
}

export default function Header() {
  const router = useRouter()
  const [data, setData] = useState<HeaderData>(defaultData)
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { isOpen: productSelectionModalOpen, openModal: openProductSelectionModal, closeModal: closeProductSelectionModal } = useProductSelection()
  const [customTShirtModalOpen, setCustomTShirtModalOpen] = useState(false)
  const [sweatsHoodiesModalOpen, setSweatsHoodiesModalOpen] = useState(false)
  const { getTotalItems, setIsCartOpen } = useCart()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/header")
        if (response.ok) {
          const fetchedData = await response.json()
          if (fetchedData) {
            setData(fetchedData)
          }
        }
      } catch (error) {
        console.error("Failed to fetch header data:", error)
        // Use default data on error
      } finally {
        setLoading(false)
      }
    }

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/users/session")
        const data = await response.json()
        setIsAuthenticated(data.authenticated || false)
      } catch (error) {
        setIsAuthenticated(false)
      }
    }

    fetchData()
    checkAuth()
  }, [])

  if (loading) {
    return (
      <header className="w-full fixed top-0 left-0 right-0 z-50">
        <div className="bg-gray-700 text-white py-2">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <span className="text-gray-400">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="w-full fixed top-0 left-0 right-0 z-50">
      {/* Top Bar - Dark Grey */}
      <div className="bg-gray-700 text-white py-1.5 sm:py-2">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-3 sm:gap-6">
              <a href={data.topBar.phoneLink} className="hover:text-gray-300 transition-colors cursor-pointer whitespace-nowrap">
                {data.topBar.phone}
              </a>
            </div>
            <Link href="/admin/auth" className="flex items-center gap-1 sm:gap-2 hover:text-gray-300 transition-colors cursor-pointer">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Bar - White with rounded corners */}
      <nav className="px-2 sm:px-4 md:px-8 lg:px-12 pt-4 sm:pt-6 md:pt-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-14 sm:h-16 rounded-2xl sm:rounded-3xl md:rounded-4xl bg-white border border-gray-200 shadow-sm px-2 sm:px-4 md:px-6 lg:px-8">
            {/* Logo */}
            <Link href="/" className="flex items-center h-full cursor-pointer flex-shrink-0">
              <Image
                src={data.logo.src}
                alt={data.logo.alt}
                width={data.logo.width}
                height={data.logo.height}
                className="h-6 sm:h-8 md:h-10 w-auto object-contain"
                priority
                quality={90}
              />
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-4 lg:gap-8">
              {data.navigationLinks.map((link, index) => (
                link.text === "Custom T-Shirts" ? (
                  <button
                    key={index}
                    onClick={() => setCustomTShirtModalOpen(true)}
                    className="text-gray-700 hover:text-gray-900 font-bold transition-colors cursor-pointer text-sm lg:text-base"
                  >
                    {link.text}
                  </button>
                ) : link.text === "Sweats & Hoodies" ? (
                  <button
                    key={index}
                    onClick={() => setSweatsHoodiesModalOpen(true)}
                    className="text-gray-700 hover:text-gray-900 font-bold transition-colors cursor-pointer text-sm lg:text-base"
                  >
                    {link.text}
                  </button>
                ) : (
                  <Link
                    key={index}
                    href={link.url}
                    className="text-gray-700 hover:text-gray-900 font-bold transition-colors cursor-pointer text-sm lg:text-base"
                  >
                    {link.text}
                  </Link>
                )
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
              {/* Search */}
              <div className="relative h-8 w-8 sm:h-9 sm:w-9 mr-0 sm:mr-2">
                <div className="absolute inset-0 flex items-center justify-end">
                  {/* Search Icon Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`text-gray-700 hover:text-gray-900 rounded-full transition-all duration-300 ease-in-out h-8 w-8 sm:h-9 sm:w-9 ${
                      searchOpen 
                        ? "opacity-0 scale-0 rotate-90 pointer-events-none" 
                        : "opacity-100 scale-100 rotate-0"
                    }`}
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search"
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300" />
                  </Button>
                  
                  {/* Search Input Container */}
                  <div
                    className={`absolute right-0 flex items-center gap-2 bg-gray-100 rounded-full px-2 sm:px-3 py-1 transition-all duration-300 ease-in-out ${
                      searchOpen
                        ? "opacity-100 w-48 sm:w-56 md:w-64 translate-x-0"
                        : "opacity-0 w-0 translate-x-2 pointer-events-none"
                    }`}
                    style={{
                      transitionProperty: 'width, opacity, transform',
                    }}
                  >
                    <Search className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0 transition-opacity duration-200" />
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchQuery.trim()) {
                          // Handle search - you can customize this
                          window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
                        }
                        if (e.key === "Escape") {
                          setSearchOpen(false)
                          setSearchQuery("")
                        }
                      }}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-7 sm:h-8 flex-1 min-w-0 text-xs sm:text-sm placeholder:text-gray-400"
                      autoFocus={searchOpen}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 sm:h-6 sm:w-6 rounded-full hover:bg-gray-200 flex-shrink-0 transition-opacity duration-200"
                      onClick={() => {
                        setSearchOpen(false)
                        setSearchQuery("")
                      }}
                      aria-label="Close search"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <Button 
                className="bg-pink-500 hover:bg-pink-600 text-white font-medium px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-md cursor-pointer text-xs sm:text-sm md:text-base whitespace-nowrap"
                size="default"
                onClick={openProductSelectionModal}
              >
                <span className="hidden sm:inline">{data.ctaButton.text}</span>
                <span className="sm:hidden">Create</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-700 hover:text-gray-900 rounded-full h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => {
                  if (isAuthenticated) {
                    router.push("/account")
                  } else {
                    setAuthModalOpen(true)
                  }
                }}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="sr-only">User Account</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-700 hover:text-gray-900 rounded-full relative h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-pink-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {getTotalItems() > 9 ? '9+' : getTotalItems()}
                  </span>
                )}
                <span className="sr-only">Shopping Cart</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* User Auth Modal */}
      <UserAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthenticated(true)
          router.refresh()
        }}
      />

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={productSelectionModalOpen}
        onClose={closeProductSelectionModal}
      />

      {/* Custom T-Shirt Modal */}
      <CustomTShirtModal
        isOpen={customTShirtModalOpen}
        onClose={() => setCustomTShirtModalOpen(false)}
      />

      {/* Sweats & Hoodies Modal */}
      <SweatsHoodiesModal
        isOpen={sweatsHoodiesModalOpen}
        onClose={() => setSweatsHoodiesModalOpen(false)}
      />
    </header>
  )
}
