"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/contexts/CartContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { loadStripe, Stripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import StripePaymentForm from "./StripePaymentForm"

// Stripe will be loaded dynamically from API at runtime
let stripePromise: Promise<Stripe | null> | null = null

interface CheckoutProps {
  onBack: () => void
  onClose: () => void
}

interface CheckoutFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  notes: string
}

export default function Checkout({ onBack, onClose }: CheckoutProps) {
  const { cartItems, getTotalPrice, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [stripeLoaded, setStripeLoaded] = useState(false)
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    notes: "",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({})

  // Load Stripe publishable key from API at runtime (from Hostinger environment variables)
  useEffect(() => {
    const loadStripeKey = async () => {
      if (stripePromise) {
        setStripeLoaded(true)
        return
      }

      try {
        const response = await fetch('/api/stripe/config')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Failed to load Stripe config:', errorData)
          return
        }

        const data = await response.json()
        if (data.publishableKey) {
          stripePromise = loadStripe(data.publishableKey)
          setStripeLoaded(true)
        } else {
          console.error('No publishable key in response:', data)
        }
      } catch (error) {
        console.error('Error loading Stripe config:', error)
      }
    }

    loadStripeKey()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CheckoutFormData, string>> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address"
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.state.trim()) newErrors.state = "State is required"
    if (!formData.zipCode.trim()) newErrors.zipCode = "Zip code is required"
    if (!formData.country.trim()) newErrors.country = "Country is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Check if Stripe is loaded (from Hostinger environment variables)
    if (!stripeLoaded || !stripePromise) {
      try {
        const response = await fetch('/api/stripe/config')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          alert(
            "Payment system is not configured. Please contact support.\n\n" +
            "If you are the site administrator:\n" +
            "1. Set STRIPE_PUBLISHABLE_KEY in your Hostinger hosting environment variables\n" +
            "2. Restart the application (pm2 restart scorched-v2)\n\n" +
            "Note: Environment variables are read at runtime from Hostinger, not from .env files."
          )
          return
        }
        const data = await response.json()
        if (data.publishableKey) {
          stripePromise = loadStripe(data.publishableKey)
          setStripeLoaded(true)
        } else {
          alert("Payment system is not configured. Please set STRIPE_PUBLISHABLE_KEY in Hostinger environment variables.")
          return
        }
      } catch (error) {
        console.error('Error checking Stripe config:', error)
        alert("Payment system is not configured. Please contact support.")
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Create payment intent
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: getTotalPrice(),
          currency: "usd",
          metadata: {
            customerEmail: formData.email,
            customerName: `${formData.firstName} ${formData.lastName}`,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Payment intent API error:", errorData)
        throw new Error(errorData.error || "Failed to create payment intent")
      }

      const data = await response.json()
      
      if (!data.clientSecret) {
        console.error("No client secret in response:", data)
        throw new Error("Invalid response from payment server")
      }

      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.paymentIntentId)
      setShowPayment(true)
    } catch (error: any) {
      console.error("Payment intent error:", error)
      const errorMessage = error.message || "Failed to initialize payment. Please try again."
      
      // Show more specific error messages
      if (errorMessage.includes("Stripe is not configured") || errorMessage.includes("STRIPE_SECRET_KEY")) {
        alert(
          "Payment system is not configured. Please contact support.\n\n" +
          "If you are the site administrator:\n" +
          "1. Set STRIPE_SECRET_KEY in your Hostinger hosting environment variables\n" +
          "2. Restart the application (pm2 restart scorched-v2)\n\n" +
          "Note: Environment variables are read at runtime from Hostinger, not from .env files."
        )
      } else if (errorMessage.includes("Invalid amount")) {
        alert("Invalid payment amount. Please try again.")
      } else {
        alert(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Generate order ID first
      const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase()
      const orderId = `ORD-${Date.now()}-${randomSuffix}`

      // Determine order type from cart items (use first item's orderType, default to 'custom')
      const orderType = cartItems.length > 0 && cartItems[0].orderType 
        ? cartItems[0].orderType 
        : 'custom'

      // Create order after successful payment
      const orderData = {
        items: cartItems,
        customer: formData,
        total: getTotalPrice(),
        orderDate: new Date().toISOString(),
        paymentIntentId,
        status: "processing",
        orderId, // Pre-generate order ID to link with payment
        orderType,
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error("Failed to create order")
      }

      const result = await response.json()

      // Update payment intent metadata with order ID (for webhook)
      try {
        await fetch("/api/stripe/update-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentIntentId,
            metadata: { orderId: result.orderId },
          }),
        })
      } catch (updateError) {
        console.error("Failed to update payment intent metadata:", updateError)
        // Non-critical error, continue
      }

      // Clear cart and redirect to success
      clearCart()
      window.location.href = `/checkout/success?orderId=${result.orderId}`
    } catch (error) {
      console.error("Order creation error:", error)
      alert("Payment succeeded but failed to create order. Please contact support.")
    }
  }

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof CheckoutFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onBack}
      />
      
      {/* Checkout Modal */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b sticky top-0 bg-white z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={showPayment ? () => setShowPayment(false) : onBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-bold">
            {showPayment ? "Payment" : "Checkout"}
          </h2>
        </div>

        {/* Form */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            {!showPayment ? (
              <>
                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cartItems.map((item, index) => (
                        <div
                          key={`${item.id}-${item.size || 'no-size'}-${index}`}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.title} {item.size && `(Size: ${item.size})`} x {item.quantity}
                          </span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                        <span>Total:</span>
                        <span>${getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <form onSubmit={handleContinueToPayment}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm sm:text-base">First Name *</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={`text-sm sm:text-base ${errors.firstName ? "border-red-500" : ""}`}
                          />
                          {errors.firstName && (
                            <p className="text-xs sm:text-sm text-red-500">{errors.firstName}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm sm:text-base">Last Name *</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={`text-sm sm:text-base ${errors.lastName ? "border-red-500" : ""}`}
                          />
                          {errors.lastName && (
                            <p className="text-xs sm:text-sm text-red-500">{errors.lastName}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm sm:text-base">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`text-sm sm:text-base ${errors.email ? "border-red-500" : ""}`}
                        />
                        {errors.email && (
                          <p className="text-xs sm:text-sm text-red-500">{errors.email}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm sm:text-base">Phone *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`text-sm sm:text-base ${errors.phone ? "border-red-500" : ""}`}
                        />
                        {errors.phone && (
                          <p className="text-xs sm:text-sm text-red-500">{errors.phone}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shipping Address */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm sm:text-base">Address *</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className={`text-sm sm:text-base ${errors.address ? "border-red-500" : ""}`}
                        />
                        {errors.address && (
                          <p className="text-xs sm:text-sm text-red-500">{errors.address}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm sm:text-base">City *</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className={`text-sm sm:text-base ${errors.city ? "border-red-500" : ""}`}
                          />
                          {errors.city && (
                            <p className="text-xs sm:text-sm text-red-500">{errors.city}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-sm sm:text-base">State *</Label>
                          <Input
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className={`text-sm sm:text-base ${errors.state ? "border-red-500" : ""}`}
                          />
                          {errors.state && (
                            <p className="text-xs sm:text-sm text-red-500">{errors.state}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="zipCode" className="text-sm sm:text-base">Zip Code *</Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleChange}
                            className={`text-sm sm:text-base ${errors.zipCode ? "border-red-500" : ""}`}
                          />
                          {errors.zipCode && (
                            <p className="text-xs sm:text-sm text-red-500">{errors.zipCode}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-sm sm:text-base">Country *</Label>
                          <Input
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className={`text-sm sm:text-base ${errors.country ? "border-red-500" : ""}`}
                          />
                          {errors.country && (
                            <p className="text-xs sm:text-sm text-red-500">{errors.country}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Order Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          rows={3}
                          placeholder="Any special instructions or notes..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Continue to Payment Button */}
                  <div className="sticky bottom-0 bg-white pt-3 sm:pt-4 pb-4 sm:pb-6 border-t">
                    <Button
                      type="submit"
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white text-sm sm:text-base py-2 sm:py-2.5"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Continue to Payment"
                      )}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              clientSecret && stripePromise && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                    },
                  }}
                >
                  <StripePaymentForm
                    amount={getTotalPrice()}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    customerData={{
                      email: formData.email,
                      name: `${formData.firstName} ${formData.lastName}`,
                      address: {
                        line1: formData.address,
                        city: formData.city,
                        state: formData.state,
                        postal_code: formData.zipCode,
                        country: formData.country,
                      },
                    }}
                  />
                </Elements>
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}
