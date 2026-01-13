"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { PenTool, Shirt } from "lucide-react"

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

const defaultData: AboutUsData = {
  heading: "ABOUT US",
  paragraph1: {
    icon: "pen",
    text: "Spreadshirt offers a creative platform for customizing over 250 products including clothing and accessories."
  },
  paragraph2: {
    icon: "shirt",
    text: "Explore our Marketplace to find unique designs by independent designers or use our tools to create personalized items with your graphics and photos."
  },
  button1: {
    text: "Create Now",
    link: "#"
  },
  button2: {
    text: "Shop Now",
    link: "#"
  },
  image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80"
}

export default function AboutUs() {
  const [data, setData] = useState<AboutUsData>(defaultData)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const fetchData = async () => {
      try {
        const response = await fetch("/api/about-us")
        if (response.ok) {
          const fetchedData = await response.json()
          if (fetchedData) {
            setData(fetchedData)
          }
        }
      } catch (error) {
        console.error("Failed to fetch about us data:", error)
        // Use default data on error
      }
    }

    fetchData()
  }, [])

  const renderIcon = (iconType: string) => {
    if (iconType === "pen") {
      return <PenTool className="w-6 h-6" />
    } else if (iconType === "shirt") {
      return <Shirt className="w-6 h-6" />
    }
    return null
  }

  return (
    <section className="w-full">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row">
          {/* Left Column - Content */}
          <div className="w-full lg:w-[45%] bg-white py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 px-4 sm:px-6 order-last lg:order-first">
            <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 md:mb-12 text-center">
              {data.heading}
            </h2>

            {/* Paragraph 1 */}
            <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-900 flex items-center justify-center">
                {renderIcon(data.paragraph1.icon)}
              </div>
              <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed pt-1 sm:pt-2">
                {data.paragraph1.text}
              </p>
            </div>

            {/* Paragraph 2 */}
            <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-12">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-900 flex items-center justify-center">
                {renderIcon(data.paragraph2.icon)}
              </div>
              <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed pt-1 sm:pt-2">
                {data.paragraph2.text}
              </p>
            </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="w-full lg:w-[55%] bg-white relative order-first lg:order-last">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:pl-12 xl:pl-16 py-4 sm:py-8 md:py-12 lg:py-16 xl:py-20">
              <div className="relative w-full aspect-[4/3] sm:aspect-[3/2] md:aspect-[4/3] lg:aspect-square rounded-lg overflow-hidden">
                <Image
                  src={data.image}
                  alt="About Us"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 55vw"
                  quality={85}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
