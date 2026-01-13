"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { useProductSelection } from "@/contexts/ProductSelectionContext"

interface Slide {
  id: number
  image: string
  title: string
  description: string
  ctaText: string
  ctaButton: string
}

const defaultSlides: Slide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=80",
    title: "DESIGN YOUR OWN CUSTOM T-SHIRTS AND MORE",
    description: "Create your own t-shirts, tanks, hoodies and more in our online design studio.",
    ctaText: "Free Shipping on orders over $100 • No Minimums • Quality Guaranteed",
    ctaButton: "Create Your Shirt >",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1920&q=80",
    title: "TEAM APPAREL FOR YOUR BUSINESS",
    description: "Design custom team shirts for your group, organization, or event. Perfect for sports teams, companies, and special occasions.",
    ctaText: "Bulk Pricing Available • Quick Turnaround • Professional Quality",
    ctaButton: "Design Team Shirts >",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1920&q=80",
    title: "FUNDRAISING MERCHINDISE FOR YOUR EVENT",
    description: "Make your event memorable with custom apparel. From concerts to conferences, we've got you covered.",
    ctaText: "Event Discounts • Custom Graphics • Fast Production",
    ctaButton: "Start Your Event Merch >",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1920&q=80",
    title: "PERSONALIZED APPAREL",
    description: "Express yourself with unique designs. Create one-of-a-kind pieces that showcase your personality and style.",
    ctaText: "Unlimited Design Options • Print Anywhere • Satisfaction Guaranteed",
    ctaButton: "Create Custom Design >",
  },
]

export default function HeroSlider() {
  const [api, setApi] = useState<any>()
  const [current, setCurrent] = useState(0)
  const [slides, setSlides] = useState<Slide[]>(defaultSlides)
  const [mounted, setMounted] = useState(false)
  const { openModal } = useProductSelection()

  // Fetch slides from API
  useEffect(() => {
    setMounted(true)
    
    const fetchSlides = async () => {
      try {
        const response = await fetch("/api/hero-slides")
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            setSlides(data)
          }
        }
      } catch (error) {
        console.error("Failed to fetch slides:", error)
        // Use default slides on error
      }
    }

    fetchSlides()
  }, [])

  useEffect(() => {
    if (!api) return

    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  // Auto-play functionality
  useEffect(() => {
    if (!api || slides.length === 0) return

    const interval = setInterval(() => {
      api.scrollNext()
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [api, slides])

  if (!mounted || slides.length === 0) {
    return (
      <div className="relative w-full min-h-[640px] h-[640px] md:h-[700px] lg:h-[800px] flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  const currentSlide = slides[current]

  return (
    <div className="relative w-full min-h-[640px] h-[640px] md:h-[700px] lg:h-[800px]">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full h-full"
      >
        <CarouselContent className="-ml-0 h-full">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="pl-0 basis-full min-w-0 shrink-0 grow-0 h-full">
              <div className="relative w-full h-full">
                {/* Background Image */}
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority={slide.id === 1}
                  quality={85}
                  sizes="100vw"
                  loading={slide.id === 1 ? undefined : "lazy"}
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent z-10" />

                {/* Content */}
                <div className="relative h-full flex items-center z-20">
                  <div className="container mx-auto px-4 sm:px-6 md:px-8">
                    <div className="max-w-2xl">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight">
                        {slide.title}
                      </h1>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white mb-4 sm:mb-6 md:mb-8 max-w-xl">
                        {slide.description}
                      </p>
                      <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 font-semibold cursor-pointer"
                        onClick={openModal}
                      >
                        <span className="hidden sm:inline">Create Your Custom Order</span>
                        <span className="sm:hidden">Create Order</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Slide Indicators */}
      <div className="absolute bottom-16 sm:bottom-20 md:bottom-[104px] lg:bottom-[120px] left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`h-1.5 sm:h-2 rounded-full transition-all ${
              current === index
                ? "w-6 sm:w-8 bg-white"
                : "w-1.5 sm:w-2 bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
