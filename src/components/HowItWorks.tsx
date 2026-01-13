"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { useProductSelection } from "@/contexts/ProductSelectionContext"

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

const defaultData: HowItWorksData = {
  heading: "HOW IT WORKS",
  subtitle: "Easily create custom t-shirts, hoodies, polos, hats & more online.",
  steps: [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&q=80",
      title: "Design Online",
      description: "We've made it super easy to create your custom shirts with our Design Studio. Choose from thousands of original clip art and fonts or upload your own images."
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
      title: "Expertly Printed",
      description: "Once you've designed your shirt you can leave the rest to us. We're experts at our trade and stand behind each and every shirt that leaves our facility."
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80",
      title: "Delivered To You",
      description: "You've got too much to do to be worried about your t-shirts. We ship them directly to your door so you can use that time elsewhere."
    }
  ],
  buttonText: "Get Started",
  buttonLink: "#"
}

export default function HowItWorks() {
  const [data, setData] = useState<HowItWorksData>(defaultData)
  const [mounted, setMounted] = useState(false)
  const { openModal } = useProductSelection()

  useEffect(() => {
    setMounted(true)
    
    const fetchData = async () => {
      try {
        const response = await fetch("/api/how-it-works")
        if (response.ok) {
          const fetchedData = await response.json()
          if (fetchedData) {
            setData(fetchedData)
          }
        }
      } catch (error) {
        console.error("Failed to fetch how it works data:", error)
        // Use default data on error
      }
    }

    fetchData()
  }, [])

  return (
    <section className="w-full bg-white py-16 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 px-4">
          {/* Title with blue underline */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 uppercase tracking-tight">
            {data.heading}
          </h2>
          
          {/* Blue underline */}
          <div className="w-16 sm:w-20 md:w-24 h-1 sm:h-1.5 bg-blue-600 mx-auto mb-4 sm:mb-6"></div>
          
          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-2xl mx-auto">
            {data.subtitle}
          </p>
        </div>

        {/* Three Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-12 md:mb-16 px-4">
          {data.steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center text-center">
              {/* Image */}
              <div className="relative w-full aspect-square mb-4 sm:mb-6 rounded-lg overflow-hidden">
                {step.image.startsWith('/uploads/') ? (
                  <img
                    src={step.image}
                    alt={step.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={85}
                    loading="lazy"
                  />
                )}
              </div>
              
              {/* Step Title */}
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                {step.title}
              </h3>
              
              {/* Separator Line */}
              <div className="w-10 sm:w-12 h-0.5 bg-gray-900 mb-3 sm:mb-4"></div>
              
              {/* Description */}
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Call to Action Button */}
        <div className="flex justify-center px-4">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base md:text-lg rounded-md transition-colors duration-300 shadow-md hover:shadow-lg cursor-pointer"
            onClick={openModal}
          >
            {data.buttonText}
            <ChevronRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
