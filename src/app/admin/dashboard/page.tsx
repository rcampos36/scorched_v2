"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { LogOut, Plus, Trash2, Save, Upload, X, Image as ImageIcon, Mail, Send, Copy, Check, Edit, ChevronDown, ChevronUp, Printer, Download, RefreshCw, Layout, FileText, Settings, Menu, Bell, MessageCircle, User, Search, ChevronRight, Star, CheckSquare } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import ProductEditModal from "@/components/ProductEditModal"

interface Slide {
  id: number
  image: string
  title: string
  description: string
  ctaText: string
  ctaButton: string
}

interface ProductCard {
  id: number
  image: string
  title: string
  description: string
  price?: number
  graphic?: string
}

interface AboutUsData {
  heading: string
  paragraph1: {
    icon: string
    text: string
  }
  paragraph2: {
    icon: string
    text: string
  }
  button1: {
    text: string
    link: string
  }
  button2: {
    text: string
    link: string
  }
  image: string
}

interface GalleryProduct {
  id: number
  image: string
  productType: string
  description: string
  price: string
}

interface GalleryData {
  heading: string
  browseAllLink: string
  products: GalleryProduct[]
}

interface FooterLink {
  text: string
  url: string
}

interface SocialMediaLink {
  name: string
  url: string
  icon: string
}

interface HeaderLink {
  text: string
  url: string
}

interface HeaderData {
  topBar: {
    phone: string
    phoneLink: string
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

interface Step {
  id: number
  image: string
  title: string
  description: string
}

interface HowItWorksData {
  heading: string
  subtitle: string
  steps: Step[]
  buttonText: string
  buttonLink: string
}

interface FooterData {
  contact: {
    heading: string
    phone: string
    email: string
    hours: {
      weekdays: string
      weekends: string
    }
  }
  navigateLinks: FooterLink[]
  companyLinks: FooterLink[]
  additionalLinks: FooterLink[]
  socialMedia: SocialMediaLink[]
  newsletter: {
    heading: string
    description: string
  }
  copyright: string
}

export default function AdminDashboard() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [products, setProducts] = useState<ProductCard[]>([])
  const [sectionHeading, setSectionHeading] = useState("OUR BEST-SELLING SHIRTS. JUMP RIGHT IN.")
  const [sectionSubtitle, setSectionSubtitle] = useState("Get started with one of our best-selling favorites.")
  const [aboutUs, setAboutUs] = useState<AboutUsData>({
    heading: "ABOUT US",
    paragraph1: { icon: "pen", text: "" },
    paragraph2: { icon: "shirt", text: "" },
    button1: { text: "Create Now", link: "#" },
    button2: { text: "Shop Now", link: "#" },
    image: ""
  })
  const [galleryData, setGalleryData] = useState<GalleryData>({
    heading: "Official Merch & Fanart",
    browseAllLink: "#",
    products: []
  })
  const [footerData, setFooterData] = useState<FooterData>({
    contact: {
      heading: "GET IN TOUCH",
      phone: "(866) 440-8237",
      email: "SERVICE@SCORCHEDFABRICS.COM",
      hours: {
        weekdays: "Mon - Fri, 9am - 8pm Eastern",
        weekends: "Weekends, 9am - 5pm Eastern"
      }
    },
    navigateLinks: [],
    companyLinks: [],
    additionalLinks: [],
    socialMedia: [],
    newsletter: {
      heading: "Newsletter",
      description: "Subscribe to our newsletter to stay updated with the latest news, offers, and exclusive deals."
    },
    copyright: "Scorched Fabrics"
  })
  const [headerData, setHeaderData] = useState<HeaderData>({
    topBar: {
      phone: "1-866-440-8237",
      phoneLink: "tel:1-866-440-8237"
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
      text: "Create Your Shirt",
      url: "#"
    }
  })
  const [howItWorks, setHowItWorks] = useState<HowItWorksData>({
    heading: "HOW IT WORKS",
    subtitle: "Easily create custom t-shirts, hoodies, polos, hats & more online.",
    steps: [
      { id: 1, image: "", title: "Design Online", description: "" },
      { id: 2, image: "", title: "Expertly Printed", description: "" },
      { id: 3, image: "", title: "Delivered To You", description: "" }
    ],
    buttonText: "Get Started",
    buttonLink: "#"
  })
  const [activeTab, setActiveTab] = useState<"slides" | "products" | "about" | "gallery" | "footer" | "header" | "howitworks" | "orders" | "newsletter">("slides")
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({})
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [orders, setOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [editingTracking, setEditingTracking] = useState<{ [key: string]: string }>({})
  const [editingCarrier, setEditingCarrier] = useState<{ [key: string]: string }>({})
  const [expandedShippedOrders, setExpandedShippedOrders] = useState<{ [key: string]: boolean }>({})
  const [newsletterSubscriptions, setNewsletterSubscriptions] = useState<{ email: string; subscribedAt: string }[]>([])
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [groupEmailSubject, setGroupEmailSubject] = useState("")
  const [groupEmailContent, setGroupEmailContent] = useState("")
  const [sendingGroupEmail, setSendingGroupEmail] = useState(false)
  const [copiedEmails, setCopiedEmails] = useState(false)
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start closed on mobile
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    checkAuth()
    fetchSlides()
    fetchProducts()
    fetchAboutUs()
    fetchGallery()
    fetchFooter()
    fetchHeader()
    fetchHowItWorks()
    fetchOrders()
    fetchNewsletterSubscriptions()
    
    // Set initial sidebar state based on screen size
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true) // Auto-open on desktop
      } else {
        setSidebarOpen(false) // Auto-close on mobile
      }
    }
    
    handleResize() // Set initial state
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session")
      const data = await response.json()
      if (!data.authenticated) {
        router.push("/admin/auth")
        return
      }
      setUserEmail(data.email)
    } catch (error) {
      router.push("/admin/auth")
    }
  }

  const fetchSlides = async () => {
    try {
      const response = await fetch(`/api/hero-slides?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched slides:', data)
        setSlides(data)
      } else {
        console.error("Failed to fetch slides - response not ok:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch slides:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/best-selling?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        if (data) {
          if (data.sectionHeading) setSectionHeading(data.sectionHeading)
          if (data.sectionSubtitle) setSectionSubtitle(data.sectionSubtitle)
          if (data.products) setProducts(data.products)
          else if (Array.isArray(data)) setProducts(data) // Handle legacy format
        }
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAboutUs = async () => {
    try {
      const response = await fetch(`/api/about-us?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setAboutUs(data)
        }
      }
    } catch (error) {
      console.error("Failed to fetch about us data:", error)
    }
  }

  const fetchGallery = async () => {
    try {
      const response = await fetch(`/api/image-gallery?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setGalleryData(data)
        }
      }
    } catch (error) {
      console.error("Failed to fetch gallery data:", error)
    }
  }

  const fetchFooter = async () => {
    try {
      const response = await fetch(`/api/footer?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched footer data:', data)
        console.log('Fetched social media links:', data.socialMedia)
        if (data) {
          // Ensure newsletter field exists for backward compatibility
          if (!data.newsletter) {
            data.newsletter = {
              heading: "Newsletter",
              description: "Subscribe to our newsletter to stay updated with the latest news, offers, and exclusive deals."
            }
          }
          
          // Convert old socialMedia object format to new array format for backward compatibility
          if (data.socialMedia && !Array.isArray(data.socialMedia)) {
            const oldSocialMedia = data.socialMedia as any
            data.socialMedia = []
            
            if (oldSocialMedia.facebook) {
              data.socialMedia.push({ name: "Facebook", url: oldSocialMedia.facebook, icon: "facebook" })
            }
            if (oldSocialMedia.instagram) {
              data.socialMedia.push({ name: "Instagram", url: oldSocialMedia.instagram, icon: "instagram" })
            }
            if (oldSocialMedia.tiktok) {
              data.socialMedia.push({ name: "TikTok", url: oldSocialMedia.tiktok, icon: "tiktok" })
            }
            if (oldSocialMedia.youtube) {
              data.socialMedia.push({ name: "YouTube", url: oldSocialMedia.youtube, icon: "youtube" })
            }
            if (oldSocialMedia.pinterest) {
              data.socialMedia.push({ name: "Pinterest", url: oldSocialMedia.pinterest, icon: "pinterest" })
            }
          }
          
          // Ensure socialMedia is an array (fallback to empty array if missing)
          if (!Array.isArray(data.socialMedia)) {
            data.socialMedia = []
          }
          
          console.log('Setting footer data with social media:', data.socialMedia)
          setFooterData(data)
        }
      } else {
        console.error("Failed to fetch footer - response not ok:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch footer data:", error)
    }
  }

  const fetchHeader = async () => {
    try {
      // Add cache busting to ensure fresh data
      const response = await fetch(`/api/header?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched header data:", data)
        console.log("Fetched phone number:", data.topBar?.phone)
        if (data) {
          // Remove chat fields if they exist in the data
          if (data.topBar) {
            const { chatText, chatLink, ...topBar } = data.topBar
            data.topBar = topBar
          }
          console.log("Setting header data with phone:", data.topBar?.phone)
          setHeaderData(data)
        }
      }
    } catch (error) {
      console.error("Failed to fetch header data:", error)
    }
  }

  const fetchHowItWorks = async () => {
    try {
      const response = await fetch(`/api/how-it-works?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setHowItWorks(data)
        }
      }
    } catch (error) {
      console.error("Failed to fetch how it works data:", error)
    }
  }

  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const response = await fetch("/api/orders")
      if (response.ok) {
        const data = await response.json()
        if (data.orders) {
          // Sort by order date (newest first)
          const sortedOrders = data.orders.sort((a: any, b: any) => 
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
          )
          setOrders(sortedOrders)
        }
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const fetchNewsletterSubscriptions = async () => {
    setNewsletterLoading(true)
    try {
      const response = await fetch("/api/newsletter/subscribe")
      if (response.ok) {
        const data = await response.json()
        if (data.subscriptions) {
          // Sort subscriptions by date (newest first)
          const sortedSubscriptions = data.subscriptions.sort((a: any, b: any) => 
            new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime()
          )
          setNewsletterSubscriptions(sortedSubscriptions)
        }
      }
    } catch (error) {
      console.error("Failed to fetch newsletter subscriptions:", error)
    } finally {
      setNewsletterLoading(false)
    }
  }

  const handleCopyEmails = async () => {
    const emails = newsletterSubscriptions.map(sub => sub.email).join(", ")
    try {
      await navigator.clipboard.writeText(emails)
      setCopiedEmails(true)
      setTimeout(() => setCopiedEmails(false), 2000)
    } catch (error) {
      console.error("Failed to copy emails:", error)
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = emails
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopiedEmails(true)
      setTimeout(() => setCopiedEmails(false), 2000)
    }
  }

  const handleDeleteSubscription = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the newsletter list?`)) {
      return
    }

    try {
      const response = await fetch(`/api/newsletter/subscribe?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to remove email" })
        return
      }

      setMessage({ type: "success", text: "Email removed successfully" })
      // Refresh the subscriptions list
      await fetchNewsletterSubscriptions()
    } catch (error) {
      console.error("Failed to delete subscription:", error)
      setMessage({ type: "error", text: "An error occurred while removing the email" })
    }
  }

  const handleSendGroupEmail = async () => {
    if (!groupEmailSubject.trim() || !groupEmailContent.trim()) {
      setMessage({ type: "error", text: "Please fill in both subject and content" })
      return
    }

    setSendingGroupEmail(true)
    setMessage(null)

    try {
      const response = await fetch("/api/newsletter/send-group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: groupEmailSubject,
          content: groupEmailContent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to send group email" })
        return
      }

      setMessage({ type: "success", text: data.message || "Group email sent successfully!" })
      setGroupEmailSubject("")
      setGroupEmailContent("")
    } catch (error) {
      console.error("Failed to send group email:", error)
      setMessage({ type: "error", text: "An error occurred while sending the email" })
    } finally {
      setSendingGroupEmail(false)
    }
  }

  const handleAddShippingLabel = async (orderId: string, trackingNumber: string, carrier: string, sendEmail: boolean = true) => {
    if (!trackingNumber || trackingNumber.trim() === '') {
      setMessage({ type: "error", text: "Please enter a tracking number" })
      return
    }

    if (!carrier || carrier.trim() === '') {
      setMessage({ type: "error", text: "Please select a carrier" })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/orders/${orderId}/add-shipping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackingNumber: trackingNumber.trim(),
          carrier: carrier.trim(),
          sendEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to add shipping label" })
        return
      }

      // Handle email status
      if (sendEmail) {
        if (data.emailSent === false) {
          // Shipping label added but email failed
          setMessage({ 
            type: "error", 
            text: `Shipping label added successfully, but failed to send email: ${data.emailError || 'Unknown error'}. Please check email configuration.` 
          })
        } else if (data.emailSent === true) {
          // Both succeeded
          setMessage({ type: "success", text: "Shipping label added and email sent successfully!" })
        } else {
          // Email status not in response (shouldn't happen, but handle gracefully)
          setMessage({ type: "success", text: "Shipping label added successfully!" })
        }
      } else {
        // Email not requested
        setMessage({ type: "success", text: "Shipping label added successfully!" })
      }
      
      // Clear editing state
      const newEditingTracking = { ...editingTracking }
      delete newEditingTracking[orderId]
      setEditingTracking(newEditingTracking)
      
      const newEditingCarrier = { ...editingCarrier }
      delete newEditingCarrier[orderId]
      setEditingCarrier(newEditingCarrier)
      
      // Refresh orders
      await fetchOrders()
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while adding shipping label" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to delete order ${orderId}? This action cannot be undone.`)) {
      return
    }

    setSaving(true)
    setMessage(null)

    // Optimistically remove from UI
    const previousOrders = [...orders]
    setOrders(orders.filter(order => order.orderId !== orderId))

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        // Restore orders if deletion failed
        setOrders(previousOrders)
        setMessage({ type: "error", text: data.error || "Failed to delete order" })
        return
      }

      setMessage({ type: "success", text: "Order deleted successfully!" })
      
      // Refresh orders to ensure consistency
      await fetchOrders()
    } catch (error) {
      // Restore orders if deletion failed
      setOrders(previousOrders)
      setMessage({ type: "error", text: "An error occurred while deleting order" })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/admin/auth")
  }

  const handleSyncBlobToLocal = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/sync/blob-to-local", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to sync files" })
        return
      }

      const successCount = data.summary?.succeeded || 0
      const failCount = data.summary?.failed || 0
      
      // Log detailed results to console
      if (data.results) {
        console.log('📋 Sync Results:')
        data.results.forEach((result: any) => {
          if (result.success) {
            console.log(`✓ ${result.file}: Success`)
          } else {
            console.error(`✗ ${result.file}: Failed - ${result.error || 'Unknown error'}`)
          }
        })
      }
      
      if (failCount === 0) {
        setMessage({ type: "success", text: `Successfully synced ${successCount} files from blob storage to local!` })
      } else {
        const failedFiles = data.results?.filter((r: any) => !r.success).map((r: any) => r.file).join(', ') || 'unknown files'
        setMessage({ 
          type: "error", 
          text: `Synced ${successCount} files, ${failCount} failed: ${failedFiles}. Check console for details.` 
        })
      }

      // Refresh all data to show synced content
      await Promise.all([
        fetchSlides(),
        fetchProducts(),
        fetchAboutUs(),
        fetchGallery(),
        fetchFooter(),
        fetchHeader(),
        fetchHowItWorks(),
      ])
    } catch (error: any) {
      setMessage({ type: "error", text: "An error occurred while syncing files" })
      console.error("Sync error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadGraphic = (graphicPath: string, itemTitle: string) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a')
    link.href = graphicPath
    // Extract filename from path or use a default name
    const filename = graphicPath.split('/').pop() || `${itemTitle.replace(/\s+/g, '-').toLowerCase()}-graphic.png`
    link.download = filename
    link.target = '_blank'
    // Append to body, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSlideChange = (index: number, field: keyof Slide, value: string) => {
    const updatedSlides = [...slides]
    updatedSlides[index] = { ...updatedSlides[index], [field]: value }
    setSlides(updatedSlides)
  }

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: Math.max(...slides.map(s => s.id), 0) + 1,
      image: "",
      title: "",
      description: "",
      ctaText: "",
      ctaButton: "",
    }
    setSlides([...slides, newSlide])
  }

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) {
      setMessage({ type: "error", text: "At least one slide is required" })
      return
    }
    const updatedSlides = slides.filter((_, i) => i !== index)
    setSlides(updatedSlides)
  }

  const handleFileUpload = async (type: "slides" | "products" | "about" | "gallery" | "howitworks", index: number, file: File) => {
    const key = `${type}-${index}`
    setUploading({ ...uploading, [key]: true })
    setUploadProgress({ ...uploadProgress, [key]: 0 })
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to upload image" })
        return
      }

      // Update the slide, product, about us, gallery, or how it works with the uploaded image URL
      if (type === "slides") {
        // Use the URL as-is if it's a full URL (http/https), otherwise prepend / for relative paths
        const imageUrl = data.url.startsWith('http') ? data.url : (data.url.startsWith('/') ? data.url : `/${data.url}`)
        handleSlideChange(index, "image", imageUrl)
        console.log('Image uploaded for slide:', index, 'URL:', imageUrl)
      } else if (type === "products") {
        handleProductChange(index, "image", data.url)
      } else if (type === "about") {
        setAboutUs({ ...aboutUs, image: data.url })
      } else if (type === "gallery") {
        const updated = [...galleryData.products]
        updated[index] = { ...updated[index], image: data.url }
        setGalleryData({ ...galleryData, products: updated })
      } else if (type === "howitworks") {
        const updated = [...howItWorks.steps]
        updated[index] = { ...updated[index], image: data.url }
        setHowItWorks({ ...howItWorks, steps: updated })
      }
      setMessage({ type: "success", text: "Image uploaded successfully!" })
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while uploading" })
    } finally {
      setUploading({ ...uploading, [key]: false })
      setUploadProgress({ ...uploadProgress, [key]: 0 })
    }
  }

  const handleFileChange = (type: "slides" | "products" | "about" | "gallery" | "howitworks", index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(type, index, file)
    }
    // Reset input so same file can be selected again
    event.target.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      if (activeTab === "slides") {
        console.log("Saving slides:", slides)
        const response = await fetch("/api/hero-slides", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(slides),
        })

        console.log("Save response status:", response.status, response.statusText)

        let data
        try {
          const text = await response.text()
          console.log("Save response text:", text)
          data = JSON.parse(text)
        } catch (parseError) {
          console.error("Failed to parse response:", parseError)
          setMessage({ type: "error", text: "Failed to save slides: Invalid response from server" })
          setSaving(false)
          return
        }

        if (!response.ok) {
          const errorMsg = data.error || "Failed to save slides"
          const details = data.details ? `: ${data.details}` : ""
          setMessage({ type: "error", text: `${errorMsg}${details}` })
          console.error("Slides save error:", { status: response.status, data })
          setSaving(false)
          return
        }

        console.log("Slides saved successfully:", data)
        const successMsg = data.message || `Slides saved successfully to data/hero-slides.json!`
        setMessage({ type: "success", text: successMsg })
        // Wait longer before refreshing to ensure the file is written to disk
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Refresh slides from API to ensure consistency - add cache busting
        await fetchSlides()
      } else if (activeTab === "products") {
        console.log("Saving products:", { sectionHeading, sectionSubtitle, productsCount: products.length })
        const response = await fetch("/api/best-selling", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            sectionHeading,
            sectionSubtitle,
            products,
          }),
        })

        console.log("Save response status:", response.status, response.statusText)

        let data
        try {
          const text = await response.text()
          console.log("Save response text:", text)
          data = JSON.parse(text)
        } catch (parseError) {
          console.error("Failed to parse response:", parseError)
          setMessage({ type: "error", text: "Failed to save products: Invalid response from server" })
          setSaving(false)
          return
        }

        if (!response.ok) {
          const errorMsg = data.error || "Failed to save products"
          const details = data.details ? `: ${data.details}` : ""
          setMessage({ type: "error", text: `${errorMsg}${details}` })
          console.error("Products save error:", { status: response.status, data })
          setSaving(false)
          return
        }

        console.log("Products saved successfully:", data)
        const successMsg = data.message || `Products saved successfully to data/best-selling.json!`
        setMessage({ type: "success", text: successMsg })
        // Wait longer before refreshing to ensure the file is written to disk
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Refresh products data to show the saved changes - add cache busting
        await fetchProducts()
      } else if (activeTab === "about") {
        console.log("Saving about us:", aboutUs)
        const response = await fetch("/api/about-us", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(aboutUs),
        })

        console.log("Save response status:", response.status, response.statusText)

        let data
        try {
          const text = await response.text()
          console.log("Save response text:", text)
          data = JSON.parse(text)
        } catch (parseError) {
          console.error("Failed to parse response:", parseError)
          setMessage({ type: "error", text: "Failed to save about us data: Invalid response from server" })
          setSaving(false)
          return
        }

        if (!response.ok) {
          const errorMsg = data.error || "Failed to save about us data"
          const details = data.details ? `: ${data.details}` : ""
          setMessage({ type: "error", text: `${errorMsg}${details}` })
          console.error("About Us save error:", { status: response.status, data })
          setSaving(false)
          return
        }

        console.log("About Us saved successfully:", data)
        const successMsg = data.message || `About Us saved successfully to data/about-us.json!`
        setMessage({ type: "success", text: successMsg })
        // Wait longer before refreshing to ensure the file is written to disk
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Refresh about us data to show the saved changes - add cache busting
        await fetchAboutUs()
      } else if (activeTab === "gallery") {
        console.log("Saving gallery:", galleryData)
        const response = await fetch("/api/image-gallery", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(galleryData),
        })

        console.log("Save response status:", response.status, response.statusText)

        let data
        try {
          const text = await response.text()
          console.log("Save response text:", text)
          data = JSON.parse(text)
        } catch (parseError) {
          console.error("Failed to parse response:", parseError)
          setMessage({ type: "error", text: "Failed to save gallery images: Invalid response from server" })
          setSaving(false)
          return
        }

        if (!response.ok) {
          const errorMsg = data.error || "Failed to save gallery images"
          const details = data.details ? `: ${data.details}` : ""
          setMessage({ type: "error", text: `${errorMsg}${details}` })
          console.error("Gallery save error:", { status: response.status, data })
          setSaving(false)
          return
        }

        console.log("Gallery saved successfully:", data)
        const successMsg = data.message || `Gallery saved successfully to data/image-gallery.json!`
        setMessage({ type: "success", text: successMsg })
        // Wait longer before refreshing to ensure the file is written to disk
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Refresh gallery data to show the saved changes - add cache busting
        await fetchGallery()
      } else if (activeTab === "footer") {
        console.log("Saving footer:", footerData)
        console.log("Social media links being saved:", footerData.socialMedia)
        const response = await fetch("/api/footer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(footerData),
        })

        console.log("Save response status:", response.status, response.statusText)

        let data
        try {
          const text = await response.text()
          console.log("Save response text:", text)
          data = JSON.parse(text)
        } catch (parseError) {
          console.error("Failed to parse response:", parseError)
          setMessage({ type: "error", text: "Failed to save footer data: Invalid response from server" })
          setSaving(false)
          return
        }

        if (!response.ok) {
          const errorMsg = data.error || "Failed to save footer data"
          const details = data.details ? `: ${data.details}` : ""
          setMessage({ type: "error", text: `${errorMsg}${details}` })
          console.error("Footer save error:", { status: response.status, data })
          setSaving(false)
          return
        }

        console.log("Footer saved successfully:", data)
        console.log("Saved social media links:", data.data?.socialMedia)
        const successMsg = data.message || `Footer saved successfully to data/footer.json!`
        setMessage({ type: "success", text: successMsg })
        // Wait longer before refreshing to ensure the file is written to disk
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Refresh footer data to show the saved changes - add cache busting
        await fetchFooter()
      } else if (activeTab === "header") {
        // Capture the current state before saving to ensure we have the latest values
        const dataToSave = { ...headerData }
        console.log("Saving header:", dataToSave)
        console.log("Phone number being saved:", dataToSave.topBar.phone)
        console.log("Phone link being saved:", dataToSave.topBar.phoneLink)
        
        const response = await fetch("/api/header", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(dataToSave),
        })

        console.log("Save response status:", response.status, response.statusText)

        let data
        try {
          const text = await response.text()
          console.log("Save response text:", text)
          data = JSON.parse(text)
        } catch (parseError) {
          console.error("Failed to parse response:", parseError)
          setMessage({ type: "error", text: "Failed to save header data: Invalid response from server" })
          setSaving(false)
          return
        }

        if (!response.ok) {
          const errorMsg = data.error || "Failed to save header data"
          const details = data.details ? `: ${data.details}` : ""
          setMessage({ type: "error", text: `${errorMsg}${details}` })
          console.error("Header save error:", { status: response.status, data })
          setSaving(false)
          return
        }

        console.log("Header saved successfully:", data)
        console.log("Saved phone number in response:", data.data?.topBar?.phone)
        const successMsg = data.message || `Header saved successfully to data/header.json!`
        setMessage({ type: "success", text: successMsg })
        
        // Keep the current state - don't refresh immediately
        // The state already has the correct data that the user entered
        // We'll verify the save worked, but won't overwrite the state if verification fails
        console.log("Keeping current state with phone:", dataToSave.topBar.phone)
        
        // Verify the save after a longer delay to ensure file system has flushed
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Verify the save by fetching fresh data with aggressive cache busting
        const verifyTimestamp = Date.now()
        const verifyResponse = await fetch(`/api/header?t=${verifyTimestamp}&v=${Math.random()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        })
        if (verifyResponse.ok) {
          const verifiedData = await verifyResponse.json()
          console.log("Verified header data after save:", verifiedData)
          console.log("Verified phone number:", verifiedData.topBar?.phone)
          console.log("Expected phone number:", dataToSave.topBar.phone)
          
          // Only update if the verified data matches what we saved
          // This prevents overwriting with stale cached data
          if (verifiedData && verifiedData.topBar?.phone === dataToSave.topBar.phone) {
            // Remove chat fields if they exist
            if (verifiedData.topBar) {
              const { chatText, chatLink, ...topBar } = verifiedData.topBar
              verifiedData.topBar = topBar
            }
            setHeaderData(verifiedData)
            console.log("✓ Header data verified and updated")
          } else {
            console.error("✗ Verified data doesn't match saved data - keeping current state")
            console.error("  Expected phone:", dataToSave.topBar.phone)
            console.error("  Got from API:", verifiedData.topBar?.phone)
            console.error("  This suggests the file wasn't saved correctly or is being read from cache")
            // Keep the current state - don't overwrite with stale data
            setMessage({ 
              type: "error", 
              text: `Save completed but verification failed. Phone number may not have been saved. Please check the file or try saving again.` 
            })
          }
        } else {
          console.error("Failed to verify save - response not ok:", verifyResponse.status)
        }
      } else if (activeTab === "howitworks") {
        console.log("Saving how it works:", howItWorks)
        const response = await fetch("/api/how-it-works", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(howItWorks),
        })

        console.log("Save response status:", response.status, response.statusText)

        let data
        try {
          const text = await response.text()
          console.log("Save response text:", text)
          data = JSON.parse(text)
        } catch (parseError) {
          console.error("Failed to parse response:", parseError)
          setMessage({ type: "error", text: "Failed to save how it works data: Invalid response from server" })
          setSaving(false)
          return
        }

        if (!response.ok) {
          const errorMsg = data.error || "Failed to save how it works data"
          const details = data.details ? `: ${data.details}` : ""
          setMessage({ type: "error", text: `${errorMsg}${details}` })
          console.error("How It Works save error:", { status: response.status, data })
          setSaving(false)
          return
        }

        console.log("How It Works saved successfully:", data)
        const successMsg = data.message || `How It Works saved successfully to data/how-it-works.json!`
        setMessage({ type: "success", text: successMsg })
        // Wait longer before refreshing to ensure the file is written to disk
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Refresh how it works data to show the saved changes - add cache busting
        await fetchHowItWorks()
      }
    } catch (error: any) {
      const errorMessage = error?.message || "An error occurred while saving"
      setMessage({ type: "error", text: errorMessage })
      console.error("Save error:", error)
    } finally {
      setSaving(false)
    }
  }

  // Product management functions
  const handleProductChange = (index: number, field: keyof ProductCard, value: string) => {
    const updatedProducts = [...products]
    updatedProducts[index] = { ...updatedProducts[index], [field]: value }
    setProducts(updatedProducts)
  }

  const handleAddProduct = () => {
    const newProduct: ProductCard = {
      id: Math.max(...products.map(p => p.id), 0, 0) + 1,
      image: "",
      title: "",
      description: "",
    }
    setProducts([...products, newProduct])
    // Open edit modal for the new product
    setEditingProductIndex(products.length)
  }

  const handleDeleteProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index)
    setProducts(updatedProducts)
  }

  const handleEditProduct = (index: number) => {
    setEditingProductIndex(index)
  }

  const handleSaveProduct = (updatedProduct: ProductCard) => {
    if (editingProductIndex !== null) {
      const updatedProducts = [...products]
      updatedProducts[editingProductIndex] = updatedProduct
      setProducts(updatedProducts)
    }
    setEditingProductIndex(null)
  }

  const handleProductImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload image')
    }

    return data.url
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  const menuItems = [
    { id: "slides", label: "Hero Slider", icon: Layout },
    { id: "products", label: "Best Selling Products", icon: Star },
    { id: "about", label: "About Us", icon: FileText },
    { id: "gallery", label: "Official Merch", icon: ImageIcon },
    { id: "footer", label: "Footer", icon: FileText },
    { id: "header", label: "Header", icon: FileText },
    { id: "howitworks", label: "How It Works", icon: CheckSquare },
    { id: "orders", label: "Orders", icon: FileText },
    { id: "newsletter", label: "Newsletter", icon: Mail },
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        w-64
        ${sidebarOpen ? 'md:w-64' : 'md:w-20'}
        bg-gray-800 text-white transition-all duration-300 flex flex-col
      `}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center font-bold flex-shrink-0">
              SF
            </div>
            {sidebarOpen && <span className="font-semibold text-sm md:text-base truncate">Scorched Fabrics Admin</span>}
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          {/* Task Section */}
          <div className="mb-6">
            <button
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 hover:bg-gray-700 transition-colors ${
                true ? 'bg-purple-600' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5" />
                {sidebarOpen && <span>Task</span>}
              </div>
              {sidebarOpen && <ChevronRight className="w-4 h-4" />}
            </button>
            {sidebarOpen && (
              <div className="ml-8 mt-1 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any)
                        if (item.id === "orders") fetchOrders()
                        if (item.id === "newsletter") fetchNewsletterSubscriptions()
                        // Close sidebar on mobile after selection
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false)
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors ${
                        activeTab === item.id ? 'text-purple-400' : 'text-gray-300'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${activeTab === item.id ? 'bg-purple-400' : 'bg-transparent'}`} />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-3 md:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-700 rounded-lg z-50 relative"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
              <div className="relative flex-1 min-w-0 max-w-xs md:max-w-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search For..."
                  className="bg-gray-700 text-white placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button className="p-2 hover:bg-gray-700 rounded-lg relative">
                <Bell className="w-5 h-5 text-white" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-lg relative hidden sm:block">
                <MessageCircle className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                {userEmail && (
                  <div className="text-white hidden sm:block">
                    <div className="text-sm font-medium truncate max-w-[100px] md:max-w-none">{userEmail.split('@')[0]}</div>
                    <div className="text-xs text-gray-400">Admin</div>
                  </div>
                )}
                <button className="p-2 hover:bg-gray-700 rounded-lg">
                  <Settings className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 bg-gray-900 p-3 md:p-6 overflow-y-auto">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h1 className="text-xl md:text-2xl font-bold text-white">
                {menuItems.find(m => m.id === activeTab)?.label || "Dashboard"}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  onClick={handleSyncBlobToLocal}
                  disabled={saving}
                  title="Sync all files from blob storage to local files"
                  className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700 text-xs md:text-sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Sync Files</span>
                  <span className="sm:hidden">Sync</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700 text-xs md:text-sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Out</span>
                </Button>
              </div>
            </div>

            {message && (
              <div
                className={`mb-6 p-4 rounded-md ${
                  message.type === "success" 
                    ? "bg-green-900/30 border border-green-700 text-green-300" 
                    : "bg-red-900/30 border border-red-700 text-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-6">
          {/* Hero Slides Section */}
          {activeTab === "slides" && slides.map((slide, index) => (
            <Card key={slide.id} className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white">Slide {index + 1}</CardTitle>
                    <CardDescription className="text-gray-400">Edit slide content below</CardDescription>
                  </div>
                  {slides.length > 1 && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteSlide(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`image-${index}`}>Background Image</Label>
                    <div className="space-y-2">
                      {/* Image Preview */}
                      {slide.image && (
                        <div className="relative w-full h-48 border rounded-md overflow-hidden bg-gray-100">
                          <img
                            key={`slide-${index}-${slide.image}`}
                            src={
                              // Handle full URLs (including incorrectly stored /https://...)
                              slide.image.startsWith('http') || slide.image.startsWith('/http')
                                ? slide.image.replace(/^\/+/, '') // Remove leading slashes from URLs
                                : slide.image.startsWith('/') 
                                  ? slide.image 
                                  : `/${slide.image}`
                            }
                            alt={`Slide ${index + 1} preview`}
                            className="w-full h-full object-cover"
                            crossOrigin={slide.image.startsWith('http') || slide.image.startsWith('/http') ? "anonymous" : undefined}
                            onError={(e) => {
                              const imgSrc = (e.target as HTMLImageElement).src;
                              console.error('Image failed to load:', {
                                originalPath: slide.image,
                                resolvedSrc: imgSrc,
                                slideIndex: index
                              });
                              const target = e.target as HTMLImageElement;
                              const parent = target.parentElement;
                              if (parent) {
                                target.style.display = 'none';
                                // Remove existing error message if any
                                const existingError = parent.querySelector('.image-error-message');
                                if (!existingError) {
                                  // Show error message
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'absolute inset-0 flex items-center justify-center text-red-500 text-sm image-error-message';
                                  errorDiv.textContent = `Failed to load: ${slide.image}`;
                                  parent.appendChild(errorDiv);
                                }
                              }
                            }}
                            onLoad={(e) => {
                              console.log('Image loaded successfully:', {
                                originalPath: slide.image,
                                resolvedSrc: (e.target as HTMLImageElement).src,
                                slideIndex: index
                              });
                              // Remove error message if image loads successfully
                              const target = e.target as HTMLImageElement;
                              const parent = target.parentElement;
                              if (parent) {
                                const errorMsg = parent.querySelector('.image-error-message');
                                if (errorMsg) {
                                  errorMsg.remove();
                                }
                              }
                            }}
                          />
                          <button
                            onClick={() => handleSlideChange(index, "image", "")}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                            type="button"
                            aria-label="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      {/* Upload Button */}
                      <div className="flex gap-2">
                        <label
                          htmlFor={`file-upload-slide-${index}`}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                            uploading[`slides-${index}`]
                              ? "border-blue-400 bg-blue-50"
                              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                          }`}
                        >
                          <Upload className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {uploading[`slides-${index}`] ? "Uploading..." : "Upload Image"}
                          </span>
                          <input
                            id={`file-upload-slide-${index}`}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            onChange={(e) => handleFileChange("slides", index, e)}
                            disabled={uploading[`slides-${index}`]}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* URL Input */}
                      <div className="relative">
                        <Input
                          id={`image-${index}`}
                          value={slide.image}
                          onChange={(e) => handleSlideChange(index, "image", e.target.value)}
                          placeholder="Or enter image URL (https://example.com/image.jpg)"
                          disabled={uploading[`slides-${index}`]}
                        />
                        {slide.image && (
                          <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Upload an image (max 10MB) or paste an image URL
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`title-${index}`}>Title</Label>
                    <Input
                      id={`title-${index}`}
                      value={slide.title}
                      onChange={(e) => handleSlideChange(index, "title", e.target.value)}
                      placeholder="Slide title"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Textarea
                    id={`description-${index}`}
                    value={slide.description}
                    onChange={(e) => handleSlideChange(index, "description", e.target.value)}
                    placeholder="Slide description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ctaText-${index}`}>CTA Text (separate features with •)</Label>
                  <Input
                    id={`ctaText-${index}`}
                    value={slide.ctaText}
                    onChange={(e) => handleSlideChange(index, "ctaText", e.target.value)}
                    placeholder="Feature 1 • Feature 2 • Feature 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ctaButton-${index}`}>CTA Button Text</Label>
                  <Input
                    id={`ctaButton-${index}`}
                    value={slide.ctaButton}
                    onChange={(e) => handleSlideChange(index, "ctaButton", e.target.value)}
                    placeholder="Button text"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {activeTab === "slides" && (
            <div className="flex gap-4">
              <Button onClick={handleAddSlide} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add New Slide
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save All Changes"}
              </Button>
            </div>
          )}

          {/* Best Selling Products Section */}
          {activeTab === "products" && (
            <>
              {/* Section Heading & Subtitle Editor */}
              <Card className="mb-6 bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Section Header Content</CardTitle>
                  <CardDescription className="text-gray-400">Edit the section heading and subtitle displayed at the top of the Best Selling Products section</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="section-heading">Section Heading</Label>
                    <Input
                      id="section-heading"
                      value={sectionHeading}
                      onChange={(e) => setSectionHeading(e.target.value)}
                      placeholder="OUR BEST-SELLING SHIRTS. JUMP RIGHT IN."
                    />
                    <p className="text-xs text-gray-500">
                      The word "BEST-SELLING" will be automatically highlighted in blue
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section-subtitle">Section Subtitle</Label>
                    <Input
                      id="section-subtitle"
                      value={sectionSubtitle}
                      onChange={(e) => setSectionSubtitle(e.target.value)}
                      placeholder="Get started with one of our best-selling favorites."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Product Cards */}
              {products.map((product, index) => (
                <Card key={product.id} className="bg-gray-800 border-gray-700 text-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">Product Card {index + 1}</CardTitle>
                        <CardDescription className="text-gray-400">Product: {product.title || "Untitled"}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditProduct(index)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteProduct(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Image Preview */}
                      {product.image ? (
                        <div className="relative w-full h-32 md:h-40 border rounded-md overflow-hidden bg-gray-100">
                          <img
                            key={`product-${index}-${product.image}`}
                            src={product.image.startsWith('http') ? product.image : product.image.startsWith('/') ? product.image : `/${product.image}`}
                            alt={product.title || "Product preview"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', product.image);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // Show error message
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'absolute inset-0 flex items-center justify-center text-red-500 text-sm';
                              errorDiv.textContent = 'Failed to load image';
                              target.parentElement?.appendChild(errorDiv);
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', product.image);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 md:h-40 border-2 border-dashed rounded-md bg-gray-50 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No image</span>
                        </div>
                      )}
                      {/* Product Info */}
                      <div className="md:col-span-2 space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Title</p>
                          <p className="text-lg font-semibold">{product.title || "Untitled"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Description</p>
                          <p className="text-sm text-gray-700">{product.description || "No description"}</p>
                        </div>
                        {product.price !== undefined && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Price</p>
                            <p className="text-lg font-semibold">${product.price.toFixed(2)}</p>
                          </div>
                        )}
                        {product.graphic && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-2">Graphic/Logo</p>
                            <div className="relative w-full h-24 border rounded-md overflow-hidden bg-gray-50">
                              <img
                                key={`product-graphic-${index}-${product.graphic}`}
                                src={product.graphic.startsWith('http') ? product.graphic : product.graphic.startsWith('/') ? product.graphic : `/${product.graphic}`}
                                alt="Product graphic/logo"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  console.error('Graphic image failed to load:', product.graphic);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {activeTab === "products" && (
            <>
              <div className="flex gap-4">
                <Button onClick={handleAddProduct} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product Card
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save All Changes"}
                </Button>
              </div>
              {/* Product Edit Modal */}
              {editingProductIndex !== null && products[editingProductIndex] && (
                <ProductEditModal
                  isOpen={true}
                  onClose={() => setEditingProductIndex(null)}
                  product={products[editingProductIndex]}
                  onSave={handleSaveProduct}
                  onImageUpload={handleProductImageUpload}
                />
              )}
            </>
          )}

          {/* About Us Section */}
          {activeTab === "about" && (
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle className="text-white">About Us Section</CardTitle>
                <CardDescription className="text-gray-400">Edit the About Us section content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="about-heading">Heading</Label>
                  <Input
                    id="about-heading"
                    value={aboutUs.heading}
                    onChange={(e) => setAboutUs({ ...aboutUs, heading: e.target.value })}
                    placeholder="ABOUT US"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="about-icon1">Icon Type (pen or shirt)</Label>
                      <Input
                        id="about-icon1"
                        value={aboutUs.paragraph1.icon}
                        onChange={(e) => setAboutUs({ 
                          ...aboutUs, 
                          paragraph1: { ...aboutUs.paragraph1, icon: e.target.value }
                        })}
                        placeholder="pen"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="about-text1">Paragraph 1 Text</Label>
                      <Textarea
                        id="about-text1"
                        value={aboutUs.paragraph1.text}
                        onChange={(e) => setAboutUs({ 
                          ...aboutUs, 
                          paragraph1: { ...aboutUs.paragraph1, text: e.target.value }
                        })}
                        placeholder="Paragraph 1 text"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="about-icon2">Icon Type (pen or shirt)</Label>
                      <Input
                        id="about-icon2"
                        value={aboutUs.paragraph2.icon}
                        onChange={(e) => setAboutUs({ 
                          ...aboutUs, 
                          paragraph2: { ...aboutUs.paragraph2, icon: e.target.value }
                        })}
                        placeholder="shirt"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="about-text2">Paragraph 2 Text</Label>
                      <Textarea
                        id="about-text2"
                        value={aboutUs.paragraph2.text}
                        onChange={(e) => setAboutUs({ 
                          ...aboutUs, 
                          paragraph2: { ...aboutUs.paragraph2, text: e.target.value }
                        })}
                        placeholder="Paragraph 2 text"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="about-button1-text">Button 1 Text</Label>
                    <Input
                      id="about-button1-text"
                      value={aboutUs.button1.text}
                      onChange={(e) => setAboutUs({ 
                        ...aboutUs, 
                        button1: { ...aboutUs.button1, text: e.target.value }
                      })}
                      placeholder="Create Now"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="about-button1-link">Button 1 Link</Label>
                    <Input
                      id="about-button1-link"
                      value={aboutUs.button1.link}
                      onChange={(e) => setAboutUs({ 
                        ...aboutUs, 
                        button1: { ...aboutUs.button1, link: e.target.value }
                      })}
                      placeholder="#"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="about-button2-text">Button 2 Text</Label>
                    <Input
                      id="about-button2-text"
                      value={aboutUs.button2.text}
                      onChange={(e) => setAboutUs({ 
                        ...aboutUs, 
                        button2: { ...aboutUs.button2, text: e.target.value }
                      })}
                      placeholder="Shop Now"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="about-button2-link">Button 2 Link</Label>
                    <Input
                      id="about-button2-link"
                      value={aboutUs.button2.link}
                      onChange={(e) => setAboutUs({ 
                        ...aboutUs, 
                        button2: { ...aboutUs.button2, link: e.target.value }
                      })}
                      placeholder="#"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about-image">Section Image</Label>
                  <div className="space-y-2">
                    {/* Image Preview */}
                    {aboutUs.image && (
                      <div className="relative w-full h-48 border rounded-md overflow-hidden bg-gray-100">
                        <img
                          key={`about-${aboutUs.image}`}
                          src={aboutUs.image.startsWith('http') ? aboutUs.image : aboutUs.image.startsWith('/') ? aboutUs.image : `/${aboutUs.image}`}
                          alt="About Us preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image failed to load:', aboutUs.image);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show error message
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'absolute inset-0 flex items-center justify-center text-red-500 text-sm';
                            errorDiv.textContent = 'Failed to load image';
                            target.parentElement?.appendChild(errorDiv);
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', aboutUs.image);
                          }}
                        />
                        <button
                          onClick={() => setAboutUs({ ...aboutUs, image: "" })}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                          type="button"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="flex gap-2">
                      <label
                        htmlFor="file-upload-about"
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                          uploading["about"]
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                        }`}
                      >
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {uploading["about"] ? "Uploading..." : "Upload Image"}
                        </span>
                        <input
                          id="file-upload-about"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={(e) => handleFileChange("about", 0, e)}
                          disabled={uploading["about"]}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* URL Input */}
                    <div className="relative">
                      <Input
                        id="about-image"
                        value={aboutUs.image}
                        onChange={(e) => setAboutUs({ ...aboutUs, image: e.target.value })}
                        placeholder="Or enter image URL (https://example.com/image.jpg)"
                        disabled={uploading["about"]}
                      />
                      {aboutUs.image && (
                        <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Upload an image (max 10MB) or paste an image URL
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image Gallery Section */}
          {activeTab === "gallery" && (
            <>
              {/* Section Header */}
              <Card className="mb-6 bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Official Merch Section Header</CardTitle>
                  <CardDescription className="text-gray-400">Edit the section heading</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gallery-heading">Section Heading</Label>
                    <Input
                      id="gallery-heading"
                      value={galleryData.heading}
                      onChange={(e) => setGalleryData({ ...galleryData, heading: e.target.value })}
                      placeholder="Official Merch & Fanart"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Products */}
              {galleryData.products.map((product, index) => (
                <Card key={product.id} className="bg-gray-800 border-gray-700 text-white">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">Product {index + 1}</CardTitle>
                        <CardDescription className="text-gray-400">Edit product content below</CardDescription>
                      </div>
                      {galleryData.products.length > 1 && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            const updated = galleryData.products.filter((_, i) => i !== index)
                            setGalleryData({ ...galleryData, products: updated })
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`gallery-product-type-${index}`}>Product Type</Label>
                        <Input
                          id={`gallery-product-type-${index}`}
                          value={product.productType}
                          onChange={(e) => {
                            const updated = [...galleryData.products]
                            updated[index] = { ...updated[index], productType: e.target.value }
                            setGalleryData({ ...galleryData, products: updated })
                          }}
                          placeholder="Tote Bag"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`gallery-price-${index}`}>Price</Label>
                        <Input
                          id={`gallery-price-${index}`}
                          value={product.price}
                          onChange={(e) => {
                            const updated = [...galleryData.products]
                            updated[index] = { ...updated[index], price: e.target.value }
                            setGalleryData({ ...galleryData, products: updated })
                          }}
                          placeholder="$21.99"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`gallery-description-${index}`}>Description</Label>
                      <Textarea
                        id={`gallery-description-${index}`}
                        value={product.description}
                        onChange={(e) => {
                          const updated = [...galleryData.products]
                          updated[index] = { ...updated[index], description: e.target.value }
                          setGalleryData({ ...galleryData, products: updated })
                        }}
                        placeholder="Product description"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`gallery-image-${index}`}>Product Image</Label>
                      <div className="space-y-2">
                        {/* Image Preview */}
                        {product.image && (
                          <div className="relative w-full h-48 border rounded-md overflow-hidden bg-gray-100">
                            <img
                              key={`gallery-${index}-${product.image}`}
                              src={product.image.startsWith('http') ? product.image : product.image.startsWith('/') ? product.image : `/${product.image}`}
                              alt={product.productType}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Image failed to load:', product.image);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                // Show error message
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'absolute inset-0 flex items-center justify-center text-red-500 text-sm';
                                errorDiv.textContent = 'Failed to load image';
                                target.parentElement?.appendChild(errorDiv);
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully:', product.image);
                              }}
                            />
                            <button
                              onClick={() => {
                                const updated = [...galleryData.products]
                                updated[index] = { ...updated[index], image: "" }
                                setGalleryData({ ...galleryData, products: updated })
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                              type="button"
                              aria-label="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        
                        {/* Upload Button */}
                        <div className="flex gap-2">
                          <label
                            htmlFor={`file-upload-gallery-${index}`}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                              uploading[`gallery-${index}`]
                                ? "border-blue-400 bg-blue-50"
                                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                            }`}
                          >
                            <Upload className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {uploading[`gallery-${index}`] ? "Uploading..." : "Upload Image"}
                            </span>
                            <input
                              id={`file-upload-gallery-${index}`}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                              onChange={(e) => handleFileChange("gallery", index, e)}
                              disabled={uploading[`gallery-${index}`]}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* URL Input */}
                        <div className="relative">
                          <Input
                            id={`gallery-image-${index}`}
                            value={product.image}
                            onChange={(e) => {
                              const updated = [...galleryData.products]
                              updated[index] = { ...updated[index], image: e.target.value }
                              setGalleryData({ ...galleryData, products: updated })
                            }}
                            placeholder="Or enter image URL (https://example.com/image.jpg)"
                            disabled={uploading[`gallery-${index}`]}
                          />
                          {product.image && (
                            <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Upload an image (max 10MB) or paste an image URL
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    const newProduct: GalleryProduct = {
                      id: Math.max(...galleryData.products.map(p => p.id), 0) + 1,
                      image: "",
                      productType: "",
                      description: "",
                      price: ""
                    }
                    setGalleryData({ ...galleryData, products: [...galleryData.products, newProduct] })
                  }}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save All Changes"}
                </Button>
              </div>
            </>
          )}

          {/* Footer Section */}
          {activeTab === "footer" && (
            <div className="space-y-6">
              {/* Contact Information */}
              <Card className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Contact Information</CardTitle>
                  <CardDescription className="text-gray-400">Edit contact details and operating hours</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="footer-contact-heading">Heading</Label>
                    <Input
                      id="footer-contact-heading"
                      value={footerData.contact.heading}
                      onChange={(e) => setFooterData({
                        ...footerData,
                        contact: { ...footerData.contact, heading: e.target.value }
                      })}
                      placeholder="GET IN TOUCH"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="footer-phone">Phone</Label>
                      <Input
                        id="footer-phone"
                        value={footerData.contact.phone}
                        onChange={(e) => setFooterData({
                          ...footerData,
                          contact: { ...footerData.contact, phone: e.target.value }
                        })}
                        placeholder="(866) 440-8237"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer-email">Email</Label>
                      <Input
                        id="footer-email"
                        value={footerData.contact.email}
                        onChange={(e) => setFooterData({
                          ...footerData,
                          contact: { ...footerData.contact, email: e.target.value }
                        })}
                        placeholder="SERVICE@SCORCHEDFABRICS.COM"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="footer-weekdays">Weekdays Hours</Label>
                      <Input
                        id="footer-weekdays"
                        value={footerData.contact.hours.weekdays}
                        onChange={(e) => setFooterData({
                          ...footerData,
                          contact: {
                            ...footerData.contact,
                            hours: { ...footerData.contact.hours, weekdays: e.target.value }
                          }
                        })}
                        placeholder="Mon - Fri, 9am - 8pm Eastern"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer-weekends">Weekends Hours</Label>
                      <Input
                        id="footer-weekends"
                        value={footerData.contact.hours.weekends}
                        onChange={(e) => setFooterData({
                          ...footerData,
                          contact: {
                            ...footerData.contact,
                            hours: { ...footerData.contact.hours, weekends: e.target.value }
                          }
                        })}
                        placeholder="Weekends, 9am - 5pm Eastern"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer-copyright">Copyright Text</Label>
                    <Input
                      id="footer-copyright"
                      value={footerData.copyright}
                      onChange={(e) => setFooterData({ ...footerData, copyright: e.target.value })}
                      placeholder="Scorched Fabrics"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Links */}
              <Card className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Social Media Links</CardTitle>
                      <CardDescription className="text-gray-400">Add or remove social media links</CardDescription>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setFooterData({
                          ...footerData,
                          socialMedia: [
                            ...footerData.socialMedia,
                            { name: "", url: "#", icon: "facebook" }
                          ]
                        })
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Link
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {footerData.socialMedia.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No social media links. Click "Add Link" to add one.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {footerData.socialMedia.map((social, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-base font-semibold">Link {index + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedSocialMedia = footerData.socialMedia.filter((_, i) => i !== index)
                                setFooterData({
                                  ...footerData,
                                  socialMedia: updatedSocialMedia
                                })
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`social-name-${index}`}>Name</Label>
                              <Input
                                id={`social-name-${index}`}
                                value={social.name}
                                onChange={(e) => {
                                  const updatedSocialMedia = [...footerData.socialMedia]
                                  updatedSocialMedia[index] = { ...social, name: e.target.value }
                                  setFooterData({
                                    ...footerData,
                                    socialMedia: updatedSocialMedia
                                  })
                                }}
                                placeholder="Facebook"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`social-url-${index}`}>URL</Label>
                              <Input
                                id={`social-url-${index}`}
                                value={social.url}
                                onChange={(e) => {
                                  const updatedSocialMedia = [...footerData.socialMedia]
                                  updatedSocialMedia[index] = { ...social, url: e.target.value }
                                  setFooterData({
                                    ...footerData,
                                    socialMedia: updatedSocialMedia
                                  })
                                }}
                                placeholder="https://..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`social-icon-${index}`}>Icon</Label>
                              <Input
                                id={`social-icon-${index}`}
                                value={social.icon}
                                onChange={(e) => {
                                  const updatedSocialMedia = [...footerData.socialMedia]
                                  updatedSocialMedia[index] = { ...social, icon: e.target.value }
                                  setFooterData({
                                    ...footerData,
                                    socialMedia: updatedSocialMedia
                                  })
                                }}
                                placeholder="facebook"
                              />
                              <p className="text-xs text-gray-500">
                                Options: facebook, instagram, tiktok, youtube, pinterest, twitter, linkedin, github, mail
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Newsletter Section */}
              <Card className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Newsletter Section</CardTitle>
                  <CardDescription className="text-gray-400">Edit newsletter heading and description</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="footer-newsletter-heading">Newsletter Heading</Label>
                    <Input
                      id="footer-newsletter-heading"
                      value={footerData.newsletter.heading}
                      onChange={(e) => setFooterData({
                        ...footerData,
                        newsletter: { ...footerData.newsletter, heading: e.target.value }
                      })}
                      placeholder="Newsletter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer-newsletter-description">Newsletter Description</Label>
                    <Textarea
                      id="footer-newsletter-description"
                      value={footerData.newsletter.description}
                      onChange={(e) => setFooterData({
                        ...footerData,
                        newsletter: { ...footerData.newsletter, description: e.target.value }
                      })}
                      placeholder="Subscribe to our newsletter to stay updated with the latest news, offers, and exclusive deals."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save All Changes"}
                </Button>
              </div>
            </div>
          )}

          {/* Header Section */}
          {activeTab === "header" && (
            <div className="space-y-6">
              {/* Top Bar */}
              <Card className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Top Bar</CardTitle>
                  <CardDescription className="text-gray-400">Edit top bar contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="header-phone">Phone Number</Label>
                      <Input
                        id="header-phone"
                        value={headerData.topBar.phone}
                        onChange={(e) => setHeaderData({
                          ...headerData,
                          topBar: { ...headerData.topBar, phone: e.target.value }
                        })}
                        placeholder="1-866-440-8237"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="header-phone-link">Phone Link</Label>
                      <Input
                        id="header-phone-link"
                        value={headerData.topBar.phoneLink}
                        onChange={(e) => setHeaderData({
                          ...headerData,
                          topBar: { ...headerData.topBar, phoneLink: e.target.value }
                        })}
                        placeholder="tel:1-866-440-8237"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Logo */}
              <Card className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Logo</CardTitle>
                  <CardDescription className="text-gray-400">Edit logo settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="header-logo-src">Logo Image Path</Label>
                      <Input
                        id="header-logo-src"
                        value={headerData.logo.src}
                        onChange={(e) => setHeaderData({
                          ...headerData,
                          logo: { ...headerData.logo, src: e.target.value }
                        })}
                        placeholder="/logo-v9.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="header-logo-alt">Logo Alt Text</Label>
                      <Input
                        id="header-logo-alt"
                        value={headerData.logo.alt}
                        onChange={(e) => setHeaderData({
                          ...headerData,
                          logo: { ...headerData.logo, alt: e.target.value }
                        })}
                        placeholder="Logo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="header-logo-width">Logo Width</Label>
                      <Input
                        id="header-logo-width"
                        type="number"
                        value={headerData.logo.width}
                        onChange={(e) => setHeaderData({
                          ...headerData,
                          logo: { ...headerData.logo, width: parseInt(e.target.value) || 150 }
                        })}
                        placeholder="150"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="header-logo-height">Logo Height</Label>
                      <Input
                        id="header-logo-height"
                        type="number"
                        value={headerData.logo.height}
                        onChange={(e) => setHeaderData({
                          ...headerData,
                          logo: { ...headerData.logo, height: parseInt(e.target.value) || 40 }
                        })}
                        placeholder="40"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Links */}
              <Card className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">Navigation Links</CardTitle>
                      <CardDescription className="text-gray-400">Edit navigation menu links</CardDescription>
                    </div>
                    <Button
                      onClick={() => setHeaderData({
                        ...headerData,
                        navigationLinks: [...headerData.navigationLinks, { text: "", url: "#" }]
                      })}
                      variant="outline"
                      size="icon"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {headerData.navigationLinks.map((link, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`nav-link-text-${index}`}>Link Text</Label>
                          <Input
                            id={`nav-link-text-${index}`}
                            value={link.text}
                            onChange={(e) => {
                              const updated = [...headerData.navigationLinks]
                              updated[index] = { ...updated[index], text: e.target.value }
                              setHeaderData({ ...headerData, navigationLinks: updated })
                            }}
                            placeholder="Link text"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`nav-link-url-${index}`}>URL</Label>
                          <Input
                            id={`nav-link-url-${index}`}
                            value={link.url}
                            onChange={(e) => {
                              const updated = [...headerData.navigationLinks]
                              updated[index] = { ...updated[index], url: e.target.value }
                              setHeaderData({ ...headerData, navigationLinks: updated })
                            }}
                            placeholder="#"
                          />
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          const updated = headerData.navigationLinks.filter((_, i) => i !== index)
                          setHeaderData({ ...headerData, navigationLinks: updated })
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* CTA Button */}
              <Card className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Call-to-Action Button</CardTitle>
                  <CardDescription className="text-gray-400">Edit the main CTA button</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="header-cta-text">Button Text</Label>
                      <Input
                        id="header-cta-text"
                        value={headerData.ctaButton.text}
                        onChange={(e) => setHeaderData({
                          ...headerData,
                          ctaButton: { ...headerData.ctaButton, text: e.target.value }
                        })}
                        placeholder="Create Your Shirt"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="header-cta-url">Button URL</Label>
                      <Input
                        id="header-cta-url"
                        value={headerData.ctaButton.url}
                        onChange={(e) => setHeaderData({
                          ...headerData,
                          ctaButton: { ...headerData.ctaButton, url: e.target.value }
                        })}
                        placeholder="#"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save All Changes"}
                </Button>
              </div>
            </div>
          )}

          {/* How It Works Section */}
          {activeTab === "howitworks" && (
            <div className="space-y-6">
              {/* Section Header */}
              <Card className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-white">How It Works Section Header</CardTitle>
                  <CardDescription className="text-gray-400">Edit the section heading and subtitle</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="howitworks-heading">Heading</Label>
                    <Input
                      id="howitworks-heading"
                      value={howItWorks.heading}
                      onChange={(e) => setHowItWorks({ ...howItWorks, heading: e.target.value })}
                      placeholder="HOW IT WORKS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="howitworks-subtitle">Subtitle</Label>
                    <Input
                      id="howitworks-subtitle"
                      value={howItWorks.subtitle}
                      onChange={(e) => setHowItWorks({ ...howItWorks, subtitle: e.target.value })}
                      placeholder="Easily create custom t-shirts, hoodies, polos, hats & more online."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Steps */}
              {howItWorks.steps.map((step, index) => (
                <Card key={step.id} className="bg-gray-800 border-gray-700 text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Step {index + 1}: {step.title || "Untitled"}</CardTitle>
                    <CardDescription className="text-gray-400">Edit step content below</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`howitworks-step-image-${index}`}>Step Image</Label>
                        <div className="space-y-2">
                          {/* Image Preview */}
                          {step.image && (
                            <div className="relative w-full h-48 border rounded-md overflow-hidden bg-gray-100">
                              <img
                                key={`howitworks-${index}-${step.image}`}
                                src={step.image.startsWith('http') ? step.image : step.image.startsWith('/') ? step.image : `/${step.image}`}
                                alt={`Step ${index + 1} preview`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Image failed to load:', step.image);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  // Show error message
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'absolute inset-0 flex items-center justify-center text-red-500 text-sm';
                                  errorDiv.textContent = 'Failed to load image';
                                  target.parentElement?.appendChild(errorDiv);
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully:', step.image);
                                }}
                              />
                              <button
                                onClick={() => {
                                  const updated = [...howItWorks.steps]
                                  updated[index] = { ...updated[index], image: "" }
                                  setHowItWorks({ ...howItWorks, steps: updated })
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                                type="button"
                                aria-label="Remove image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          
                          {/* Upload Button */}
                          <div className="flex gap-2">
                            <label
                              htmlFor={`file-upload-howitworks-${index}`}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                                uploading[`howitworks-${index}`]
                                  ? "border-blue-400 bg-blue-50"
                                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                              }`}
                            >
                              <Upload className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {uploading[`howitworks-${index}`] ? "Uploading..." : "Upload Image"}
                              </span>
                              <input
                                id={`file-upload-howitworks-${index}`}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                onChange={(e) => handleFileChange("howitworks", index, e)}
                                disabled={uploading[`howitworks-${index}`]}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* URL Input */}
                          <div className="relative">
                            <Input
                              id={`howitworks-step-image-${index}`}
                              value={step.image}
                              onChange={(e) => {
                                const updated = [...howItWorks.steps]
                                updated[index] = { ...updated[index], image: e.target.value }
                                setHowItWorks({ ...howItWorks, steps: updated })
                              }}
                              placeholder="Or enter image URL (https://example.com/image.jpg)"
                              disabled={uploading[`howitworks-${index}`]}
                            />
                            {step.image && (
                              <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Upload an image (max 10MB) or paste an image URL
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`howitworks-step-title-${index}`}>Step Title</Label>
                        <Input
                          id={`howitworks-step-title-${index}`}
                          value={step.title}
                          onChange={(e) => {
                            const updated = [...howItWorks.steps]
                            updated[index] = { ...updated[index], title: e.target.value }
                            setHowItWorks({ ...howItWorks, steps: updated })
                          }}
                          placeholder="Design Online"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`howitworks-step-description-${index}`}>Step Description</Label>
                      <Textarea
                        id={`howitworks-step-description-${index}`}
                        value={step.description}
                        onChange={(e) => {
                          const updated = [...howItWorks.steps]
                          updated[index] = { ...updated[index], description: e.target.value }
                          setHowItWorks({ ...howItWorks, steps: updated })
                        }}
                        placeholder="We've made it super easy to create your custom shirts with our Design Studio..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Button Settings */}
              <Card className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Call-to-Action Button</CardTitle>
                  <CardDescription className="text-gray-400">Edit the CTA button at the bottom of the section</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="howitworks-button-text">Button Text</Label>
                      <Input
                        id="howitworks-button-text"
                        value={howItWorks.buttonText}
                        onChange={(e) => setHowItWorks({ ...howItWorks, buttonText: e.target.value })}
                        placeholder="Get Started"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="howitworks-button-link">Button Link</Label>
                      <Input
                        id="howitworks-button-link"
                        value={howItWorks.buttonLink}
                        onChange={(e) => setHowItWorks({ ...howItWorks, buttonLink: e.target.value })}
                        placeholder="#"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save All Changes"}
                </Button>
              </div>
            </div>
          )}

          {/* Orders Section */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Orders to Process</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage orders and add shipping labels. Orders with status "pending" or "processing" need to be processed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No orders found</div>
                  ) : (
                    <div className="space-y-4">
                      {orders
                        .filter((order) => order.status === 'pending' || order.status === 'processing')
                        .map((order) => (
                          <Card key={order.orderId} className="border-l-4 border-l-yellow-500 bg-gray-800 border-gray-700 text-white">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">
                                    {order.orderType === 'merch' ? 'Merch Order' : 'Custom Order'} - {order.orderId}
                                  </CardTitle>
                                  <CardDescription className="mt-1">
                                    {order.customer.firstName} {order.customer.lastName} • {order.customer.email}
                                  </CardDescription>
                                </div>
                                <div className="text-right flex items-start gap-2">
                                  <div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      order.status === 'pending' 
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {order.status.toUpperCase()}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      ${order.total.toFixed(2)}
                                    </div>
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDeleteOrder(order.orderId)}
                                    disabled={saving}
                                    className="h-8 w-8"
                                    title="Delete order"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Order Items</h4>
                                <div className="space-y-2">
                                  {order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                                      {item.image && (
                                        <img
                                          src={item.image}
                                          alt={item.title}
                                          className="w-12 h-12 object-cover rounded"
                                        />
                                      )}
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{item.title}</p>
                                        <p className="text-xs text-gray-600">{item.description}</p>
                                        <p className="text-xs text-gray-500">
                                          Qty: {item.quantity} • ${item.price.toFixed(2)} each
                                          {item.size && ` • Size: ${item.size}`}
                                          {item.color && ` • Color: ${item.color}`}
                                          {item.graphic && ` • Custom Graphic/Logo`}
                                        </p>
                                      </div>
                                      {item.graphic && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDownloadGraphic(item.graphic, item.title)}
                                          className="h-8"
                                          title="Download graphic/logo"
                                        >
                                          <Download className="w-4 h-4 mr-1" />
                                          Download Graphic
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Shipping Address</h4>
                                  <p className="text-sm text-gray-700">
                                    {order.customer.address}<br />
                                    {order.customer.city}, {order.customer.state} {order.customer.zipCode}<br />
                                    {order.customer.country}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Order Date</h4>
                                  <p className="text-sm text-gray-700">
                                    {new Date(order.orderDate).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Add Shipping Label</h4>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <Label htmlFor={`carrier-${order.orderId}`} className="text-sm font-medium mb-1 block">
                                        Carrier
                                      </Label>
                                      <select
                                        id={`carrier-${order.orderId}`}
                                        value={editingCarrier[order.orderId] || ''}
                                        onChange={(e) => setEditingCarrier({
                                          ...editingCarrier,
                                          [order.orderId]: e.target.value
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                                      >
                                        <option value="">Select carrier...</option>
                                        <option value="USPS">USPS</option>
                                        <option value="UPS">UPS</option>
                                        <option value="FedEx">FedEx</option>
                                        <option value="DHL">DHL</option>
                                        <option value="Other">Other</option>
                                      </select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`tracking-${order.orderId}`} className="text-sm font-medium mb-1 block">
                                        Tracking Number
                                      </Label>
                                      <Input
                                        id={`tracking-${order.orderId}`}
                                        placeholder="Enter tracking number"
                                        value={editingTracking[order.orderId] || ''}
                                        onChange={(e) => setEditingTracking({
                                          ...editingTracking,
                                          [order.orderId]: e.target.value
                                        })}
                                        className="w-full"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleAddShippingLabel(
                                        order.orderId,
                                        editingTracking[order.orderId] || '',
                                        editingCarrier[order.orderId] || 'Other',
                                        true
                                      )}
                                      disabled={saving || !editingTracking[order.orderId]?.trim() || !editingCarrier[order.orderId]?.trim()}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {saving ? "Adding..." : "Add & Send Email"}
                                    </Button>
                                    <Button
                                      onClick={() => handleAddShippingLabel(
                                        order.orderId,
                                        editingTracking[order.orderId] || '',
                                        editingCarrier[order.orderId] || 'Other',
                                        false
                                      )}
                                      disabled={saving || !editingTracking[order.orderId]?.trim() || !editingCarrier[order.orderId]?.trim()}
                                      variant="outline"
                                    >
                                      Add Only
                                    </Button>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    Adding a shipping label will mark the order as "shipped" and optionally send a notification email to the customer with tracking information.
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      
                      {orders.filter((order) => order.status === 'pending' || order.status === 'processing').length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No orders need processing. All orders have been shipped or are in other statuses.
                        </div>
                      )}

                      {/* Show shipped orders in a collapsible section */}
                      {orders.filter((order) => order.status === 'shipped' || order.status === 'delivered').length > 0 && (
                        <details className="mt-8" open>
                          <summary className="cursor-pointer text-lg font-semibold text-gray-700 mb-4">
                            Shipped Orders ({orders.filter((order) => order.status === 'shipped' || order.status === 'delivered').length})
                          </summary>
                          <div className="space-y-4 mt-4">
                            {orders
                              .filter((order) => order.status === 'shipped' || order.status === 'delivered')
                              .map((order) => {
                                const isExpanded = expandedShippedOrders[order.orderId] || false
                                return (
                                  <Card key={order.orderId} className="border-l-4 border-l-green-500 bg-gray-800 border-gray-700 text-white">
                                    <CardHeader>
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <CardTitle className="text-lg">
                                              {order.orderType === 'merch' ? 'Merch Order' : 'Custom Order'} - {order.orderId}
                                            </CardTitle>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => setExpandedShippedOrders({
                                                ...expandedShippedOrders,
                                                [order.orderId]: !isExpanded
                                              })}
                                              className="h-8 w-8"
                                              title={isExpanded ? "Collapse details" : "Expand details"}
                                            >
                                              {isExpanded ? (
                                                <ChevronUp className="w-4 h-4" />
                                              ) : (
                                                <ChevronDown className="w-4 h-4" />
                                              )}
                                            </Button>
                                          </div>
                                          <CardDescription className="mt-1">
                                            {order.customer.firstName} {order.customer.lastName} • {order.customer.email}
                                          </CardDescription>
                                        </div>
                                        <div className="text-right flex items-start gap-2">
                                          <div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                              order.status === 'shipped' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {order.status.toUpperCase()}
                                            </div>
                                            {order.trackingNumber && (
                                              <div className="text-sm text-gray-700 mt-2 space-y-1">
                                                {order.carrier && (
                                                  <div>
                                                    <strong>Carrier:</strong> {order.carrier}
                                                  </div>
                                                )}
                                                <div>
                                                  <strong>Tracking:</strong> {order.trackingNumber}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleDeleteOrder(order.orderId)}
                                            disabled={saving}
                                            className="h-8 w-8"
                                            title="Delete order"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    {isExpanded && (
                                      <CardContent className="space-y-4">
                                        <div>
                                          <h4 className="font-semibold mb-2">Order Items</h4>
                                          <div className="space-y-2">
                                            {order.items.map((item: any, idx: number) => (
                                              <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                                                {item.image && (
                                                  <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-12 h-12 object-cover rounded"
                                                  />
                                                )}
                                                <div className="flex-1">
                                                  <p className="font-medium text-sm">{item.title}</p>
                                                  <p className="text-xs text-gray-600">{item.description}</p>
                                                  <p className="text-xs text-gray-500">
                                                    Qty: {item.quantity} • ${item.price.toFixed(2)} each
                                                    {item.size && ` • Size: ${item.size}`}
                                                    {item.color && ` • Color: ${item.color}`}
                                                    {item.graphic && ` • Custom Graphic/Logo`}
                                                  </p>
                                                </div>
                                                {item.graphic && (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownloadGraphic(item.graphic, item.title)}
                                                    className="h-8"
                                                    title="Download graphic/logo"
                                                  >
                                                    <Download className="w-4 h-4 mr-1" />
                                                    Download Graphic
                                                  </Button>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                            <h4 className="font-semibold mb-2">Shipping Address</h4>
                                            <p className="text-sm text-gray-700">
                                              {order.customer.firstName} {order.customer.lastName}<br />
                                              {order.customer.address}<br />
                                              {order.customer.city}, {order.customer.state} {order.customer.zipCode}<br />
                                              {order.customer.country}
                                              {order.customer.phone && <><br />Phone: {order.customer.phone}</>}
                                              {order.customer.notes && <><br /><br /><strong>Notes:</strong><br />{order.customer.notes}</>}
                                            </p>
                                          </div>
                                          <div>
                                            <h4 className="font-semibold mb-2">Order Information</h4>
                                            <p className="text-sm text-gray-700 space-y-1">
                                              <div>
                                                <strong>Order Date:</strong><br />
                                                {new Date(order.orderDate).toLocaleDateString('en-US', {
                                                  year: 'numeric',
                                                  month: 'long',
                                                  day: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit'
                                                })}
                                              </div>
                                              {order.shippedDate && (
                                                <div className="mt-2">
                                                  <strong>Shipped Date:</strong><br />
                                                  {new Date(order.shippedDate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  })}
                                                </div>
                                              )}
                                              <div className="mt-2">
                                                <strong>Total:</strong> ${order.total.toFixed(2)}
                                              </div>
                                            </p>
                                          </div>
                                        </div>

                                        {order.trackingNumber && (
                                          <div className="border-t pt-4">
                                            <h4 className="font-semibold mb-2">Shipping Information</h4>
                                            <div className="text-sm text-gray-700 space-y-1">
                                              {order.carrier && (
                                                <div>
                                                  <strong>Carrier:</strong> {order.carrier}
                                                </div>
                                              )}
                                              <div>
                                                <strong>Tracking Number:</strong> {order.trackingNumber}
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        <div className="border-t pt-4">
                                          <Button
                                            variant="outline"
                                            onClick={() => window.print()}
                                            className="w-full sm:w-auto"
                                          >
                                            <Printer className="w-4 h-4 mr-2" />
                                            Print Order Details
                                          </Button>
                                        </div>
                                      </CardContent>
                                    )}
                                  </Card>
                                )
                              })}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Newsletter Section */}
          {activeTab === "newsletter" && (
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Newsletter Subscribers</CardTitle>
                  <CardDescription className="text-gray-400">
                    View all newsletter subscribers and send group emails.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {newsletterLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading subscribers...</div>
                  ) : newsletterSubscriptions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No subscribers found</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-purple-300 font-semibold">
                          <Mail className="w-5 h-5" />
                          <span>Total Subscribers: {newsletterSubscriptions.length}</span>
                        </div>
                      </div>
                      <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <div className="max-h-96 overflow-y-auto overflow-x-auto">
                          <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-700 sticky top-0">
                              <tr>
                                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subscribed Date</th>
                                <th className="px-2 md:px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                              {newsletterSubscriptions.map((subscription, index) => (
                                <tr key={index} className="hover:bg-gray-700">
                                  <td className="px-2 md:px-4 py-3 text-sm font-medium text-white break-words">
                                    {subscription.email}
                                  </td>
                                  <td className="px-2 md:px-4 py-3 text-sm text-gray-400">
                                    {new Date(subscription.subscribedAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </td>
                                  <td className="px-2 md:px-4 py-3 text-right text-sm font-medium">
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => handleDeleteSubscription(subscription.email)}
                                      disabled={saving}
                                      className="h-8 w-8"
                                      title="Remove email from list"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Send Group Email</CardTitle>
                  <CardDescription className="text-gray-400">
                    Send an email to all newsletter subscribers at once.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="group-email-recipients" className="text-sm font-medium mb-2 block">
                        Recipients ({newsletterSubscriptions.length} subscriber{newsletterSubscriptions.length !== 1 ? 's' : ''})
                      </Label>
                      <div className="relative">
                        <Textarea
                          id="group-email-recipients"
                          value={newsletterSubscriptions.map(sub => sub.email).join(", ")}
                          readOnly
                          rows={3}
                          className="w-full pr-10 bg-gray-50 font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCopyEmails}
                          className="absolute top-2 right-2 h-8 w-8"
                          title="Copy all emails"
                        >
                          {copiedEmails ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        All subscriber emails are automatically included. Click the copy button to copy all emails.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="group-email-subject" className="text-sm font-medium mb-2 block">
                        Subject
                      </Label>
                      <Input
                        id="group-email-subject"
                        placeholder="Enter email subject"
                        value={groupEmailSubject}
                        onChange={(e) => setGroupEmailSubject(e.target.value)}
                        disabled={sendingGroupEmail}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="group-email-content" className="text-sm font-medium mb-2 block">
                        Content (HTML allowed)
                      </Label>
                      <Textarea
                        id="group-email-content"
                        placeholder="Enter email content. HTML code is supported (e.g., &lt;h1&gt;Title&lt;/h1&gt;, &lt;p&gt;Paragraph&lt;/p&gt;, &lt;strong&gt;Bold&lt;/strong&gt;)."
                        value={groupEmailContent}
                        onChange={(e) => setGroupEmailContent(e.target.value)}
                        disabled={sendingGroupEmail}
                        rows={15}
                        className="w-full font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        You can enter HTML code directly. The HTML will be included in the email. Example: &lt;p&gt;Hello &lt;strong&gt;world&lt;/strong&gt;!&lt;/p&gt;
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSendGroupEmail}
                        disabled={sendingGroupEmail || !groupEmailSubject.trim() || !groupEmailContent.trim() || newsletterSubscriptions.length === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {sendingGroupEmail ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send to {newsletterSubscriptions.length} Subscriber{newsletterSubscriptions.length !== 1 ? 's' : ''}
                          </>
                        )}
                      </Button>
                    </div>
                    {newsletterSubscriptions.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No subscribers to send emails to. Subscribers will appear here once they subscribe through the newsletter form.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}
