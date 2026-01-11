"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Facebook, Instagram, Music2, Youtube, Twitter, Linkedin, Github, Mail } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface FooterLink {
  text: string
  url: string
}

interface SocialMediaLink {
  name: string
  url: string
  icon: string
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

const defaultData: FooterData = {
  contact: {
    heading: "GET IN TOUCH",
    phone: "(866) 440-8237",
    email: "SERVICE@SCORCHEDFABRICS.COM",
    hours: {
      weekdays: "Mon - Fri, 9am - 8pm Eastern",
      weekends: "Weekends, 9am - 5pm Eastern"
    }
  },
  navigateLinks: [
    { text: "Custom T-Shirts", url: "#" },
    { text: "Design Studio", url: "#" },
    { text: "Screen Printing", url: "#" },
    { text: "Site Map", url: "#" }
  ],
  companyLinks: [
    { text: "About Us", url: "#" },
    { text: "Work With Us", url: "#" },
    { text: "California Privacy Rights", url: "#" }
  ],
  additionalLinks: [
    { text: "Browse Products", url: "#" },
    { text: "Design Templates", url: "#" },
    { text: "Help", url: "#" },
    { text: "Blog", url: "#" },
    { text: "Privacy Policy", url: "#" }
  ],
  socialMedia: [
    { name: "Facebook", url: "#", icon: "facebook" },
    { name: "Instagram", url: "#", icon: "instagram" },
    { name: "TikTok", url: "#", icon: "tiktok" },
    { name: "YouTube", url: "#", icon: "youtube" },
    { name: "Pinterest", url: "#", icon: "pinterest" }
  ],
  newsletter: {
    heading: "Newsletter",
    description: "Subscribe to our newsletter to stay updated with the latest news, offers, and exclusive deals."
  },
  copyright: "Scorched Fabrics"
}

export default function Footer() {
  const [data, setData] = useState<FooterData>(defaultData)
  const [loading, setLoading] = useState(true)
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [newsletterStatus, setNewsletterStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/footer")
        if (response.ok) {
          const fetchedData = await response.json()
          if (fetchedData) {
            // Ensure newsletter field exists for backward compatibility
            if (!fetchedData.newsletter) {
              fetchedData.newsletter = {
                heading: "Newsletter",
                description: "Subscribe to our newsletter to stay updated with the latest news, offers, and exclusive deals."
              }
            }
            
            // Convert old socialMedia object format to new array format for backward compatibility
            if (fetchedData.socialMedia && !Array.isArray(fetchedData.socialMedia)) {
              const oldSocialMedia = fetchedData.socialMedia as any
              fetchedData.socialMedia = []
              
              if (oldSocialMedia.facebook) {
                fetchedData.socialMedia.push({ name: "Facebook", url: oldSocialMedia.facebook, icon: "facebook" })
              }
              if (oldSocialMedia.instagram) {
                fetchedData.socialMedia.push({ name: "Instagram", url: oldSocialMedia.instagram, icon: "instagram" })
              }
              if (oldSocialMedia.tiktok) {
                fetchedData.socialMedia.push({ name: "TikTok", url: oldSocialMedia.tiktok, icon: "tiktok" })
              }
              if (oldSocialMedia.youtube) {
                fetchedData.socialMedia.push({ name: "YouTube", url: oldSocialMedia.youtube, icon: "youtube" })
              }
              if (oldSocialMedia.pinterest) {
                fetchedData.socialMedia.push({ name: "Pinterest", url: oldSocialMedia.pinterest, icon: "pinterest" })
              }
            }
            
            // Ensure socialMedia is an array (fallback to empty array if missing)
            if (!Array.isArray(fetchedData.socialMedia)) {
              fetchedData.socialMedia = []
            }
            
            setData(fetchedData)
          }
        }
      } catch (error) {
        console.error("Failed to fetch footer data:", error)
        // Use default data on error
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setNewsletterStatus(null)

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newsletterEmail }),
      })

      const result = await response.json()

      if (response.ok) {
        setNewsletterStatus({ type: "success", message: result.message || "Successfully subscribed!" })
        setNewsletterEmail("")
      } else {
        setNewsletterStatus({ type: "error", message: result.error || "Failed to subscribe. Please try again." })
      }
    } catch (error) {
      setNewsletterStatus({ type: "error", message: "An error occurred. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSocialIcon = (iconType: string) => {
    switch (iconType.toLowerCase()) {
      case "facebook":
        return <Facebook className="w-5 h-5" />
      case "instagram":
        return <Instagram className="w-5 h-5" />
      case "tiktok":
        return <Music2 className="w-5 h-5" />
      case "youtube":
        return <Youtube className="w-5 h-5" />
      case "twitter":
        return <Twitter className="w-5 h-5" />
      case "linkedin":
        return <Linkedin className="w-5 h-5" />
      case "github":
        return <Github className="w-5 h-5" />
      case "mail":
      case "email":
        return <Mail className="w-5 h-5" />
      case "pinterest":
        return <span className="font-bold text-lg">P</span>
      default:
        // For custom icons, you can use the first letter of the name or a generic icon
        return <span className="font-bold text-sm">?</span>
    }
  }

  if (loading) {
    return (
      <footer className="w-full bg-gray-900 py-12">
        <div className="container mx-auto px-4 text-white text-center">
          <p>Loading...</p>
        </div>
      </footer>
    )
  }

  return (
    <footer className="w-full bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 max-w-4xl">
          {/* Left Column: GET IN TOUCH */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg md:text-xl font-bold uppercase text-blue-600">
              {data.contact.heading}
            </h3>
            
            <div className="space-y-2 sm:space-y-3">
              <p className="font-bold text-white text-sm sm:text-base break-words">
                {data.contact.phone}
              </p>
              <p className="font-bold uppercase text-white text-xs sm:text-sm md:text-base break-words">
                {data.contact.email}
              </p>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <p className="text-white text-xs sm:text-sm md:text-base">
                {data.contact.hours.weekdays}
              </p>
              <p className="text-white text-xs sm:text-sm md:text-base">
                {data.contact.hours.weekends}
              </p>
            </div>

            {/* Social Media Icons */}
            <div className="flex gap-3 sm:gap-4 pt-2">
              {Array.isArray(data.socialMedia) && data.socialMedia.map((social, index) => (
                <Link
                  key={index}
                  href={social.url}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white flex items-center justify-center hover:bg-white hover:text-gray-900 transition-colors"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {renderSocialIcon(social.icon)}
                </Link>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-white pt-3 sm:pt-4 text-xs sm:text-sm md:text-base">
              Copyright © {new Date().getFullYear()} {data.copyright}
            </p>
          </div>

          {/* Right Column: Newsletter Subscription */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg md:text-xl font-bold uppercase text-blue-600">
              {data.newsletter.heading}
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <p className="text-white text-xs sm:text-sm md:text-base">
                {data.newsletter.description}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2 sm:space-y-3">
                <div className="space-y-2">
                  <Input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isSubmitting}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus-visible:ring-blue-600 w-full text-sm sm:text-base"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full text-sm sm:text-base py-2"
                  >
                    {isSubmitting ? "Subscribing..." : "Subscribe"}
                  </Button>
                </div>
                {newsletterStatus && (
                  <p
                    className={`text-xs sm:text-sm ${
                      newsletterStatus.type === "success"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {newsletterStatus.message}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Large Brand Text at Bottom */}
      <div className="relative w-full pb-0 overflow-hidden">
        <div className="w-full flex justify-center px-2">
          <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl 2xl:text-[180px] font-bold text-white whitespace-nowrap tracking-tight transform translate-y-[25%] overflow-hidden">
            SCORCHED FABRICS
          </h2>
        </div>
      </div>
    </footer>
  )
}
