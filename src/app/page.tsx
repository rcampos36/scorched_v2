import Header from "@/components/Header"
import HeroSlider from "@/components/HeroSlider"
import BestSellingShirts from "@/components/BestSellingShirts"
import AboutUs from "@/components/AboutUs"
import ImageGallery from "@/components/ImageGallery"
import HowItWorks from "@/components/HowItWorks"
import Footer from "@/components/Footer"
import Cart from "@/components/Cart"

export default function Home() {
  return (
    <div className="min-h-screen m-0 p-0 overflow-x-hidden">
      <Header />
      <HeroSlider />
      <BestSellingShirts />
      <AboutUs />
      <ImageGallery />
      <HowItWorks />
      <Footer />
      <Cart />
    </div>
  )
}
